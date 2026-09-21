/**
 * Builds each legacy product's display specifications from its variant
 * attributes and removes those migrated selections from products.price[].
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
  process.env.MIGRATION_PRODUCT_TABLE_INFO_REPORT_PATH ||
  'migration-product-table-info-report.jsonl';
const TABLE_INFO_NAME = 'مشخصات فنی';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: node scripts/migration-scripts/migrate-product-table-info.mjs

Builds products.tableInfo from legacy product variant attributes and values.
Run after db:migrate:offer-attributes. Problems are recorded in ${reportPath}.`);
  process.exit(0);
}

function add(total, count) {
  for (const key of Object.keys(total)) total[key] += count[key] || 0;
}

function legacyIdKey(value) {
  return value === null || value === undefined ? null : String(value);
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    "SELECT id, legacyId, price FROM products WHERE legacyTable = 'products' AND legacyId IS NOT NULL",
  );
  const [attributes] = await target.execute(
    "SELECT id, legacyId, name, label FROM attributes WHERE legacyTable = 'attributes' AND legacyId IS NOT NULL",
  );
  const [values] = await target.execute(
    `SELECT value_row.id, value_row.legacyId, value_row.attributeId,
            value_row.value, value_row.label
     FROM attribute_values value_row
     WHERE value_row.legacyTable = 'attribute_values'
       AND value_row.legacyId IS NOT NULL`,
  );
  const targetProducts = new Map(
    products.map((row) => [legacyIdKey(row.legacyId), row]),
  );
  return {
    products: targetProducts,
    productsById: new Map(
      [...targetProducts.values()].map((product) => [
        String(product.id),
        product,
      ]),
    ),
    attributes: new Map(
      attributes.map((row) => [legacyIdKey(row.legacyId), row]),
    ),
    values: new Map(values.map((row) => [legacyIdKey(row.legacyId), row])),
  };
}

function tableInfoFor(product) {
  const items = [...product.attributes.values()]
    .sort((left, right) => Number(left.legacyId) - Number(right.legacyId))
    .map((attribute) => ({
      key: attribute.label || attribute.name,
      val: [...attribute.values].join('، '),
    }));
  return items.length ? [{ name: TABLE_INFO_NAME, items }] : [];
}

function migratedValueIdsFor(product) {
  return new Set(
    [...product.attributes.values()].flatMap((attribute) => [
      ...attribute.valueIds,
    ]),
  );
}

function removeMigratedValueIdsFromPrices(price, migratedValueIds) {
  let changed = false;
  const prices = parseJsonArray(price).map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    const next = { ...item };
    for (const field of ['valueAttributeIds', 'attributeIds']) {
      if (!Array.isArray(next[field])) continue;
      const filtered = next[field].filter(
        (id) => !migratedValueIds.has(String(id)),
      );
      if (filtered.length !== next[field].length) {
        next[field] = filtered;
        changed = true;
      }
    }
    return next;
  });
  return { prices, changed };
}

async function main() {
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const totals = {
    read: 0,
    productsUpdated: 0,
    unchanged: 0,
    skipped: 0,
    missingProducts: 0,
    missingAttributes: 0,
    missingAttributeValues: 0,
    priceRowsAdjusted: 0,
  };

  try {
    const sourceDatabase = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
    const targetDatabase = requiredEnv('DB_DATABASE');
    await assertTables(
      source,
      sourceDatabase,
      [
        'products',
        'product_variants',
        'product_variant_attributes',
        'attributes',
        'attribute_values',
      ],
      'Legacy',
    );
    await assertTables(
      target,
      targetDatabase,
      ['products', 'attributes', 'attribute_values'],
      'Target',
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
      'product_variants',
      ['id', 'productId'],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'product_variant_attributes',
      ['id', 'variantId', 'attributeValueId'],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'attributes',
      ['id', 'legacyId'],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'attribute_values',
      ['id', 'legacyId', 'attributeId'],
      'Legacy',
    );
    await assertColumns(
      target,
      targetDatabase,
      'products',
      ['id', 'legacyId', 'legacyTable', 'tableInfo', 'price'],
      'Target',
    );
    await assertColumns(
      target,
      targetDatabase,
      'attributes',
      ['id', 'legacyId', 'legacyTable', 'name', 'label'],
      'Target',
    );
    await assertColumns(
      target,
      targetDatabase,
      'attribute_values',
      ['id', 'legacyId', 'legacyTable', 'attributeId', 'value', 'label'],
      'Target',
    );

    await writeFile(
      reportPath,
      `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`,
      'utf8',
    );
    const maps = await loadTargetMaps(target);
    const productCache = new Map();

    const batches = await readBatches(
      source,
      `SELECT product_row.legacyId AS productLegacyId,
              source_attribute.legacyId AS attributeLegacyId,
              source_value.legacyId AS attributeValueLegacyId
       FROM product_variant_attributes link
       INNER JOIN product_variants variant_row ON variant_row.id = link.variantId
       INNER JOIN products product_row ON product_row.id = variant_row.productId
       INNER JOIN attribute_values source_value ON source_value.id = link.attributeValueId
       INNER JOIN attributes source_attribute ON source_attribute.id = source_value.attributeId
       ORDER BY product_row.legacyId, source_attribute.legacyId, source_value.legacyId, link.id`,
      async (rows, offset, batch) => {
        const count = {
          read: rows.length,
          productsUpdated: 0,
          unchanged: 0,
          skipped: 0,
          missingProducts: 0,
          missingAttributes: 0,
          missingAttributeValues: 0,
          priceRowsAdjusted: 0,
        };
        const changedProducts = new Set();

        for (const row of rows) {
          const targetProduct = maps.products.get(
            legacyIdKey(row.productLegacyId),
          );
          if (!targetProduct) {
            await writeReport({ type: 'missing-product', ...row });
            count.missingProducts += 1;
            count.skipped += 1;
            continue;
          }
          const productId = String(targetProduct.id);
          const attribute = maps.attributes.get(
            legacyIdKey(row.attributeLegacyId),
          );
          if (!attribute) {
            await writeReport({
              type: 'missing-attribute',
              targetProductId: productId,
              ...row,
            });
            count.missingAttributes += 1;
            count.skipped += 1;
            continue;
          }
          const value = maps.values.get(
            legacyIdKey(row.attributeValueLegacyId),
          );
          if (!value || String(value.attributeId) !== String(attribute.id)) {
            await writeReport({
              type: 'missing-attribute-value',
              targetProductId: productId,
              ...row,
            });
            count.missingAttributeValues += 1;
            count.skipped += 1;
            continue;
          }

          let product = productCache.get(productId);
          if (!product) {
            product = { attributes: new Map() };
            productCache.set(productId, product);
          }
          let item = product.attributes.get(attribute.id);
          if (!item) {
            item = {
              legacyId: attribute.legacyId,
              name: attribute.name,
              label: attribute.label,
              values: new Set(),
              valueIds: new Set(),
            };
            product.attributes.set(attribute.id, item);
          }
          item.values.add(String(value.label || value.value));
          item.valueIds.add(String(value.id));
          changedProducts.add(productId);
        }

        await target.beginTransaction();
        try {
          for (const productId of changedProducts) {
            const product = productCache.get(productId);
            const tableInfo = tableInfoFor(product);
            const targetProduct = maps.productsById.get(productId);
            const price = removeMigratedValueIdsFromPrices(
              targetProduct.price,
              migratedValueIdsFor(product),
            );
            await target.execute(
              'UPDATE products SET tableInfo = CAST(? AS JSON), price = CAST(? AS JSON) WHERE id = ?',
              [
                JSON.stringify(tableInfo),
                JSON.stringify(price.prices),
                productId,
              ],
            );
            count.productsUpdated += 1;
            if (price.changed) count.priceRowsAdjusted += 1;
          }
          await target.commit();
        } catch (error) {
          await target.rollback();
          throw error;
        }
        console.log(
          JSON.stringify({
            entity: 'product_table_info',
            batch,
            offset,
            ...count,
          }),
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
