/** Imports legacy customers for later order and payment migration. */
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
  process.env.MIGRATION_CUSTOMERS_REPORT_PATH ||
  'migration-customers-report.jsonl';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: npm run db:migrate:customers

Imports legacy customers after users and locations. A customer is retained even when
its optional user or location link is unavailable; such links become NULL and are
recorded in ${reportPath}.`);
  process.exit(0);
}

function add(totals, count) {
  for (const key of Object.keys(totals)) totals[key] += count[key] || 0;
}

function sourceKey(legacyTable, legacyId) {
  return `${legacyTable}\u0000${String(legacyId)}`;
}

function text(value, maxLength) {
  if (value === null || value === undefined) return null;
  const result = String(value).trim().slice(0, maxLength);
  return result || null;
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
  const results = await Promise.all([
    target.execute(
      'SELECT id, legacyId, legacyTable FROM users WHERE legacyId IS NOT NULL AND legacyTable IS NOT NULL',
    ),
    target.execute('SELECT id FROM countries'),
    target.execute('SELECT id FROM states'),
    target.execute('SELECT id FROM cities'),
    target.execute('SELECT id FROM customers'),
  ]);
  const [users] = results[0];
  const [countries] = results[1];
  const [states] = results[2];
  const [cities] = results[3];
  const [customers] = results[4];
  return {
    users: new Map(
      users.map((row) => [
        sourceKey(row.legacyTable, row.legacyId),
        String(row.id),
      ]),
    ),
    countryIds: new Set(countries.map((row) => String(row.id))),
    stateIds: new Set(states.map((row) => String(row.id))),
    cityIds: new Set(cities.map((row) => String(row.id))),
    customerIds: new Set(customers.map((row) => String(row.id))),
  };
}

function reportBase(row) {
  return {
    legacyCustomerId: String(row.legacyCustomerId),
    legacyCustomerLegacyId: row.customerLegacyId,
    legacyCustomerTable: row.customerLegacyTable,
  };
}

async function main() {
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const totals = {
    read: 0,
    added: 0,
    updated: 0,
    unlinkedUsers: 0,
    missingCountries: 0,
    missingStates: 0,
    missingCities: 0,
  };

  try {
    const sourceDatabase = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
    const targetDatabase = requiredEnv('DB_DATABASE');
    await assertTables(
      source,
      sourceDatabase,
      ['customers', 'users'],
      'Legacy',
    );
    await assertTables(
      target,
      targetDatabase,
      ['customers', 'users', 'countries', 'states', 'cities'],
      'Target',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'customers',
      [
        'id',
        'legacyId',
        'legacyTable',
        'userId',
        'username',
        'firstName',
        'lastName',
        'email',
        'countryId',
        'postalCode',
        'cityId',
        'stateId',
        'createdAt',
        'lastActiveAt',
      ],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'users',
      ['id', 'legacyId', 'legacyTable'],
      'Legacy',
    );
    await assertColumns(
      target,
      targetDatabase,
      'customers',
      [
        'id',
        'legacyId',
        'legacyTable',
        'userId',
        'username',
        'firstName',
        'lastName',
        'email',
        'countryId',
        'postalCode',
        'cityId',
        'stateId',
        'createdAt',
        'lastActiveAt',
      ],
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
      `SELECT customer_row.id AS legacyCustomerId,
              customer_row.legacyId AS customerLegacyId,
              customer_row.legacyTable AS customerLegacyTable,
              customer_row.userId AS legacyUserId, customer_row.username,
              customer_row.firstName, customer_row.lastName, customer_row.email,
              customer_row.countryId AS legacyCountryId, customer_row.postalCode,
              customer_row.cityId AS legacyCityId, customer_row.stateId AS legacyStateId,
              customer_row.createdAt, customer_row.lastActiveAt,
              user_row.legacyId AS userLegacyId, user_row.legacyTable AS userLegacyTable
       FROM customers customer_row
       LEFT JOIN users user_row ON user_row.id = customer_row.userId
       ORDER BY customer_row.legacyId, customer_row.id`,
      async (rows, offset, batch) => {
        const count = {
          read: rows.length,
          added: 0,
          updated: 0,
          unlinkedUsers: 0,
          missingCountries: 0,
          missingStates: 0,
          missingCities: 0,
        };
        await target.beginTransaction();
        try {
          for (const row of rows) {
            const base = reportBase(row);
            const userId =
              row.userLegacyId === null || row.userLegacyId === undefined
                ? null
                : maps.users.get(
                    sourceKey(row.userLegacyTable, row.userLegacyId),
                  ) || null;
            const countryId =
              row.legacyCountryId &&
              maps.countryIds.has(String(row.legacyCountryId))
                ? String(row.legacyCountryId)
                : null;
            const stateId =
              row.legacyStateId && maps.stateIds.has(String(row.legacyStateId))
                ? String(row.legacyStateId)
                : null;
            const cityId =
              row.legacyCityId && maps.cityIds.has(String(row.legacyCityId))
                ? String(row.legacyCityId)
                : null;

            if (row.legacyUserId && !userId) {
              await writeReport({
                type: 'missing-imported-user',
                ...base,
                legacyUserId: row.legacyUserId,
              });
              count.unlinkedUsers += 1;
            }
            if (row.legacyCountryId && !countryId) {
              await writeReport({
                type: 'missing-imported-country',
                ...base,
                legacyCountryId: row.legacyCountryId,
              });
              count.missingCountries += 1;
            }
            if (row.legacyStateId && !stateId) {
              await writeReport({
                type: 'missing-imported-state',
                ...base,
                legacyStateId: row.legacyStateId,
              });
              count.missingStates += 1;
            }
            if (row.legacyCityId && !cityId) {
              await writeReport({
                type: 'missing-imported-city',
                ...base,
                legacyCityId: row.legacyCityId,
              });
              count.missingCities += 1;
            }

            const values = [
              row.customerLegacyId,
              text(row.customerLegacyTable, 255),
              userId,
              text(row.username, 60),
              text(row.firstName, 255),
              text(row.lastName, 255),
              text(row.email, 320),
              countryId,
              text(row.postalCode, 20),
              cityId,
              stateId,
              row.createdAt,
              row.lastActiveAt,
            ];
            const id = String(row.legacyCustomerId);
            if (maps.customerIds.has(id)) {
              await target.execute(
                `UPDATE customers SET legacyId = ?, legacyTable = ?, userId = ?, username = ?,
                 firstName = ?, lastName = ?, email = ?, countryId = ?, postalCode = ?,
                 cityId = ?, stateId = ?, createdAt = ?, lastActiveAt = ? WHERE id = ?`,
                [...values, id],
              );
              count.updated += 1;
            } else {
              await target.execute(
                `INSERT INTO customers (id, legacyId, legacyTable, userId, username, firstName,
                 lastName, email, countryId, postalCode, cityId, stateId, createdAt, lastActiveAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, ...values],
              );
              maps.customerIds.add(id);
              count.added += 1;
            }
          }
          await target.commit();
        } catch (error) {
          await target.rollback();
          throw error;
        }
        console.log(
          JSON.stringify({ entity: 'customers', batch, offset, ...count }),
        );
        add(totals, count);
      },
    );
    const complete = {
      type: 'run-complete',
      complete: true,
      batches,
      totals,
      reportPath,
    };
    await writeReport(complete);
    console.log(JSON.stringify(complete, null, 2));
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
