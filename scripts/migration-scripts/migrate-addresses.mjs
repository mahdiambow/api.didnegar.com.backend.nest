/** Imports safe legacy billing/shipping addresses into Nest user_addresses. */
import { appendFile, writeFile } from 'node:fs/promises';
import {
  BATCH_SIZE,
  asBoolean,
  assertColumns,
  assertTables,
  openLegacyConnection,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

const reportPath =
  process.env.MIGRATION_ADDRESSES_REPORT_PATH ||
  'migration-addresses-report.jsonl';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: npm run db:migrate:addresses

Imports legacy addresses after users and locations. It only imports rows whose user,
province, city, address detail, recipient name, and 10-digit postal code can be
resolved. recipientPhone is copied from the legacy username when it fits the target
field and is otherwise NULL. Skipped rows are written to ${reportPath}.`);
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

function normalizeDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (digit) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)])
    .replace(/[٠-٩]/g, (digit) => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(digit)]);
}

function recipientPhone(value) {
  if (value === null || value === undefined) return null;
  const result = String(value).trim();
  // Do not truncate a legacy value into a different phone/username. The target
  // column is VARCHAR(20), and recipientPhone is intentionally nullable.
  return result && result.length <= 20 ? result : null;
}

function normalizePostalCode(value) {
  const digits = normalizeDigits(value).replace(/\D/g, '');
  return /^\d{10}$/.test(digits) ? digits : null;
}

function recipientName(row) {
  const fullName = [text(row.firstName, 75), text(row.lastName, 75)]
    .filter(Boolean)
    .join(' ');
  return text(fullName || row.displayName || row.username, 150);
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

async function loadTargetUsers(target) {
  const [rows] = await target.execute(
    'SELECT id, legacyId, legacyTable FROM users WHERE legacyId IS NOT NULL AND legacyTable IS NOT NULL',
  );
  return new Map(
    rows.map((row) => [
      sourceKey(row.legacyTable, row.legacyId),
      String(row.id),
    ]),
  );
}

async function loadTargetAddressIds(target) {
  const [rows] = await target.execute('SELECT id FROM user_addresses');
  return new Set(rows.map((row) => String(row.id)));
}

function reportRow(row) {
  return {
    legacyAddressId: String(row.legacyAddressId),
    legacyAddressLegacyId: row.addressLegacyId,
    legacyAddressTable: row.addressLegacyTable,
    legacyUserId: row.legacyUserId,
    legacyUserLegacyId: row.userLegacyId,
  };
}

async function main() {
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const totals = {
    read: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    missingUsers: 0,
    missingCities: 0,
    missingProvinces: 0,
    missingAddressDetails: 0,
    missingRecipientNames: 0,
    invalidPostalCodes: 0,
  };

  try {
    const sourceDatabase = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
    const targetDatabase = requiredEnv('DB_DATABASE');
    await assertTables(
      source,
      sourceDatabase,
      ['addresses', 'users', 'cities', 'states'],
      'Legacy',
    );
    await assertTables(
      target,
      targetDatabase,
      ['users', 'user_addresses'],
      'Target',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'addresses',
      [
        'id',
        'userId',
        'type',
        'legacyId',
        'legacyTable',
        'address1',
        'address2',
        'cityId',
        'stateId',
        'postalCode',
        'isDefault',
        'createdAt',
        'updatedAt',
      ],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'users',
      [
        'id',
        'legacyId',
        'legacyTable',
        'username',
        'displayName',
        'firstName',
        'lastName',
      ],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'cities',
      ['id', 'name', 'stateId'],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'states',
      ['id', 'name'],
      'Legacy',
    );
    await assertColumns(
      target,
      targetDatabase,
      'users',
      ['id', 'legacyId', 'legacyTable'],
      'Target',
    );
    await assertColumns(
      target,
      targetDatabase,
      'user_addresses',
      [
        'id',
        'userId',
        'title',
        'province',
        'city',
        'addressDetail',
        'postalCode',
        'plaque',
        'unit',
        'description',
        'lat',
        'long',
        'recipientFullName',
        'recipientPhone',
        'isDefault',
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
    const targetUsers = await loadTargetUsers(target);
    const targetAddressIds = await loadTargetAddressIds(target);
    const batches = await readBatches(
      source,
      `SELECT address_row.id AS legacyAddressId,
              address_row.legacyId AS addressLegacyId,
              address_row.legacyTable AS addressLegacyTable,
              address_row.userId AS legacyUserId, address_row.type AS addressType,
              address_row.address1, address_row.address2, address_row.postalCode,
              address_row.isDefault, address_row.createdAt, address_row.updatedAt,
              user_row.legacyId AS userLegacyId, user_row.legacyTable AS userLegacyTable,
              user_row.username, user_row.displayName, user_row.firstName, user_row.lastName,
              city_row.name AS cityName, state_row.name AS stateName,
              city_state_row.name AS cityStateName
       FROM addresses address_row
       LEFT JOIN users user_row ON user_row.id = address_row.userId
       LEFT JOIN cities city_row ON city_row.id = address_row.cityId
       LEFT JOIN states state_row ON state_row.id = address_row.stateId
       LEFT JOIN states city_state_row ON city_state_row.id = city_row.stateId
       ORDER BY address_row.legacyId, address_row.id`,
      async (rows, offset, batch) => {
        const count = {
          read: rows.length,
          added: 0,
          updated: 0,
          skipped: 0,
          missingUsers: 0,
          missingCities: 0,
          missingProvinces: 0,
          missingAddressDetails: 0,
          missingRecipientNames: 0,
          invalidPostalCodes: 0,
        };
        await target.beginTransaction();
        try {
          for (const row of rows) {
            const details = [text(row.address1, 255), text(row.address2, 255)]
              .filter(Boolean)
              .join('\n');
            const userId =
              row.userLegacyId === null || row.userLegacyId === undefined
                ? null
                : targetUsers.get(
                    sourceKey(row.userLegacyTable, row.userLegacyId),
                  );
            const city = text(row.cityName, 100);
            const province = text(row.stateName || row.cityStateName, 100);
            const fullName = recipientName(row);
            const phone = recipientPhone(row.username);
            const postalCode = normalizePostalCode(row.postalCode);
            const base = reportRow(row);
            const invalid = [
              ['missing-imported-user', !userId, 'missingUsers'],
              ['missing-city', !city, 'missingCities'],
              ['missing-province', !province, 'missingProvinces'],
              ['missing-address-detail', !details, 'missingAddressDetails'],
              ['missing-recipient-name', !fullName, 'missingRecipientNames'],
              ['invalid-postal-code', !postalCode, 'invalidPostalCodes'],
            ].find(([, condition]) => condition);
            if (invalid) {
              const [type, , counter] = invalid;
              await writeReport({
                type,
                postalCode: !postalCode ? row.postalCode : undefined,
                ...base,
              });
              count[counter] += 1;
              count.skipped += 1;
              continue;
            }

            const values = [
              userId,
              row.addressType === 'billing' ? 'آدرس صورتحساب' : 'آدرس ارسال',
              province,
              city,
              details,
              postalCode,
              null,
              null,
              `نوع آدرس قدیمی: ${row.addressType}`,
              null,
              null,
              fullName,
              phone,
              asBoolean(row.isDefault) ? 1 : 0,
              row.createdAt,
              row.updatedAt,
            ];
            const addressId = String(row.legacyAddressId);
            if (targetAddressIds.has(addressId)) {
              await target.execute(
                `UPDATE user_addresses SET userId = ?, title = ?, province = ?, city = ?, addressDetail = ?, postalCode = ?, plaque = ?, unit = ?, description = ?, lat = ?, \`long\` = ?, recipientFullName = ?, recipientPhone = ?, isDefault = ?, createdAt = ?, updatedAt = ? WHERE id = ?`,
                [...values, addressId],
              );
              count.updated += 1;
            } else {
              await target.execute(
                `INSERT INTO user_addresses (id, userId, title, province, city, addressDetail, postalCode, plaque, unit, description, lat, \`long\`, recipientFullName, recipientPhone, isDefault, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [addressId, ...values],
              );
              targetAddressIds.add(addressId);
              count.added += 1;
            }
          }
          await target.commit();
        } catch (error) {
          await target.rollback();
          throw error;
        }
        console.log(
          JSON.stringify({ entity: 'addresses', batch, offset, ...count }),
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
