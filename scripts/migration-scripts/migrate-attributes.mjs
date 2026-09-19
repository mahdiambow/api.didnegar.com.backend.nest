/** Imports legacy attributes and attribute_values into the Nest attribute catalog. */
import {
  BATCH_SIZE,
  asBoolean,
  asNullableString,
  assertColumns,
  assertTables,
  openLegacyConnection,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: npm run db:migrate:attributes

Reads legacy attributes and attribute_values through LEGACY_MIGRATED_DB_* and writes
them to the current DB_* database. Each target batch is one transaction.`);
  process.exit(0);
}

function requiredText(value, length, field) {
  const result = String(value ?? '')
    .trim()
    .slice(0, length);
  if (!result)
    throw new Error(`Legacy attribute has an empty required ${field}.`);
  return result;
}

function legacyKey(row) {
  return `${row.legacyTable}:${Number(row.legacyId)}`;
}

function add(totals, counters) {
  for (const key of Object.keys(totals)) totals[key] += counters[key];
}

async function loadAttributes(target) {
  const [rows] = await target.execute(
    'SELECT id, legacyId, legacyTable, name FROM attributes',
  );
  return {
    byId: new Map(rows.map((row) => [String(row.id), row])),
    byLegacy: new Map(
      rows
        .filter((row) => row.legacyId !== null)
        .map((row) => [legacyKey(row), row]),
    ),
    byName: new Map(rows.map((row) => [String(row.name), row])),
  };
}

async function migrateAttributeBatch({
  target,
  rows,
  offset,
  batchNumber,
  attributeIds,
}) {
  const startedAt = Date.now();
  const targetRows = await loadAttributes(target);
  const counters = { read: rows.length, added: 0, updated: 0, skipped: 0 };
  await target.beginTransaction();
  try {
    for (const row of rows) {
      const sourceId = requiredText(row.id, 26, 'id');
      const legacyId = Number(row.legacyId);
      const name = requiredText(row.name, 200, 'name');
      const key = `attributes:${legacyId}`;
      let existing =
        targetRows.byLegacy.get(key) || targetRows.byId.get(sourceId) || null;
      if (!existing) {
        const nameMatch = targetRows.byName.get(name);
        if (
          nameMatch &&
          (!nameMatch.legacyTable || legacyKey(nameMatch) === key)
        )
          existing = nameMatch;
      }
      const values = [
        legacyId,
        'attributes',
        name,
        requiredText(row.label, 200, 'label'),
        asBoolean(row.isPublic) ? 1 : 0,
        row.createdAt,
        row.updatedAt,
      ];
      if (existing) {
        await target.execute(
          'UPDATE attributes SET legacyId = ?, legacyTable = ?, name = ?, label = ?, isPublic = ?, createdAt = ?, updatedAt = ? WHERE id = ?',
          [...values, existing.id],
        );
        Object.assign(existing, { legacyId, legacyTable: 'attributes', name });
        targetRows.byLegacy.set(key, existing);
        targetRows.byName.set(name, existing);
        counters.updated += 1;
      } else {
        await target.execute(
          'INSERT INTO attributes (id, legacyId, legacyTable, name, label, isPublic, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [sourceId, ...values],
        );
        const inserted = {
          id: sourceId,
          legacyId,
          legacyTable: 'attributes',
          name,
        };
        targetRows.byLegacy.set(key, inserted);
        targetRows.byName.set(name, inserted);
        counters.added += 1;
      }
      attributeIds.set(sourceId, existing?.id || sourceId);
    }
    await target.commit();
  } catch (error) {
    await target.rollback();
    throw error;
  }
  console.log(
    JSON.stringify(
      {
        entity: 'attributes',
        batch: batchNumber,
        offset,
        ...counters,
        elapsedMs: Date.now() - startedAt,
      },
      null,
      2,
    ),
  );
  return counters;
}

async function loadValues(target) {
  const [rows] = await target.execute(
    'SELECT id, attributeId, legacyId, legacyTable, value FROM attribute_values',
  );
  return {
    byId: new Map(rows.map((row) => [String(row.id), row])),
    byLegacy: new Map(
      rows
        .filter((row) => row.legacyId !== null)
        .map((row) => [legacyKey(row), row]),
    ),
    byAttributeValue: new Map(
      rows.map((row) => [`${row.attributeId}:${row.value}`, row]),
    ),
  };
}

async function migrateValueBatch({
  target,
  rows,
  offset,
  batchNumber,
  attributeIds,
}) {
  const startedAt = Date.now();
  const targetRows = await loadValues(target);
  const counters = {
    read: rows.length,
    added: 0,
    updated: 0,
    skipped: 0,
    duplicateValues: 0,
  };
  await target.beginTransaction();
  try {
    for (const [index, row] of rows.entries()) {
      const sourceId = requiredText(row.id, 26, 'id');
      const attributeId = attributeIds.get(String(row.attributeId));
      if (!attributeId)
        throw new Error(
          `Attribute value ${sourceId} references missing legacy attribute ${row.attributeId}.`,
        );
      const legacyId = Number(row.legacyId);
      const value = requiredText(row.value, 200, 'value');
      const key = `attribute_values:${legacyId}`;
      let existing =
        targetRows.byLegacy.get(key) || targetRows.byId.get(sourceId) || null;
      if (!existing) {
        const valueMatch = targetRows.byAttributeValue.get(
          `${attributeId}:${value}`,
        );
        if (valueMatch) {
          if (!valueMatch.legacyTable || legacyKey(valueMatch) === key) {
            existing = valueMatch;
          } else {
            // The target only permits one value per attribute. Keep the first
            // legacy value deterministically and retain the duplicate in logs.
            counters.skipped += 1;
            counters.duplicateValues += 1;
            continue;
          }
        }
      }
      const values = [
        legacyId,
        'attribute_values',
        attributeId,
        value,
        asNullableString(row.slug, 200) || value,
        offset + index,
        1,
        row.createdAt,
        row.createdAt,
      ];
      if (existing) {
        await target.execute(
          'UPDATE attribute_values SET legacyId = ?, legacyTable = ?, attributeId = ?, value = ?, label = ?, sortOrder = ?, isActive = ?, createdAt = ?, updatedAt = ? WHERE id = ?',
          [...values, existing.id],
        );
        Object.assign(existing, {
          legacyId,
          legacyTable: 'attribute_values',
          attributeId,
          value,
        });
        targetRows.byLegacy.set(key, existing);
        targetRows.byAttributeValue.set(`${attributeId}:${value}`, existing);
        counters.updated += 1;
      } else {
        await target.execute(
          'INSERT INTO attribute_values (id, legacyId, legacyTable, attributeId, value, label, sortOrder, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [sourceId, ...values],
        );
        const inserted = {
          id: sourceId,
          legacyId,
          legacyTable: 'attribute_values',
          attributeId,
          value,
        };
        targetRows.byLegacy.set(key, inserted);
        targetRows.byAttributeValue.set(`${attributeId}:${value}`, inserted);
        counters.added += 1;
      }
    }
    await target.commit();
  } catch (error) {
    await target.rollback();
    throw error;
  }
  console.log(
    JSON.stringify(
      {
        entity: 'attribute_values',
        batch: batchNumber,
        offset,
        ...counters,
        elapsedMs: Date.now() - startedAt,
      },
      null,
      2,
    ),
  );
  return counters;
}

async function readBatches(source, query, callback) {
  let offset = 0;
  let batchNumber = 0;
  while (true) {
    const [rows] = await source.execute(`${query} LIMIT ? OFFSET ?`, [
      BATCH_SIZE,
      offset,
    ]);
    if (!rows.length) return batchNumber;
    batchNumber += 1;
    await callback(rows, offset, batchNumber);
    offset += rows.length;
    if (rows.length < BATCH_SIZE) return batchNumber;
  }
}

async function main() {
  const sourceDatabase = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
  const targetDatabase = requiredEnv('DB_DATABASE');
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const attributeIds = new Map();
  const totals = {
    read: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    duplicateValues: 0,
  };
  try {
    await assertTables(
      source,
      sourceDatabase,
      ['attributes', 'attribute_values'],
      'Legacy',
    );
    await assertTables(
      target,
      targetDatabase,
      ['attributes', 'attribute_values'],
      'Target',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'attributes',
      [
        'id',
        'legacyId',
        'legacyTable',
        'name',
        'label',
        'isPublic',
        'createdAt',
        'updatedAt',
      ],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'attribute_values',
      [
        'id',
        'legacyId',
        'legacyTable',
        'attributeId',
        'value',
        'slug',
        'createdAt',
      ],
      'Legacy',
    );
    const batches = {};
    batches.attributes = await readBatches(
      source,
      'SELECT id, legacyId, legacyTable, name, label, isPublic, createdAt, updatedAt FROM attributes ORDER BY legacyId ASC, id ASC',
      async (rows, offset, batchNumber) => {
        add(
          totals,
          await migrateAttributeBatch({
            target,
            rows,
            offset,
            batchNumber,
            attributeIds,
          }),
        );
      },
    );
    batches.attributeValues = await readBatches(
      source,
      'SELECT id, legacyId, legacyTable, attributeId, value, slug, createdAt FROM attribute_values ORDER BY legacyId ASC, id ASC',
      async (rows, offset, batchNumber) => {
        add(
          totals,
          await migrateValueBatch({
            target,
            rows,
            offset,
            batchNumber,
            attributeIds,
          }),
        );
      },
    );
    console.log(
      JSON.stringify({ complete: true, batches, ...totals }, null, 2),
    );
  } finally {
    await Promise.all([source.end(), target.end()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
