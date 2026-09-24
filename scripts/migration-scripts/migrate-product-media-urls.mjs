/**
 * Repoints product-linked legacy WordPress media at the WebP objects already
 * uploaded to SeaweedFS:
 *
 *   /wp-content/uploads/2026/09/a.jpg
 *   → https://static.didnegar.net/optimized-wordpress/2026/09/a.webp
 *
 * The object is HEAD-checked in SeaweedFS before either media.url or the
 * denormalised products.image JSON is changed. Therefore it is safe to rerun.
 */
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { appendFile, writeFile } from 'node:fs/promises';
import {
  assertColumns,
  assertTables,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

const REPORT_PATH = '/tmp/migration-product-media-urls-report.jsonl';
const VERIFY_CONCURRENCY = 20;
const UPDATE_BATCH_SIZE = 500;

async function report(event) {
  await appendFile(
    REPORT_PATH,
    `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`,
  );
}

function relativeUploadPath(url) {
  const marker = '/wp-content/uploads/';
  const pathname = String(url ?? '').split(/[?#]/, 1)[0];
  const index = pathname.indexOf(marker);
  return index < 0 ? null : pathname.slice(index + marker.length);
}

function relativeOptimizedPath(url) {
  const marker = '/optimized-wordpress/';
  const pathname = String(url ?? '').split(/[?#]/, 1)[0];
  const index = pathname.indexOf(marker);
  return index < 0 ? null : pathname.slice(index + marker.length);
}

function relativeMediaPath(url) {
  return relativeUploadPath(url) ?? relativeOptimizedPath(url);
}

function toWebpPath(relativePath) {
  return relativePath.replace(/\.(jpe?g|png)$/i, '.webp');
}

function parseImage(value) {
  if (!value) return { featuredImg: null, gallery: [] };
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { featuredImg: null, gallery: [] };
    }
    return {
      featuredImg:
        typeof parsed.featuredImg === 'string' ? parsed.featuredImg : null,
      gallery: Array.isArray(parsed.gallery)
        ? parsed.gallery.filter((item) => typeof item === 'string')
        : [],
    };
  } catch {
    return null;
  }
}

function replaceLegacyUrl(url, replacementByRelativePath) {
  if (typeof url !== 'string') return url;
  const relativePath = relativeMediaPath(url);
  return relativePath ? (replacementByRelativePath.get(relativePath) ?? url) : url;
}

async function concurrent(items, concurrency, worker) {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const item = items[cursor];
        cursor += 1;
        await worker(item, cursor);
      }
    }),
  );
}

function createSeaweedClient() {
  return new S3Client({
    endpoint: requiredEnv('SEAWEED_S3_ENDPOINT'),
    region: process.env.SEAWEED_S3_REGION?.trim() || 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredEnv('SEAWEED_S3_ACCESS_KEY'),
      secretAccessKey: requiredEnv('SEAWEED_S3_SECRET_KEY'),
    },
  });
}

function isNotFound(error) {
  return error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound';
}

async function updateMediaUrls(connection, mappings) {
  let updated = 0;
  for (let offset = 0; offset < mappings.length; offset += UPDATE_BATCH_SIZE) {
    const batch = mappings.slice(offset, offset + UPDATE_BATCH_SIZE);
    const cases = batch.map(() => 'WHEN ? THEN ?').join(' ');
    const ids = batch.map(() => '?').join(', ');
    const params = [
      ...batch.flatMap((item) => [item.mediaId, item.publicUrl]),
      ...batch.map((item) => item.mediaId),
    ];
    const [result] = await connection.execute(
      `UPDATE media
       SET url = CASE id ${cases} ELSE url END
       WHERE id IN (${ids})`,
      params,
    );
    updated += result.affectedRows;
    const progress = {
      type: 'media-url-progress',
      processed: Math.min(offset + batch.length, mappings.length),
      eligible: mappings.length,
      updated,
    };
    console.log(JSON.stringify(progress));
    await report(progress);
  }
  return updated;
}

async function updateProductImageUrls(connection, productRows, replacementByRelativePath) {
  let updated = 0;
  let invalidImageJson = 0;
  for (const product of productRows) {
    const image = parseImage(product.image);
    if (!image) {
      invalidImageJson += 1;
      await report({ type: 'invalid-product-image-json', productId: product.id });
      continue;
    }
    const next = {
      featuredImg: replaceLegacyUrl(image.featuredImg, replacementByRelativePath),
      gallery: image.gallery.map((url) =>
        replaceLegacyUrl(url, replacementByRelativePath),
      ),
    };
    if (JSON.stringify(next) === JSON.stringify(image)) continue;
    await connection.execute('UPDATE products SET image = CAST(? AS JSON) WHERE id = ?', [
      JSON.stringify(next),
      product.id,
    ]);
    updated += 1;
    if (updated % UPDATE_BATCH_SIZE === 0) {
      const progress = {
        type: 'product-image-url-progress',
        scanned: productRows.indexOf(product) + 1,
        selectedProducts: productRows.length,
        updated,
      };
      console.log(JSON.stringify(progress));
      await report(progress);
    }
  }
  return { updated, invalidImageJson };
}

async function main() {
  const target = await openTargetConnection();
  try {
    const database = requiredEnv('DB_DATABASE');
    const bucket = requiredEnv('SEAWEED_S3_BUCKET');
    const publicBaseUrl = requiredEnv('MEDIA_PUBLIC_BASE_URL').replace(/\/$/, '');
    await assertTables(target, database, ['media', 'product_media', 'products'], 'Target');
    await assertColumns(target, database, 'media', ['id', 'legacyId', 'legacyTable', 'url', 'mimeType'], 'Target');
    await assertColumns(target, database, 'product_media', ['productId', 'mediaId'], 'Target');
    await assertColumns(target, database, 'products', ['id', 'image'], 'Target');
    await writeFile(REPORT_PATH, `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`);

    const [rows] = await target.execute(
      `SELECT DISTINCT pm.productId, m.id AS mediaId, m.url
       FROM product_media pm
       INNER JOIN media m ON m.id = pm.mediaId
       WHERE m.legacyId IS NOT NULL
         AND m.legacyTable IS NOT NULL
         AND TRIM(m.legacyTable) <> ''
         AND LOWER(m.mimeType) = 'image/webp'
         AND (
           m.url LIKE '%/wp-content/uploads/%'
           OR m.url LIKE '%/optimized-wordpress/%'
         )`,
    );

    const sourcePathsByTarget = new Map();
    for (const row of rows) {
      const sourcePath = relativeMediaPath(row.url);
      if (!sourcePath) continue;
      const objectKey = `optimized-wordpress/${toWebpPath(sourcePath)}`;
      if (!sourcePathsByTarget.has(objectKey)) sourcePathsByTarget.set(objectKey, new Set());
      sourcePathsByTarget.get(objectKey).add(sourcePath);
    }
    const collisions = new Set(
      [...sourcePathsByTarget.entries()]
        .filter(([, sources]) => sources.size > 1)
        .map(([objectKey]) => objectKey),
    );

    const candidates = [];
    for (const row of rows) {
      const sourcePath = relativeMediaPath(row.url);
      if (!sourcePath) continue;
      const objectKey = `optimized-wordpress/${toWebpPath(sourcePath)}`;
      if (collisions.has(objectKey)) {
        await report({ type: 'skipped-ambiguous-webp-output', mediaId: row.mediaId, sourcePath, objectKey });
        continue;
      }
      candidates.push({
        productId: row.productId,
        mediaId: row.mediaId,
        sourcePath,
        objectKey,
        publicUrl: `${publicBaseUrl}/${objectKey}`,
      });
    }

    console.log(JSON.stringify({
      type: 'storage-verification-started',
      selected: rows.length,
      candidates: candidates.length,
      skippedCollisions: rows.length - candidates.length,
      concurrency: VERIFY_CONCURRENCY,
    }));

    const s3 = createSeaweedClient();
    const verified = [];
    let missingObjects = 0;
    await concurrent(candidates, VERIFY_CONCURRENCY, async (candidate, processed) => {
      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: candidate.objectKey }));
        verified.push(candidate);
      } catch (error) {
        if (!isNotFound(error)) throw error;
        missingObjects += 1;
        await report({ type: 'missing-seaweed-object', mediaId: candidate.mediaId, objectKey: candidate.objectKey });
      }
      if (processed % UPDATE_BATCH_SIZE === 0 || processed === candidates.length) {
        console.log(JSON.stringify({
          type: 'storage-verification-progress',
          processed,
          candidates: candidates.length,
          verified: verified.length,
          missingObjects,
        }));
      }
    });

    const uniqueMediaMappings = [...new Map(verified.map((item) => [item.mediaId, item])).values()];
    const replacementByRelativePath = new Map(
      uniqueMediaMappings.flatMap((item) => [
        [item.sourcePath, item.publicUrl],
        [toWebpPath(item.sourcePath), item.publicUrl],
      ]),
    );
    const mediaUrlsUpdated = await updateMediaUrls(target, uniqueMediaMappings);

    const productIds = [...new Set(verified.map((item) => item.productId))];
    const productRows = [];
    for (let offset = 0; offset < productIds.length; offset += UPDATE_BATCH_SIZE) {
      const ids = productIds.slice(offset, offset + UPDATE_BATCH_SIZE);
      const [batch] = await target.execute(
        `SELECT id, image FROM products WHERE id IN (${ids.map(() => '?').join(', ')})`,
        ids,
      );
      productRows.push(...batch);
    }
    const productResult = await updateProductImageUrls(target, productRows, replacementByRelativePath);

    const summary = {
      type: 'run-complete',
      complete: true,
      selectedMedia: rows.length,
      verifiedMedia: uniqueMediaMappings.length,
      missingObjects,
      skippedCollisions: rows.length - candidates.length,
      mediaUrlsUpdated,
      selectedProducts: productRows.length,
      productImageUrlsUpdated: productResult.updated,
      invalidProductImageJson: productResult.invalidImageJson,
      reportPath: REPORT_PATH,
    };
    await report(summary);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await target.end();
  }
}

await main();
