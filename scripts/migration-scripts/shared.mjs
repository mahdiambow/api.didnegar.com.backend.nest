import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import mysql from 'mysql2/promise';

export const BATCH_SIZE = 1000;

export function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export async function openLegacyConnection() {
  return mysql.createConnection({
    host: requiredEnv('LEGACY_MIGRATED_DB_HOST'),
    port: Number(requiredEnv('LEGACY_MIGRATED_DB_PORT')),
    user: requiredEnv('LEGACY_MIGRATED_DB_USERNAME'),
    password: requiredEnv('LEGACY_MIGRATED_DB_PASSWORD'),
    database: requiredEnv('LEGACY_MIGRATED_DB_DATABASE'),
    charset: 'utf8mb4',
  });
}

export async function openTargetConnection() {
  return mysql.createConnection({
    host: requiredEnv('DB_HOST'),
    port: Number(requiredEnv('DB_PORT')),
    user: requiredEnv('DB_USERNAME'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_DATABASE'),
    charset: 'utf8mb4',
  });
}

export async function assertTables(connection, database, tableNames, side) {
  const [rows] = await connection.execute(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${tableNames.map(() => '?').join(', ')})`,
    [database, ...tableNames],
  );
  const found = new Set(rows.map((row) => row.TABLE_NAME));
  const missing = tableNames.filter((table) => !found.has(table));
  if (missing.length) {
    throw new Error(`${side} database is missing required table(s): ${missing.join(', ')}`);
  }
}

export function asNullableString(value, maxLength) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text.slice(0, maxLength) : null;
}

export function asBoolean(value) {
  return value === true || value === 1 || value === '1';
}

/**
 * The deployed database stores ids as 26-character ULIDs (CHAR(26)).
 * This avoids adding a dependency solely for one-off migration identifiers.
 */
export function newId() {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let timestamp = Date.now();
  let time = '';
  for (let index = 0; index < 10; index += 1) {
    time = alphabet[timestamp % 32] + time;
    timestamp = Math.floor(timestamp / 32);
  }

  let random = 0n;
  for (const byte of randomBytes(10)) random = (random << 8n) | BigInt(byte);
  let entropy = '';
  for (let index = 0; index < 16; index += 1) {
    entropy = alphabet[Number(random & 31n)] + entropy;
    random >>= 5n;
  }
  return time + entropy;
}
