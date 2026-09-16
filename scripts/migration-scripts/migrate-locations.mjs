/**
 * Imports legacy countries, states, and cities into the Nest location tables.
 * Countries, then states, then cities are committed in independent 1,000-row batches.
 */
import {
  BATCH_SIZE,
  assertColumns,
  assertTables,
  openLegacyConnection,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: npm run db:migrate:locations

Reads legacy countries, states, and cities through LEGACY_MIGRATED_DB_* and writes
them to the current DB_* database. Each target batch is one transaction.`);
  process.exit(0);
}

function text(value, maxLength) {
  const result = String(value ?? '')
    .trim()
    .slice(0, maxLength);
  if (!result)
    throw new Error('Legacy location row has a required empty value.');
  return result;
}

function codeKey(value) {
  return String(value).trim().toLocaleLowerCase();
}

function placeholders(values) {
  return values.map(() => '?').join(', ');
}

function add(totals, counters) {
  for (const key of Object.keys(totals)) totals[key] += counters[key];
}

async function loadCountries(target, rows) {
  const ids = rows.map((row) => String(row.id));
  const codes = [...new Set(rows.map((row) => text(row.code, 100)))];
  const [found] = await target.execute(
    `SELECT id, code FROM countries WHERE id IN (${placeholders(ids)}) OR code IN (${placeholders(codes)})`,
    [...ids, ...codes],
  );
  return {
    byId: new Map(found.map((row) => [String(row.id), row])),
    byCode: new Map(found.map((row) => [codeKey(row.code), row])),
  };
}

async function migrateCountries({
  source,
  target,
  rows,
  offset,
  batchNumber,
  countryIds,
}) {
  const startedAt = Date.now();
  const existing = await loadCountries(target, rows);
  const counters = { read: rows.length, added: 0, updated: 0, skipped: 0 };
  await target.beginTransaction();
  try {
    for (const row of rows) {
      const id = text(row.id, 26);
      const code = text(row.code, 100);
      const name = text(row.name, 255);
      const byId = existing.byId.get(id);
      const byCode = existing.byCode.get(codeKey(code));
      if (byId && byCode && byId.id !== byCode.id) {
        throw new Error(
          `Country conflict: legacy ${id} and code ${code} identify different target rows.`,
        );
      }
      const match = byId || byCode;
      if (match) {
        await target.execute(
          'UPDATE countries SET code = ?, name = ?, createdAt = ? WHERE id = ?',
          [code, name, row.createdAt, match.id],
        );
        counters.updated += 1;
      } else {
        await target.execute(
          'INSERT INTO countries (id, code, name, createdAt) VALUES (?, ?, ?, ?)',
          [id, code, name, row.createdAt],
        );
        counters.added += 1;
      }
      countryIds.set(id, match?.id || id);
    }
    await target.commit();
  } catch (error) {
    await target.rollback();
    throw error;
  }
  console.log(
    JSON.stringify(
      {
        entity: 'countries',
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

async function loadStates(target, rows, countryIds) {
  const ids = rows.map((row) => String(row.id));
  const pairs = rows.map((row) => [
    countryIds.get(String(row.countryId)),
    text(row.code, 255),
  ]);
  if (pairs.some(([countryId]) => !countryId))
    throw new Error('Legacy state references a country that was not imported.');
  const clauses = pairs.map(() => '(countryId = ? AND code = ?)').join(' OR ');
  const [found] = await target.execute(
    `SELECT id, countryId, code FROM states WHERE id IN (${placeholders(ids)}) OR ${clauses}`,
    [...ids, ...pairs.flat()],
  );
  return {
    byId: new Map(found.map((row) => [String(row.id), row])),
    byCountryCode: new Map(
      found.map((row) => [`${row.countryId}:${codeKey(row.code)}`, row]),
    ),
  };
}

async function migrateStates({
  source,
  target,
  rows,
  offset,
  batchNumber,
  countryIds,
  stateIds,
}) {
  const startedAt = Date.now();
  const existing = await loadStates(target, rows, countryIds);
  const counters = { read: rows.length, added: 0, updated: 0, skipped: 0 };
  await target.beginTransaction();
  try {
    for (const row of rows) {
      const id = text(row.id, 26);
      const countryId = countryIds.get(String(row.countryId));
      if (!countryId)
        throw new Error(
          `State ${id} references missing legacy country ${row.countryId}.`,
        );
      const code = text(row.code, 255);
      const name = text(row.name, 255);
      const byId = existing.byId.get(id);
      const byCountryCode = existing.byCountryCode.get(
        `${countryId}:${codeKey(code)}`,
      );
      if (byId && byCountryCode && byId.id !== byCountryCode.id) {
        throw new Error(
          `State conflict: legacy ${id} and ${countryId}/${code} identify different target rows.`,
        );
      }
      const match = byId || byCountryCode;
      if (match) {
        await target.execute(
          'UPDATE states SET countryId = ?, code = ?, name = ?, createdAt = ? WHERE id = ?',
          [countryId, code, name, row.createdAt, match.id],
        );
        counters.updated += 1;
      } else {
        await target.execute(
          'INSERT INTO states (id, countryId, code, name, createdAt) VALUES (?, ?, ?, ?, ?)',
          [id, countryId, code, name, row.createdAt],
        );
        counters.added += 1;
      }
      stateIds.set(id, match?.id || id);
    }
    await target.commit();
  } catch (error) {
    await target.rollback();
    throw error;
  }
  console.log(
    JSON.stringify(
      {
        entity: 'states',
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

async function migrateCities({
  target,
  rows,
  offset,
  batchNumber,
  countryIds,
  stateIds,
  stateCountries,
}) {
  const startedAt = Date.now();
  const ids = rows.map((row) => String(row.id));
  const [found] = await target.execute(
    `SELECT id FROM cities WHERE id IN (${placeholders(ids)})`,
    ids,
  );
  const existing = new Map(found.map((row) => [String(row.id), row]));
  const counters = { read: rows.length, added: 0, updated: 0, skipped: 0 };
  await target.beginTransaction();
  try {
    for (const row of rows) {
      const id = text(row.id, 26);
      const name = text(row.name, 255);
      const sourceCountryId =
        row.countryId === null ? null : String(row.countryId);
      const sourceStateId = row.stateId === null ? null : String(row.stateId);
      const countryId = sourceCountryId
        ? countryIds.get(sourceCountryId)
        : null;
      const stateId = sourceStateId ? stateIds.get(sourceStateId) : null;
      if (sourceCountryId && !countryId)
        throw new Error(
          `City ${id} references missing legacy country ${sourceCountryId}.`,
        );
      if (sourceStateId && !stateId)
        throw new Error(
          `City ${id} references missing legacy state ${sourceStateId}.`,
        );
      if (countryId && stateId && stateCountries.get(stateId) !== countryId) {
        throw new Error(
          `City ${id} has a country that does not match its state's country.`,
        );
      }
      if (existing.has(id)) {
        await target.execute(
          'UPDATE cities SET countryId = ?, stateId = ?, name = ?, createdAt = ? WHERE id = ?',
          [countryId, stateId, name, row.createdAt, id],
        );
        counters.updated += 1;
      } else {
        await target.execute(
          'INSERT INTO cities (id, countryId, stateId, name, createdAt) VALUES (?, ?, ?, ?, ?)',
          [id, countryId, stateId, name, row.createdAt],
        );
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
        entity: 'cities',
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

async function readBatches(source, query, onBatch) {
  let offset = 0;
  let batchNumber = 0;
  while (true) {
    const [rows] = await source.execute(`${query} LIMIT ? OFFSET ?`, [
      BATCH_SIZE,
      offset,
    ]);
    if (!rows.length) return batchNumber;
    batchNumber += 1;
    await onBatch(rows, offset, batchNumber);
    offset += rows.length;
    if (rows.length < BATCH_SIZE) return batchNumber;
  }
}

async function assertLegacyIntegrity(source) {
  const checks = [
    [
      'states without countries',
      `SELECT COUNT(*) AS total FROM states s LEFT JOIN countries c ON c.id = s.countryId WHERE c.id IS NULL`,
    ],
    [
      'cities with missing countries',
      `SELECT COUNT(*) AS total FROM cities ci LEFT JOIN countries c ON c.id = ci.countryId WHERE ci.countryId IS NOT NULL AND c.id IS NULL`,
    ],
    [
      'cities with missing states',
      `SELECT COUNT(*) AS total FROM cities ci LEFT JOIN states s ON s.id = ci.stateId WHERE ci.stateId IS NOT NULL AND s.id IS NULL`,
    ],
    [
      'cities whose country differs from their state',
      `SELECT COUNT(*) AS total FROM cities ci INNER JOIN states s ON s.id = ci.stateId WHERE ci.countryId IS NOT NULL AND ci.countryId <> s.countryId`,
    ],
  ];
  const invalid = [];
  for (const [label, query] of checks) {
    const [rows] = await source.execute(query);
    const total = Number(rows[0]?.total || 0);
    if (total) invalid.push(`${label}: ${total}`);
  }
  if (invalid.length)
    throw new Error(
      `Legacy location integrity check failed (${invalid.join(', ')}).`,
    );
}

async function main() {
  const sourceDatabase = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
  const targetDatabase = requiredEnv('DB_DATABASE');
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const countryIds = new Map();
  const stateIds = new Map();
  const stateCountries = new Map();
  const totals = { read: 0, added: 0, updated: 0, skipped: 0 };
  try {
    await assertTables(
      source,
      sourceDatabase,
      ['countries', 'states', 'cities'],
      'Legacy',
    );
    await assertTables(
      target,
      targetDatabase,
      ['countries', 'states', 'cities'],
      'Target',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'countries',
      ['id', 'code', 'name', 'createdAt'],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'states',
      ['id', 'countryId', 'code', 'name', 'createdAt'],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'cities',
      ['id', 'countryId', 'stateId', 'name', 'createdAt'],
      'Legacy',
    );
    await assertColumns(
      target,
      targetDatabase,
      'countries',
      ['id', 'code', 'name', 'createdAt'],
      'Target',
    );
    await assertColumns(
      target,
      targetDatabase,
      'states',
      ['id', 'countryId', 'code', 'name', 'createdAt'],
      'Target',
    );
    await assertColumns(
      target,
      targetDatabase,
      'cities',
      ['id', 'countryId', 'stateId', 'name', 'createdAt'],
      'Target',
    );
    await assertLegacyIntegrity(source);

    const batches = {};
    batches.countries = await readBatches(
      source,
      'SELECT id, code, name, createdAt FROM countries ORDER BY id ASC',
      async (rows, offset, batchNumber) => {
        add(
          totals,
          await migrateCountries({
            source,
            target,
            rows,
            offset,
            batchNumber,
            countryIds,
          }),
        );
      },
    );
    batches.states = await readBatches(
      source,
      'SELECT id, countryId, code, name, createdAt FROM states ORDER BY id ASC',
      async (rows, offset, batchNumber) => {
        add(
          totals,
          await migrateStates({
            source,
            target,
            rows,
            offset,
            batchNumber,
            countryIds,
            stateIds,
          }),
        );
      },
    );
    for (const [sourceId, targetId] of stateIds) {
      const [rows] = await target.execute(
        'SELECT countryId FROM states WHERE id = ?',
        [targetId],
      );
      stateCountries.set(targetId, rows[0]?.countryId);
      if (!rows[0])
        throw new Error(`Imported state ${sourceId} is missing from target.`);
    }
    batches.cities = await readBatches(
      source,
      'SELECT id, countryId, stateId, name, createdAt FROM cities ORDER BY id ASC',
      async (rows, offset, batchNumber) => {
        add(
          totals,
          await migrateCities({
            target,
            rows,
            offset,
            batchNumber,
            countryIds,
            stateIds,
            stateCountries,
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
