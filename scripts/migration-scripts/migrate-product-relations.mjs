/**
 * Imports legacy product_categories into Nest product_categories.
 * Product variants are deliberately not used here; their attributes belong to
 * seller offers and are migrated separately.
 */
import { appendFile, writeFile } from 'node:fs/promises';
import {
  BATCH_SIZE,
  asBoolean,
  assertColumns,
  assertTables,
  newId,
  openLegacyConnection,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

const reportPath =
  process.env.MIGRATION_PRODUCT_RELATIONS_REPORT_PATH ||
  'migration-product-relations-report.jsonl';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: node scripts/migration-scripts/migrate-product-relations.mjs

Imports legacy product_categories after products, categories, and sub_categories.
Invalid source links are recorded in ${reportPath} and skipped.`);
  process.exit(0);
}

function add(total, count) {
  for (const key of Object.keys(total)) total[key] += count[key] || 0;
}

function legacyIdKey(value) {
  return value === null || value === undefined ? null : String(value);
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

async function writeReport(event) {
  await appendFile(reportPath, `${JSON.stringify(event)}\n`, 'utf8');
}

async function loadTargetMaps(target) {
  const [products] = await target.execute(
    "SELECT id, legacyId FROM products WHERE legacyTable = 'products'",
  );
  const [categories] = await target.execute(
    "SELECT id, legacyId FROM categories WHERE legacyTable = 'categories'",
  );
  const [subCategories] = await target.execute(
    "SELECT id, categoryId, legacyId FROM sub_categories WHERE legacyTable = 'sub_categories'",
  );
  return {
    products: new Map(
      products.map((row) => [legacyIdKey(row.legacyId), row.id]),
    ),
    categories: new Map(
      categories.map((row) => [legacyIdKey(row.legacyId), row.id]),
    ),
    subCategories: new Map(
      subCategories.map((row) => [legacyIdKey(row.legacyId), row]),
    ),
  };
}

async function migrateBatch(target, rows, offset, batch) {
  const maps = await loadTargetMaps(target);
  const count = {
    read: rows.length,
    added: 0,
    updated: 0,
    skipped: 0,
    missingProducts: 0,
    missingCategories: 0,
    missingSubCategories: 0,
    mismatches: 0,
  };

  await target.beginTransaction();
  try {
    for (const row of rows) {
      const productId = maps.products.get(legacyIdKey(row.productLegacyId));
      if (!productId) {
        await writeReport({
          type: 'missing-product',
          relationId: row.id,
          legacyProductId: row.productId,
          productLegacyId: row.productLegacyId,
        });
        count.missingProducts += 1;
        count.skipped += 1;
        continue;
      }

      const categoryId =
        row.categoryId === null
          ? null
          : maps.categories.get(legacyIdKey(row.categoryLegacyId));
      if (row.categoryId !== null && !categoryId) {
        await writeReport({
          type: 'missing-category',
          relationId: row.id,
          legacyProductId: row.productId,
          legacyCategoryId: row.categoryId,
          categoryLegacyId: row.categoryLegacyId,
        });
        count.missingCategories += 1;
        count.skipped += 1;
        continue;
      }

      const subCategory =
        row.subCategoryId === null
          ? null
          : maps.subCategories.get(legacyIdKey(row.subCategoryLegacyId));
      if (row.subCategoryId !== null && !subCategory) {
        await writeReport({
          type: 'missing-sub-category',
          relationId: row.id,
          legacyProductId: row.productId,
          legacySubCategoryId: row.subCategoryId,
          subCategoryLegacyId: row.subCategoryLegacyId,
        });
        count.missingSubCategories += 1;
        count.skipped += 1;
        continue;
      }

      if (!categoryId && !subCategory) {
        await writeReport({
          type: 'empty-category-relation',
          relationId: row.id,
          legacyProductId: row.productId,
        });
        count.skipped += 1;
        continue;
      }
      if (categoryId && subCategory && subCategory.categoryId !== categoryId) {
        await writeReport({
          type: 'category-sub-category-mismatch',
          relationId: row.id,
          legacyProductId: row.productId,
          targetCategoryId: categoryId,
          targetSubCategoryId: subCategory.id,
          subCategoryTargetCategoryId: subCategory.categoryId,
        });
        count.mismatches += 1;
        count.skipped += 1;
        continue;
      }

      const subCategoryId = subCategory?.id || null;
      const [existing] = await target.execute(
        'SELECT id FROM product_categories WHERE productId = ? AND categoryId <=> ? AND subCategoryId <=> ? LIMIT 1',
        [productId, categoryId, subCategoryId],
      );
      const values = [
        asBoolean(row.isPrimary) ? 1 : 0,
        Number.isFinite(Number(row.position)) ? Number(row.position) : 0,
        row.createdAt,
        row.updatedAt,
      ];
      if (existing[0]) {
        await target.execute(
          'UPDATE product_categories SET isPrimary = ?, position = ?, createdAt = ?, updatedAt = ? WHERE id = ?',
          [...values, existing[0].id],
        );
        count.updated += 1;
      } else {
        await target.execute(
          'INSERT INTO product_categories (id, productId, categoryId, subCategoryId, isPrimary, position, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [newId(), productId, categoryId, subCategoryId, ...values],
        );
        count.added += 1;
      }
    }
    await target.commit();
  } catch (error) {
    await target.rollback();
    throw error;
  }
  console.log(
    JSON.stringify({ entity: 'product_categories', batch, offset, ...count }),
  );
  return count;
}

async function main() {
  const sourceDatabase = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
  const targetDatabase = requiredEnv('DB_DATABASE');
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const totals = {
    read: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    missingProducts: 0,
    missingCategories: 0,
    missingSubCategories: 0,
    mismatches: 0,
  };
  try {
    await assertTables(
      source,
      sourceDatabase,
      ['product_categories', 'products', 'categories', 'sub_categories'],
      'Legacy',
    );
    await assertTables(
      target,
      targetDatabase,
      ['products', 'categories', 'sub_categories', 'product_categories'],
      'Target',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'product_categories',
      [
        'id',
        'productId',
        'categoryId',
        'subCategoryId',
        'isPrimary',
        'position',
        'createdAt',
        'updatedAt',
      ],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'products',
      ['id', 'legacyId'],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'categories',
      ['id', 'legacyId'],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'sub_categories',
      ['id', 'legacyId'],
      'Legacy',
    );
    await assertColumns(
      target,
      targetDatabase,
      'products',
      ['id', 'legacyId', 'legacyTable'],
      'Target',
    );
    await assertColumns(
      target,
      targetDatabase,
      'categories',
      ['id', 'legacyId', 'legacyTable'],
      'Target',
    );
    await assertColumns(
      target,
      targetDatabase,
      'sub_categories',
      ['id', 'categoryId', 'legacyId', 'legacyTable'],
      'Target',
    );

    await writeFile(
      reportPath,
      `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`,
      'utf8',
    );
    const batches = await readBatches(
      source,
      `SELECT pc.id, pc.productId, pc.categoryId, pc.subCategoryId, pc.isPrimary, pc.position,
              pc.createdAt, pc.updatedAt, p.legacyId AS productLegacyId,
              c.legacyId AS categoryLegacyId, sc.legacyId AS subCategoryLegacyId
       FROM product_categories pc
       LEFT JOIN products p ON p.id = pc.productId
       LEFT JOIN categories c ON c.id = pc.categoryId
       LEFT JOIN sub_categories sc ON sc.id = pc.subCategoryId
       ORDER BY pc.id`,
      async (rows, offset, batch) =>
        add(totals, await migrateBatch(target, rows, offset, batch)),
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
