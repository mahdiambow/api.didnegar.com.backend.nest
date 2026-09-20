/**
 * Moves legacy product-variant selections into seller_offers.attributes.
 * Nest product_variants is intentionally not populated.
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

Run after attributes and catalog. Variant selections are merged into the matching
seller offer's attributes JSON; Nest product_variants remains unused.`);
  process.exit(0);
}

function add(total, count) {
  for (const key of Object.keys(total)) total[key] += count[key] || 0;
}

function legacyIdKey(value) {
  return value === null || value === undefined ? null : String(value);
}

function parseAttributes(value) {
  if (value === null || value === undefined || value === '') return {};
  if (typeof value === 'object' && !Array.isArray(value)) return { ...value };
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
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

async function loadAttributeValues(target) {
  const [rows] = await target.execute(`
    SELECT value_row.id, value_row.attributeId, value_row.legacyId,
           attribute_row.legacyId AS attributeLegacyId, value_row.value
    FROM attribute_values value_row
    INNER JOIN attributes attribute_row ON attribute_row.id = value_row.attributeId
    WHERE value_row.legacyTable = 'attribute_values'
      AND attribute_row.legacyTable = 'attributes'
  `);
  return {
    byLegacy: new Map(rows.map((row) => [legacyIdKey(row.legacyId), row])),
    byNaturalKey: new Map(
      rows.map((row) => [
        `${legacyIdKey(row.attributeLegacyId)}:${row.value}`,
        row,
      ]),
    ),
    attributeIds: new Set(rows.map((row) => String(row.attributeId))),
  };
}

async function loadOffers(target, listingIds) {
  if (!listingIds.length) return new Map();
  const [rows] = await target.execute(
    `SELECT id, legacySourceId, productId, attributes FROM seller_offers
     WHERE legacySourceId IN (${listingIds.map(() => '?').join(', ')})`,
    listingIds,
  );
  return new Map(rows.map((row) => [String(row.legacySourceId), row]));
}

async function syncProductAttributeIds(target, productIds, validAttributeIds) {
  if (!productIds.size) return { updated: 0, invalidOfferAttributes: 0 };
  const ids = [...productIds];
  const [offers] = await target.execute(
    `SELECT id, productId, attributes FROM seller_offers
     WHERE productId IN (${ids.map(() => '?').join(', ')})`,
    ids,
  );
  const attributesByProduct = new Map(
    ids.map((productId) => [productId, new Set()]),
  );
  let invalidOfferAttributes = 0;
  for (const offer of offers) {
    const attributes = parseAttributes(offer.attributes);
    if (!attributes) {
      await writeReport({
        type: 'invalid-offer-attributes-json-during-product-sync',
        sellerOfferId: offer.id,
        productId: offer.productId,
      });
      invalidOfferAttributes += 1;
      continue;
    }
    const productAttributes = attributesByProduct.get(String(offer.productId));
    if (!productAttributes) continue;
    for (const attributeId of Object.keys(attributes)) {
      if (validAttributeIds.has(attributeId))
        productAttributes.add(attributeId);
    }
  }

  let updated = 0;
  for (const [productId, attributeIds] of attributesByProduct) {
    const value = JSON.stringify([...attributeIds].sort());
    const [result] = await target.execute(
      'UPDATE products SET attributeIds = CAST(? AS JSON) WHERE id = ? AND attributeIds <> CAST(? AS JSON)',
      [value, productId, value],
    );
    updated += Number(result.affectedRows || 0);
  }
  return { updated, invalidOfferAttributes };
}

async function migrateBatch(target, rows, offset, batch, valueMaps) {
  const count = {
    read: rows.length,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    missingListings: 0,
    missingOffers: 0,
    missingAttributeValues: 0,
    conflicts: 0,
    invalidOfferAttributes: 0,
    productsUpdated: 0,
  };
  const listingIds = [
    ...new Set(
      rows
        .map((row) => row.listingId)
        .filter((id) => id !== null && id !== undefined)
        .map(String),
    ),
  ];
  const offersByListing = await loadOffers(target, listingIds);
  const pending = new Map();
  const affectedProductIds = new Set();

  await target.beginTransaction();
  try {
    for (const row of rows) {
      if (!row.listingId) {
        await writeReport({
          type: 'variant-without-seller-listing',
          variantAttributeId: row.id,
          legacyVariantId: row.variantId,
          legacyAttributeValueId: row.attributeValueId,
        });
        count.missingListings += 1;
        count.skipped += 1;
        continue;
      }

      const offer = offersByListing.get(String(row.listingId));
      if (!offer) {
        await writeReport({
          type: 'missing-seller-offer',
          variantAttributeId: row.id,
          legacyVariantId: row.variantId,
          legacyListingId: row.listingId,
        });
        count.missingOffers += 1;
        count.skipped += 1;
        continue;
      }
      const attributeValue =
        valueMaps.byLegacy.get(legacyIdKey(row.attributeValueLegacyId)) ||
        valueMaps.byNaturalKey.get(
          `${legacyIdKey(row.attributeLegacyId)}:${row.attributeValue}`,
        );
      if (!attributeValue) {
        await writeReport({
          type: 'missing-attribute-value',
          variantAttributeId: row.id,
          legacyVariantId: row.variantId,
          legacyAttributeValueId: row.attributeValueId,
          attributeValueLegacyId: row.attributeValueLegacyId,
          attributeLegacyId: row.attributeLegacyId,
          value: row.attributeValue,
        });
        count.missingAttributeValues += 1;
        count.skipped += 1;
        continue;
      }
      affectedProductIds.add(String(offer.productId));

      let next = pending.get(offer.id);
      if (!next) {
        const attributes = parseAttributes(offer.attributes);
        if (!attributes) {
          await writeReport({
            type: 'invalid-offer-attributes-json',
            variantAttributeId: row.id,
            sellerOfferId: offer.id,
            legacyListingId: row.listingId,
          });
          count.invalidOfferAttributes += 1;
          count.skipped += 1;
          continue;
        }
        next = { offer, attributes, changed: false };
        pending.set(offer.id, next);
      }

      const attributeId = String(attributeValue.attributeId);
      const attributeValueId = String(attributeValue.id);
      const current = next.attributes[attributeId];
      if (current && current !== attributeValueId) {
        await writeReport({
          type: 'conflicting-attribute-values',
          variantAttributeId: row.id,
          sellerOfferId: offer.id,
          legacyListingId: row.listingId,
          attributeId,
          existingAttributeValueId: current,
          incomingAttributeValueId: attributeValueId,
        });
        count.conflicts += 1;
        count.skipped += 1;
        continue;
      }
      if (current === attributeValueId) {
        count.unchanged += 1;
        continue;
      }
      next.attributes[attributeId] = attributeValueId;
      next.changed = true;
    }

    for (const { offer, attributes, changed } of pending.values()) {
      if (!changed) continue;
      await target.execute(
        'UPDATE seller_offers SET attributes = CAST(? AS JSON) WHERE id = ?',
        [JSON.stringify(attributes), offer.id],
      );
      count.updated += 1;
    }
    const productSync = await syncProductAttributeIds(
      target,
      affectedProductIds,
      valueMaps.attributeIds,
    );
    count.productsUpdated += productSync.updated;
    count.invalidOfferAttributes += productSync.invalidOfferAttributes;
    await target.commit();
  } catch (error) {
    await target.rollback();
    throw error;
  }

  console.log(
    JSON.stringify({
      entity: 'seller_offer_attributes',
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
    updated: 0,
    unchanged: 0,
    skipped: 0,
    missingListings: 0,
    missingOffers: 0,
    missingAttributeValues: 0,
    conflicts: 0,
    invalidOfferAttributes: 0,
    productsUpdated: 0,
  };
  try {
    await assertTables(
      source,
      sourceDatabase,
      [
        'product_variant_attributes',
        'product_variants',
        'seller_variant_listings',
        'attribute_values',
        'attributes',
      ],
      'Legacy',
    );
    await assertTables(
      target,
      targetDatabase,
      ['seller_offers', 'attribute_values', 'attributes'],
      'Target',
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
      'seller_variant_listings',
      ['id', 'productVariantId'],
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
      'seller_offers',
      ['id', 'legacySourceId', 'attributes'],
      'Target',
    );
    await assertColumns(
      target,
      targetDatabase,
      'products',
      ['id', 'attributeIds'],
      'Target',
    );

    await writeFile(
      reportPath,
      `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`,
      'utf8',
    );
    const valueMaps = await loadAttributeValues(target);
    const batches = await readBatches(
      source,
      `SELECT pva.id, pva.variantId, pva.attributeValueId, listing.id AS listingId,
              source_value.legacyId AS attributeValueLegacyId,
              source_value.value AS attributeValue,
              source_attribute.legacyId AS attributeLegacyId
       FROM product_variant_attributes pva
       LEFT JOIN seller_variant_listings listing ON listing.productVariantId = pva.variantId
       LEFT JOIN attribute_values source_value ON source_value.id = pva.attributeValueId
       LEFT JOIN attributes source_attribute ON source_attribute.id = source_value.attributeId
       ORDER BY pva.id, listing.id`,
      async (rows, offset, batch) =>
        add(totals, await migrateBatch(target, rows, offset, batch, valueMaps)),
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
