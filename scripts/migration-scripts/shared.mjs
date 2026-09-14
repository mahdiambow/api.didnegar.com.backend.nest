import 'dotenv/config';
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
