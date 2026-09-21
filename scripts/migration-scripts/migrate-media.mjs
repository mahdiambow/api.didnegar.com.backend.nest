/** Imports legacy media metadata into the Nest database's legacy-compatible media table. */
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
  process.env.MIGRATION_MEDIA_REPORT_PATH || 'migration-media-report.jsonl';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: node scripts/migration-scripts/migrate-media.mjs

Imports legacy media into the Nest database's media table.
Run the Nest schema migration first. Conflicts are recorded in ${reportPath}.`);
  process.exit(0);
}

function add(total, count) {
  for (const key of Object.keys(total)) total[key] += count[key] || 0;
}

function sourceKey(legacyTable, legacyId) {
  return `${legacyTable}\u0000${String(legacyId)}`;
}

async function writeReport(event) {
  await appendFile(reportPath, `${JSON.stringify(event)}\n`, 'utf8');
}

async function readBatches(source, onBatch) {
  let offset = 0;
  let batch = 0;
  while (true) {
    const [rows] = await source.execute(
      `SELECT id, legacyId, legacyTable, filename, mimeType, title, altText, url, createdAt, updatedAt
       FROM media ORDER BY legacyId, id LIMIT ? OFFSET ?`,
      [BATCH_SIZE, offset],
    );
    if (!rows.length) return batch;
    batch += 1;
    await onBatch(rows, offset, batch);
    offset += rows.length;
    if (rows.length < BATCH_SIZE) return batch;
  }
}

async function main() {
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  try {
    await assertTables(
      source,
      requiredEnv('LEGACY_MIGRATED_DB_DATABASE'),
      ['media'],
      'Legacy',
    );
    await assertColumns(
      source,
      requiredEnv('LEGACY_MIGRATED_DB_DATABASE'),
      'media',
      [
        'id',
        'legacyId',
        'legacyTable',
        'filename',
        'mimeType',
        'title',
        'altText',
        'url',
        'createdAt',
        'updatedAt',
      ],
      'Legacy',
    );
    await assertTables(target, requiredEnv('DB_DATABASE'), ['media'], 'Target');
    await assertColumns(
      target,
      requiredEnv('DB_DATABASE'),
      'media',
      [
        'id',
        'legacyId',
        'legacyTable',
        'filename',
        'mimeType',
        'title',
        'altText',
        'url',
        'createdAt',
        'updatedAt',
      ],
      'Target',
    );

    await writeFile(
      reportPath,
      `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`,
      'utf8',
    );
    const [existingRows] = await target.execute(
      'SELECT id, legacyId, legacyTable, filename FROM media',
    );
    const byId = new Map(existingRows.map((row) => [row.id, row]));
    const bySource = new Map(
      existingRows.map((row) => [
        sourceKey(row.legacyTable, row.legacyId),
        row,
      ]),
    );
    const byFilename = new Map(existingRows.map((row) => [row.filename, row]));
    const totals = { read: 0, added: 0, updated: 0, skipped: 0, conflicts: 0 };

    const batchCount = await readBatches(
      source,
      async (rows, offset, batch) => {
        const count = {
          read: rows.length,
          added: 0,
          updated: 0,
          skipped: 0,
          conflicts: 0,
        };
        await target.beginTransaction();
        try {
          for (const row of rows) {
            const existingById = byId.get(row.id);
            const existingBySource = bySource.get(
              sourceKey(row.legacyTable, row.legacyId),
            );
            const existingByFilename = byFilename.get(row.filename);
            const known = existingById || existingBySource;

            if (
              (existingById &&
                existingBySource &&
                existingById.id !== existingBySource.id) ||
              (existingBySource && existingBySource.id !== row.id) ||
              (existingByFilename && existingByFilename.id !== row.id)
            ) {
              await writeReport({
                type: 'identity-or-filename-conflict',
                legacyMediaId: row.id,
                legacyId: row.legacyId,
                legacyTable: row.legacyTable,
                filename: row.filename,
                targetIdByLegacyId: existingBySource?.id ?? null,
                targetIdByFilename: existingByFilename?.id ?? null,
              });
              count.conflicts += 1;
              count.skipped += 1;
              continue;
            }

            const values = [
              row.id,
              row.legacyId,
              row.legacyTable,
              row.filename,
              row.mimeType,
              row.title,
              row.altText,
              row.url,
              row.createdAt,
              row.updatedAt,
            ];
            if (known) {
              await target.execute(
                `UPDATE media SET legacyId = ?, legacyTable = ?, filename = ?, mimeType = ?, title = ?, altText = ?, url = ?, createdAt = ?, updatedAt = ? WHERE id = ?`,
                [...values.slice(1), known.id],
              );
              count.updated += 1;
            } else {
              await target.execute(
                `INSERT INTO media (id, legacyId, legacyTable, filename, mimeType, title, altText, url, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                values,
              );
              count.added += 1;
            }
            const record = { ...row };
            byId.set(record.id, record);
            bySource.set(
              sourceKey(record.legacyTable, record.legacyId),
              record,
            );
            byFilename.set(record.filename, record);
          }
          await target.commit();
        } catch (error) {
          await target.rollback();
          throw error;
        }
        console.log(
          JSON.stringify({ entity: 'media', batch, offset, ...count }),
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
