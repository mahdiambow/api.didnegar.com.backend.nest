/** Links imported legacy products to imported brands through preserved legacy identities. */
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
  process.env.MIGRATION_PRODUCT_BRANDS_REPORT_PATH ||
  'migration-product-brands-report.jsonl';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: node scripts/migration-scripts/migrate-product-brands.mjs

Links imported products to imported brands by legacyTable + legacyId.
Run after db:migrate:brands and db:migrate:catalog. Problems are recorded in ${reportPath}.`);
  process.exit(0);
}

function add(total, count) {
  for (const key of Object.keys(total)) total[key] += count[key] || 0;
}

function legacyIdKey(value) {
  return value === null || value === undefined ? null : String(value);
}

function sourceKey(legacyTable, legacyId) {
  return `${legacyTable}\u0000${legacyIdKey(legacyId)}`;
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

async function loadTargetMaps(target) {
  const [products] = await target.execute(
    "SELECT id, legacyId FROM products WHERE legacyTable = 'products' AND legacyId IS NOT NULL",
  );
  const [brands] = await target.execute(
    'SELECT id, legacyId, legacyTable FROM brands WHERE legacyId IS NOT NULL AND legacyTable IS NOT NULL',
  );
  return {
    products: new Map(
      products.map((row) => [legacyIdKey(row.legacyId), String(row.id)]),
    ),
    brands: new Map(
      brands.map((row) => [
        sourceKey(row.legacyTable, row.legacyId),
        String(row.id),
      ]),
    ),
  };
}

async function main() {
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const totals = {
    read: 0,
    linked: 0,
    cleared: 0,
    skipped: 0,
    missingProducts: 0,
    missingLegacyBrands: 0,
    missingImportedBrands: 0,
  };

  try {
    const sourceDatabase = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
    const targetDatabase = requiredEnv('DB_DATABASE');
    await assertTables(
      source,
      sourceDatabase,
      ['products', 'brands'],
      'Legacy',
    );
    await assertTables(
      target,
      targetDatabase,
      ['products', 'brands'],
      'Target',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'products',
      ['id', 'legacyId', 'brandId'],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'brands',
      ['id', 'legacyId', 'legacyTable'],
      'Legacy',
    );
    await assertColumns(
      target,
      targetDatabase,
      'products',
      ['id', 'legacyId', 'legacyTable', 'brandId'],
      'Target',
    );
    await assertColumns(
      target,
      targetDatabase,
      'brands',
      ['id', 'legacyId', 'legacyTable'],
      'Target',
    );

    await writeFile(
      reportPath,
      `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`,
      'utf8',
    );
    const maps = await loadTargetMaps(target);
    const batches = await readBatches(
      source,
      `SELECT product_row.id AS legacyProductId,
              product_row.legacyId AS productLegacyId,
              product_row.brandId AS legacyBrandId,
              brand_row.id AS legacyBrandSourceId,
              brand_row.legacyId AS brandLegacyId,
              brand_row.legacyTable AS brandLegacyTable
       FROM products product_row
       LEFT JOIN brands brand_row ON brand_row.id = product_row.brandId
       ORDER BY product_row.legacyId, product_row.id`,
      async (rows, offset, batch) => {
        const count = {
          read: rows.length,
          linked: 0,
          cleared: 0,
          skipped: 0,
          missingProducts: 0,
          missingLegacyBrands: 0,
          missingImportedBrands: 0,
        };
        await target.beginTransaction();
        try {
          for (const row of rows) {
            const productId = maps.products.get(
              legacyIdKey(row.productLegacyId),
            );
            if (!productId) {
              await writeReport({ type: 'missing-product', ...row });
              count.missingProducts += 1;
              count.skipped += 1;
              continue;
            }
            if (row.legacyBrandId === null) {
              await target.execute(
                'UPDATE products SET brandId = NULL WHERE id = ?',
                [productId],
              );
              count.cleared += 1;
              continue;
            }
            if (!row.legacyBrandSourceId) {
              await writeReport({
                type: 'missing-legacy-brand',
                targetProductId: productId,
                ...row,
              });
              count.missingLegacyBrands += 1;
              count.skipped += 1;
              continue;
            }
            const brandId = maps.brands.get(
              sourceKey(row.brandLegacyTable, row.brandLegacyId),
            );
            if (!brandId) {
              await writeReport({
                type: 'missing-imported-brand',
                targetProductId: productId,
                ...row,
              });
              count.missingImportedBrands += 1;
              count.skipped += 1;
              continue;
            }
            await target.execute(
              'UPDATE products SET brandId = ? WHERE id = ?',
              [brandId, productId],
            );
            count.linked += 1;
          }
          await target.commit();
        } catch (error) {
          await target.rollback();
          throw error;
        }
        console.log(
          JSON.stringify({ entity: 'product_brands', batch, offset, ...count }),
        );
        add(totals, count);
      },
    );

    const result = { complete: true, batches, totals, reportPath };
    await writeReport({ type: 'run-complete', ...result });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
