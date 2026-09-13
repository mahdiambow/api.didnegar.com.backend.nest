import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import mysql, { type Connection, type RowDataPacket } from 'mysql2/promise';

export function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

export async function openConn(): Promise<Connection> {
  return mysql.createConnection({
    host: env('DB_HOST', 'localhost'),
    port: Number(env('DB_PORT', '3309')),
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
  return env('DB_DATABASE', 'didnegar');
}

export async function ensureIdMap(conn: Connection, target: string) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`${target}\`.legacy_id_map (
      entity VARCHAR(64) NOT NULL,
      legacy_ulid VARCHAR(36) NOT NULL,
      nest_uuid CHAR(36) NOT NULL,
      updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
      PRIMARY KEY (entity, legacy_ulid),
      UNIQUE KEY uq_legacy_id_map_nest (entity, nest_uuid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
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

export function newId() {
  return randomUUID();
}

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
