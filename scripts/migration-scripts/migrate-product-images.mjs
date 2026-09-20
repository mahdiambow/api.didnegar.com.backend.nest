/**
 * Maps legacy product-variant image URLs into the existing products.image JSON:
 * { featuredImg: string | null, gallery: string[] }.
 *
 * Target product_variants and seller_offers are deliberately not involved.
 */
import { appendFile, writeFile } from 'node:fs/promises';
import {
  BATCH_SIZE,
  assertColumns,
  assertTables,
  openLegacyConnection,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

const reportPath =
  process.env.MIGRATION_PRODUCT_IMAGES_REPORT_PATH ||
  'migration-product-images-report.jsonl';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: node scripts/migration-scripts/migrate-product-images.mjs

Maps legacy product_variant_images/media URLs into products.image.
Run after db:migrate:catalog. Invalid source links are recorded in ${reportPath}.`);
  process.exit(0);
}

function add(total, count) {
  for (const key of Object.keys(total)) total[key] += count[key] || 0;
}

function legacyIdKey(value) {
  return value === null || value === undefined ? null : String(value);
}

function normalizeImage(value) {
  let image = value;
  if (typeof image === 'string') {
    try {
      image = JSON.parse(image);
    } catch {
      image = null;
    }
  }

  const featuredImg =
    typeof image?.featuredImg === 'string' && image.featuredImg.trim()
      ? image.featuredImg.trim()
      : null;
  const gallery = Array.isArray(image?.gallery)
    ? [
        ...new Set(
          image.gallery
            .filter((url) => typeof url === 'string' && url.trim())
            .map((url) => url.trim()),
        ),
      ]
    : [];
  return { featuredImg, gallery };
}

async function writeReport(event) {
  await appendFile(reportPath, `${JSON.stringify(event)}\n`, 'utf8');
}

async function readBatches(source, sql, onBatch) {
  let offset = 0;
  let batch = 0;
  while (true) {
    const [rows] = await source.execute(`${sql} LIMIT ? OFFSET ?`, [
      BATCH_SIZE,
      offset,
    ]);
    if (!rows.length) return batch;
    batch += 1;
    await onBatch(rows, offset, batch);
    offset += rows.length;
    if (rows.length < BATCH_SIZE) return batch;
  }
}

async function loadTargetProducts(target) {
  const [rows] = await target.execute(
    "SELECT id, legacyId, image FROM products WHERE legacyTable = 'products'",
  );
  const byLegacyId = new Map(
    rows.map((row) => [
      legacyIdKey(row.legacyId),
      { id: row.id, image: normalizeImage(row.image) },
    ]),
  );
  return {
    byLegacyId,
    byId: new Map(
      [...byLegacyId.values()].map((product) => [product.id, product]),
    ),
  };
}

async function main() {
  const source = await openLegacyConnection();
  const target = await openTargetConnection();

  try {
    const legacyDatabase = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
    const targetDatabase = requiredEnv('DB_DATABASE');
    await assertTables(
      source,
      legacyDatabase,
      ['products', 'product_variants', 'product_variant_images', 'media'],
      'Legacy',
    );
    await assertColumns(
      source,
      legacyDatabase,
      'products',
      ['id', 'legacyId'],
      'Legacy',
    );
    await assertColumns(
      source,
      legacyDatabase,
      'product_variants',
      ['id', 'productId'],
      'Legacy',
    );
    await assertColumns(
      source,
      legacyDatabase,
      'product_variant_images',
      ['id', 'productVariantId', 'mediaId', 'sortOrder', 'isPrimary'],
      'Legacy',
    );
    await assertColumns(
      source,
      legacyDatabase,
      'media',
      ['id', 'url'],
      'Legacy',
    );
    await assertTables(target, targetDatabase, ['products'], 'Target');
    await assertColumns(
      target,
      targetDatabase,
      'products',
      ['id', 'legacyId', 'legacyTable', 'image'],
      'Target',
    );

    await writeFile(
      reportPath,
      `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`,
      'utf8',
    );
    const targetProducts = await loadTargetProducts(target);
    const initialized = new Set();
    const totals = {
      read: 0,
      updatedProducts: 0,
      unchangedProducts: 0,
      skipped: 0,
      missingProducts: 0,
      missingMediaUrls: 0,
    };

    const batchCount = await readBatches(
      source,
      `SELECT
         pvi.id AS variantImageId,
         pvi.productVariantId,
         pvi.mediaId,
         pvi.sortOrder,
         pvi.isPrimary,
         p.legacyId AS productLegacyId,
         media.url AS mediaUrl
       FROM product_variant_images pvi
       INNER JOIN product_variants pv ON pv.id = pvi.productVariantId
       INNER JOIN products p ON p.id = pv.productId
       LEFT JOIN media ON media.id = pvi.mediaId
       ORDER BY p.legacyId, pvi.isPrimary DESC, pvi.sortOrder ASC, pvi.id ASC`,
      async (rows, offset, batch) => {
        const count = {
          read: rows.length,
          updatedProducts: 0,
          unchangedProducts: 0,
          skipped: 0,
          missingProducts: 0,
          missingMediaUrls: 0,
        };
        const changedProductIds = new Set();

        for (const row of rows) {
          const targetProduct = targetProducts.byLegacyId.get(
            legacyIdKey(row.productLegacyId),
          );
          if (!targetProduct) {
            await writeReport({
              type: 'missing-product',
              variantImageId: row.variantImageId,
              productVariantId: row.productVariantId,
              productLegacyId: row.productLegacyId,
            });
            count.missingProducts += 1;
            count.skipped += 1;
            continue;
          }

          const url =
            typeof row.mediaUrl === 'string' ? row.mediaUrl.trim() : '';
          if (!url) {
            await writeReport({
              type: 'missing-media-url',
              variantImageId: row.variantImageId,
              productVariantId: row.productVariantId,
              mediaId: row.mediaId,
              productLegacyId: row.productLegacyId,
            });
            count.missingMediaUrls += 1;
            count.skipped += 1;
            continue;
          }

          if (!initialized.has(targetProduct.id)) {
            // Variant images are authoritative for this product. Start with a
            // clean value once, then preserve ordered data across batches.
            targetProduct.image = { featuredImg: null, gallery: [] };
            initialized.add(targetProduct.id);
          }
          if (!targetProduct.image.featuredImg)
            targetProduct.image.featuredImg = url;
          if (!targetProduct.image.gallery.includes(url)) {
            targetProduct.image.gallery.push(url);
          }
          changedProductIds.add(targetProduct.id);
        }

        await target.beginTransaction();
        try {
          for (const productId of changedProductIds) {
            const targetProduct = targetProducts.byId.get(productId);
            await target.execute(
              'UPDATE products SET image = CAST(? AS JSON) WHERE id = ?',
              [JSON.stringify(targetProduct.image), productId],
            );
            count.updatedProducts += 1;
          }
          await target.commit();
        } catch (error) {
          await target.rollback();
          throw error;
        }

        console.log(
          JSON.stringify({ entity: 'product_images', batch, offset, ...count }),
        );
        add(totals, count);
      },
    );

    const summary = {
      complete: true,
      batches: batchCount,
      ...totals,
      reportPath,
    };
    await writeReport({ type: 'run-complete', ...summary });
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
