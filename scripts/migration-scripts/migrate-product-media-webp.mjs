/**
 * Marks all product-linked legacy JPEG/PNG media as WebP after their physical
 * WebP copies have been uploaded to SeaweedFS.
 *
 * URL remapping belongs to a later migration once the public SeaweedFS media
 * URL is finalised.
 */
import { appendFile, writeFile } from 'node:fs/promises';
import {
  assertColumns,
  assertTables,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

const reportPath = '/tmp/migration-product-media-webp-report.jsonl';
const BATCH_SIZE = 500;

async function report(event) {
  await appendFile(reportPath, `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`);
}

function relativeUploadPath(url) {
  const marker = '/wp-content/uploads/';
  const pathname = String(url).split(/[?#]/, 1)[0];
  const index = pathname.indexOf(marker);
  return index < 0 ? null : pathname.slice(index + marker.length);
}

function webpOutputPath(relativePath) {
  return relativePath.replace(/\.(jpe?g|png)$/i, '.webp');
}

async function main() {
  const target = await openTargetConnection();
  try {
    const database = requiredEnv('DB_DATABASE');
    await assertTables(target, database, ['media', 'product_media'], 'Target');
    await assertColumns(target, database, 'media', ['id', 'url', 'mimeType'], 'Target');
    await assertColumns(target, database, 'product_media', ['mediaId'], 'Target');

    await writeFile(
      reportPath,
      `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`,
      'utf8',
    );

    const [rows] = await target.execute(
      `SELECT DISTINCT m.id, m.legacyId, m.legacyTable, m.url, m.mimeType
       FROM product_media pm
       INNER JOIN media m ON m.id = pm.mediaId
       WHERE m.legacyId IS NOT NULL
         AND m.legacyTable IS NOT NULL
         AND TRIM(m.legacyTable) <> ''
         AND m.url LIKE '%/wp-content/uploads/%'
         AND (
           LOWER(m.mimeType) IN ('image/jpeg', 'image/png')
           OR LOWER(m.url) REGEXP '\\.(jpe?g|png)([?#].*)?$'
         )`,
    );

    const outputSources = new Map();
    for (const row of rows) {
      const sourcePath = relativeUploadPath(row.url);
      if (!sourcePath) continue;
      const outputPath = webpOutputPath(sourcePath);
      if (!outputSources.has(outputPath)) outputSources.set(outputPath, new Set());
      outputSources.get(outputPath).add(sourcePath);
    }
    const collisions = new Set(
      [...outputSources.entries()]
        .filter(([, sources]) => sources.size > 1)
        .map(([outputPath]) => outputPath),
    );

    console.log(JSON.stringify({
      type: 'media-webp-selection-complete',
      selected: rows.length,
      batchSize: BATCH_SIZE,
    }));

    let updated = 0;
    let unchanged = 0;
    let skippedCollisions = 0;
    const idsToUpdate = [];
    for (const row of rows) {
      const sourcePath = relativeUploadPath(row.url);
      const outputPath = sourcePath ? webpOutputPath(sourcePath) : null;
      if (outputPath && collisions.has(outputPath)) {
        skippedCollisions += 1;
        await report({
          type: 'skipped-ambiguous-webp-output',
          mediaId: row.id,
          sourcePath,
          outputPath,
        });
        continue;
      }
      if (String(row.mimeType).toLowerCase() === 'image/webp') {
        unchanged += 1;
        continue;
      }
      idsToUpdate.push(row.id);
    }

    for (let offset = 0; offset < idsToUpdate.length; offset += BATCH_SIZE) {
      const ids = idsToUpdate.slice(offset, offset + BATCH_SIZE);
      const placeholders = ids.map(() => '?').join(', ');
      const [result] = await target.execute(
        `UPDATE media
         SET mimeType = 'image/webp'
         WHERE id IN (${placeholders})
           AND mimeType <> 'image/webp'`,
        ids,
      );
      updated += result.affectedRows;

      const progress = {
        type: 'media-webp-progress',
        batch: Math.floor(offset / BATCH_SIZE) + 1,
        processed: Math.min(offset + ids.length, idsToUpdate.length),
        eligible: idsToUpdate.length,
        updated,
      };
      console.log(JSON.stringify(progress));
      await report(progress);
    }

    const summary = {
      type: 'run-complete',
      complete: true,
      selected: rows.length,
      updated,
      unchanged,
      skippedCollisions,
      reportPath,
      note: 'All years were processed. Only mimeType was updated; media.url and products.image URLs remain unchanged.',
    };
    await report(summary);
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await target.end();
  }
}

await main();
