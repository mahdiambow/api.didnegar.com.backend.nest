import { newId } from '../../../common/id/index.js';
import 'dotenv/config';
import mysql, { type Connection, type RowDataPacket } from 'mysql2/promise';
import { assertAppMysqlTarget } from '../../../config/assert-app-mysql.js';

export function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

export async function openConn(): Promise<Connection> {
  const host = env('DB_HOST', 'localhost');
  const port = Number(env('DB_PORT', '3309'));
  const database = env('DB_DATABASE', 'didnegar');
  assertAppMysqlTarget(host, port, database);
  return mysql.createConnection({
    host,
    port,
    user: env('DB_USERNAME', 'didnegar'),
    password: env('DB_PASSWORD', 'didnegar'),
    multipleStatements: true,
    charset: 'utf8mb4',
  });
}

export function sourceDb() {
  return env('SOURCE_DATABASE', 'didnegar_new');
}

export function targetDb() {
  const target = env('DB_DATABASE', 'didnegar');
  assertAppMysqlTarget(undefined, undefined, target);
  if (target.trim().toLowerCase() === sourceDb().trim().toLowerCase()) {
    throw new Error(
      `DB_DATABASE and SOURCE_DATABASE must differ (both are "${target}"). ` +
        `Nest target cannot be didnegar_new.`,
    );
  }
  return target;
}

export async function ensureIdMap(conn: Connection, target: string) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`${target}\`.legacy_id_map (
      entity VARCHAR(64) NOT NULL,
      legacy_ulid VARCHAR(26) NOT NULL,
      nest_uuid CHAR(26) NOT NULL,
      updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (entity, legacy_ulid),
      UNIQUE KEY uq_legacy_id_map_nest (entity, nest_uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  // ارتقا از نسخهٔ قبلی CHAR(36)
  await conn.query(`
    ALTER TABLE \`${target}\`.legacy_id_map
      MODIFY legacy_ulid VARCHAR(26) NOT NULL,
      MODIFY nest_uuid CHAR(26) NOT NULL
  `).catch(() => undefined);
}

export async function putMap(
  conn: Connection,
  target: string,
  entity: string,
  legacyUlid: string,
  nestUuid: string,
) {
  await conn.execute(
    `INSERT INTO \`${target}\`.legacy_id_map (entity, legacy_ulid, nest_uuid)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE nest_uuid = VALUES(nest_uuid)`,
    [entity, legacyUlid, nestUuid],
  );
}

export async function getMap(
  conn: Connection,
  target: string,
  entity: string,
  legacyUlid: string | null | undefined,
): Promise<string | null> {
  if (!legacyUlid) return null;
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT nest_uuid FROM \`${target}\`.legacy_id_map
     WHERE entity = ? AND legacy_ulid = ? LIMIT 1`,
    [entity, legacyUlid],
  );
  return rows[0]?.nest_uuid ?? null;
}

export async function loadMap(
  conn: Connection,
  target: string,
  entity: string,
): Promise<Map<string, string>> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT legacy_ulid, nest_uuid FROM \`${target}\`.legacy_id_map WHERE entity = ?`,
    [entity],
  );
  return new Map(rows.map((r) => [String(r.legacy_ulid), String(r.nest_uuid)]));
}

export function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 0 ? text.slice(0, 8000) : null;
}

export function normalizeSlug(slug: string, fallback: string): string {
  const base = (slug || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return (base || fallback).slice(0, 200);
}

/** Absolute URL when possible; relative dump paths prefixed with MEDIA_PUBLIC_BASE_URL. */
export function toMediaUrl(path: string | null | undefined): string | null {
  if (path == null) return null;
  const trimmed = String(path).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.slice(0, 2048);
  const base = (process.env.MEDIA_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (!base) return trimmed.slice(0, 2048);
  return `${base}/${trimmed.replace(/^\//, '')}`.slice(0, 2048);
}

export function splitFaEn(name: string): { name: string; nameEn: string | null } {
  const matched = name.match(/^(.+?)\s*[-–—]\s*([A-Za-z0-9+&./'\s-]{2,})$/u);
  if (!matched) return { name: name.slice(0, 255), nameEn: null };
  return {
    name: matched[1].trim().slice(0, 255),
    nameEn: matched[2].trim().slice(0, 255),
  };
}

export { newId };

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function logStep(step: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ step, ...data }, null, 2));
}

export type StepContext = {
  conn: Connection;
  source: string;
  target: string;
};
