/**
 * Moves legacy product-variant value selections into products.price[].
 * valueAttributeIds. Nest product_variants remains deliberately unused.
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
  process.env.MIGRATION_OFFER_ATTRIBUTES_REPORT_PATH ||
  'migration-offer-attributes-report.jsonl';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: node scripts/migration-scripts/migrate-offer-attributes.mjs

Run after attributes and catalog. Legacy product variant attribute values are
written to products.price[].valueAttributeIds; Nest product_variants is unused.`);
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

function decimalOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function priceKey(valueAttributeIds) {
  return valueAttributeIds.join(':');
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
    "SELECT id, legacyId FROM products WHERE legacyTable = 'products'",
  );
  const [values] = await target.execute(`
    SELECT value_row.id, value_row.legacyId, value_row.value,
           attribute_row.legacyId AS attributeLegacyId
    FROM attribute_values value_row
    INNER JOIN attributes attribute_row ON attribute_row.id = value_row.attributeId
    WHERE value_row.legacyTable = 'attribute_values'
      AND attribute_row.legacyTable = 'attributes'
  `);
  return {
    products: new Map(
      products.map((row) => [legacyIdKey(row.legacyId), String(row.id)]),
    ),
    valuesByLegacy: new Map(
      values.map((row) => [legacyIdKey(row.legacyId), row]),
    ),
    valuesByNaturalKey: new Map(
      values.map((row) => [
        `${legacyIdKey(row.attributeLegacyId)}:${row.value}`,
        row,
      ]),
    ),
  };
}

async function clearIncorrectImportedOfferAttributes(target) {
  const [result] = await target.execute(
    "UPDATE seller_offers SET attributes = CAST('{}' AS JSON) WHERE legacyTable = 'seller_variant_listings' AND attributes <> CAST('{}' AS JSON)",
  );
  return Number(result.affectedRows || 0);
}

async function clearIncorrectProductAttributeIds(target) {
  const [result] = await target.execute(
    "UPDATE products SET attributeIds = CAST('[]' AS JSON) WHERE legacyTable = 'products' AND attributeIds <> CAST('[]' AS JSON)",
  );
  return Number(result.affectedRows || 0);
}

async function migrateBatch(target, rows, offset, batch, maps, priceCache) {
  const count = {
    read: rows.length,
    productsUpdated: 0,
    pricesAdded: 0,
    unchanged: 0,
    skipped: 0,
    missingProducts: 0,
    missingAttributeValues: 0,
    duplicateCombinations: 0,
  };
  const changedProducts = new Set();

  await target.beginTransaction();
  try {
    for (const row of rows) {
      const productId = maps.products.get(legacyIdKey(row.productLegacyId));
      if (!productId) {
        await writeReport({
          type: 'missing-product',
          legacyVariantId: row.id,
          variantLegacyId: row.legacyId,
          legacyProductId: row.productId,
          productLegacyId: row.productLegacyId,
        });
        count.missingProducts += 1;
        count.skipped += 1;
        continue;
      }

      const sourceValues = parseJsonArray(row.sourceAttributeValues).filter(
        (value) =>
          value &&
          value.attributeValueLegacyId !== null &&
          value.attributeValueLegacyId !== undefined,
      );
      const valueAttributeIds = [];
      let missingValue = false;
      for (const sourceValue of sourceValues) {
        const targetValue =
          maps.valuesByLegacy.get(
            legacyIdKey(sourceValue.attributeValueLegacyId),
          ) ||
          maps.valuesByNaturalKey.get(
            `${legacyIdKey(sourceValue.attributeLegacyId)}:${sourceValue.value}`,
          );
        if (!targetValue) {
          await writeReport({
            type: 'missing-attribute-value',
            legacyVariantId: row.id,
            variantLegacyId: row.legacyId,
            legacyProductId: row.productId,
            legacyAttributeValueId: sourceValue.attributeValueId,
            attributeValueLegacyId: sourceValue.attributeValueLegacyId,
            attributeLegacyId: sourceValue.attributeLegacyId,
            value: sourceValue.value,
          });
          count.missingAttributeValues += 1;
          missingValue = true;
          break;
        }
        valueAttributeIds.push(String(targetValue.id));
      }
      if (missingValue) {
        count.skipped += 1;
        continue;
      }

      const normalizedIds = [...new Set(valueAttributeIds)].sort();
      const minPrice = decimalOrZero(row.minPrice ?? row.maxPrice);
      const maxPrice = decimalOrZero(row.maxPrice ?? row.minPrice);
      const price = {
        valueAttributeIds: normalizedIds,
        price: maxPrice,
        discountPercentage: null,
        discountAmount: null,
        expireDate: null,
        maxQuantity: null,
        minQuantity: 1,
        finalPrice: minPrice,
      };
      let cached = priceCache.get(productId);
      if (!cached) {
        // Rebuild the migrated product's price list from legacy variants,
        // replacing catalog's temporary empty-value price entry.
        cached = { prices: [], keys: new Map() };
        priceCache.set(productId, cached);
      }

      const key = priceKey(normalizedIds);
      const existing = cached.keys.get(key);
      if (existing) {
        if (
          existing.price === price.price &&
          existing.finalPrice === price.finalPrice
        ) {
          count.unchanged += 1;
          continue;
        }
        await writeReport({
          type: 'duplicate-price-combination',
          legacyVariantId: row.id,
          variantLegacyId: row.legacyId,
          targetProductId: productId,
          valueAttributeIds: normalizedIds,
          retainedPrice: existing.price,
          retainedFinalPrice: existing.finalPrice,
          incomingPrice: price.price,
          incomingFinalPrice: price.finalPrice,
        });
        count.duplicateCombinations += 1;
        count.skipped += 1;
        continue;
      }
      cached.prices.push(price);
      cached.keys.set(key, price);
      changedProducts.add(productId);
      count.pricesAdded += 1;
    }

    for (const productId of changedProducts) {
      const cached = priceCache.get(productId);
      await target.execute(
        'UPDATE products SET price = CAST(? AS JSON) WHERE id = ?',
        [JSON.stringify(cached.prices), productId],
      );
      count.productsUpdated += 1;
    }
    await target.commit();
  } catch (error) {
    await target.rollback();
    throw error;
  }

  console.log(
    JSON.stringify({
      entity: 'product_variant_prices',
      batch,
      offset,
      ...count,
    }),
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
    productsUpdated: 0,
    pricesAdded: 0,
    unchanged: 0,
    skipped: 0,
    missingProducts: 0,
    missingAttributeValues: 0,
    duplicateCombinations: 0,
  };
  try {
    await assertTables(
      source,
      sourceDatabase,
      [
        'product_variants',
        'products',
        'product_variant_attributes',
        'attribute_values',
        'attributes',
      ],
      'Legacy',
    );
    await assertTables(
      target,
      targetDatabase,
      ['products', 'seller_offers', 'attribute_values', 'attributes'],
      'Target',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'product_variants',
      ['id', 'legacyId', 'productId', 'minPrice', 'maxPrice'],
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
      'product_variant_attributes',
      ['id', 'variantId', 'attributeValueId'],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'attribute_values',
      ['id', 'legacyId', 'attributeId', 'value'],
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
      target,
      targetDatabase,
      'products',
      ['id', 'legacyId', 'legacyTable', 'price'],
      'Target',
    );
    await assertColumns(
      target,
      targetDatabase,
      'seller_offers',
      ['legacyTable', 'attributes'],
      'Target',
    );

    await writeFile(
      reportPath,
      `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`,
      'utf8',
    );
    const clearedOfferAttributes =
      await clearIncorrectImportedOfferAttributes(target);
    const clearedProductAttributeIds =
      await clearIncorrectProductAttributeIds(target);
    await writeReport({
      type: 'cleared-incorrect-imported-offer-attributes',
      count: clearedOfferAttributes,
    });
    await writeReport({
      type: 'cleared-incorrect-product-attribute-ids',
      count: clearedProductAttributeIds,
    });

    const maps = await loadTargetMaps(target);
    const priceCache = new Map();
    const batches = await readBatches(
      source,
      `SELECT variant_row.id, variant_row.legacyId, variant_row.productId,
              variant_row.minPrice, variant_row.maxPrice,
              product_row.legacyId AS productLegacyId,
              JSON_ARRAYAGG(
                CASE WHEN link.id IS NULL THEN NULL ELSE JSON_OBJECT(
                  'attributeValueId', link.attributeValueId,
                  'attributeValueLegacyId', source_value.legacyId,
                  'attributeLegacyId', source_attribute.legacyId,
                  'value', source_value.value
                ) END
              ) AS sourceAttributeValues
       FROM product_variants variant_row
       INNER JOIN products product_row ON product_row.id = variant_row.productId
       LEFT JOIN product_variant_attributes link ON link.variantId = variant_row.id
       LEFT JOIN attribute_values source_value ON source_value.id = link.attributeValueId
       LEFT JOIN attributes source_attribute ON source_attribute.id = source_value.attributeId
       GROUP BY variant_row.id, variant_row.legacyId, variant_row.productId,
                variant_row.minPrice, variant_row.maxPrice, product_row.legacyId
       ORDER BY product_row.legacyId, variant_row.legacyId, variant_row.id`,
      async (rows, offset, batch) =>
        add(
          totals,
          await migrateBatch(target, rows, offset, batch, maps, priceCache),
        ),
    );
    const result = {
      complete: true,
      batches,
      clearedIncorrectImportedOfferAttributes: clearedOfferAttributes,
      clearedIncorrectProductAttributeIds: clearedProductAttributeIds,
      totals,
      reportPath,
    };
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
