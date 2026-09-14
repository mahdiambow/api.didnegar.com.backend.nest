import { newId } from '../../common/id/index.js';
/**
 * Import brands from legacy dump DB (didnegar_new) into Nest DB (didnegar).
 *
 * Keeps Nest ULIDs when a brand already exists (match by legacyId+legacyTable, else slug).
 * Maps: logo → logoUrl, description → seoDescription; splits "فارسی - English" when possible.
 *
 * Usage:
 *   SOURCE_DATABASE=didnegar_new npm run db:import:brands
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import mysql from 'mysql2/promise';
import { assertAppMysqlTarget } from '../../config/assert-app-mysql.js';

type LegacyBrand = {
  id: string;
  legacyId: number | string;
  legacyTable: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: number | boolean;
  logo: string | null;
};

type NestBrandRow = {
  id: string;
  legacyId: number | string;
  legacyTable: string;
  slug: string;
};

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

function stripHtml(html: string | null): string | null {
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

function splitName(name: string): { name: string; nameEn: string | null } {
  const matched = name.match(/^(.+?)\s*[-–—]\s*([A-Za-z0-9+&./'\s-]{2,})$/u);
  if (!matched) {
    return { name: name.slice(0, 200), nameEn: null };
  }
  return {
    name: matched[1].trim().slice(0, 200),
    nameEn: matched[2].trim().slice(0, 200),
  };
}

function normalizeSlug(slug: string, legacyId: number): string {
  const base = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (base.length > 0) return base.slice(0, 200);
  return `brand-${legacyId}`;
}

async function main() {
  const host = env('DB_HOST', 'localhost');
  const port = Number(env('DB_PORT', '3309'));
  const user = env('DB_USERNAME', 'didnegar');
  const password = env('DB_PASSWORD', 'didnegar');
  const targetDb = env('DB_DATABASE', 'didnegar');
  const sourceDb = env('SOURCE_DATABASE', 'didnegar_new');
  assertAppMysqlTarget(host, port, targetDb);
  if (targetDb.trim().toLowerCase() === sourceDb.trim().toLowerCase()) {
    throw new Error(
      `DB_DATABASE and SOURCE_DATABASE must differ (both are "${targetDb}").`,
    );
  }

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: false,
  });

  try {
    const [legacyRows] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT id, legacyId, legacyTable, name, slug, description, isActive, logo
       FROM \`${sourceDb}\`.brands
       ORDER BY legacyId ASC`,
    );

    const legacyBrands = legacyRows as unknown as LegacyBrand[];
    console.log(`Source brands: ${legacyBrands.length} (${sourceDb})`);

    const [existingRows] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT id, legacyId, legacyTable, slug FROM \`${targetDb}\`.brands`,
    );
    const existing = existingRows as unknown as NestBrandRow[];

    const byLegacy = new Map(
      existing.map((row) => [`${row.legacyTable}:${row.legacyId}`, row]),
    );
    const bySlug = new Map(existing.map((row) => [row.slug, row]));

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const brand of legacyBrands) {
      const legacyId = Number(brand.legacyId);
      const legacyTable = brand.legacyTable || 'brands';
      const { name, nameEn } = splitName(brand.name ?? '');
      let slug = normalizeSlug(brand.slug ?? '', legacyId);
      const logoUrl = brand.logo?.trim() ? brand.logo.trim().slice(0, 2048) : null;
      const seoDescription = stripHtml(brand.description);
      const isActive = Boolean(brand.isActive);

      if (!name) {
        skipped += 1;
        continue;
      }

      const legacyKey = `${legacyTable}:${legacyId}`;
      const existingByLegacy = byLegacy.get(legacyKey);
      const existingBySlug = bySlug.get(slug);

      // Avoid unique slug clash with a different brand
      if (
        !existingByLegacy &&
        existingBySlug &&
        `${existingBySlug.legacyTable}:${existingBySlug.legacyId}` !== legacyKey
      ) {
        slug = normalizeSlug(`${slug}-${legacyId}`, legacyId);
      }

      if (existingByLegacy) {
        await conn.execute(
          `UPDATE \`${targetDb}\`.brands
           SET name = ?, nameEn = ?, slug = ?, logoUrl = ?, seoDescription = ?, isActive = ?
           WHERE id = ?`,
          [
            name,
            nameEn,
            slug,
            logoUrl,
            seoDescription,
            isActive ? 1 : 0,
            existingByLegacy.id,
          ],
        );
        bySlug.delete(existingByLegacy.slug);
        bySlug.set(slug, { ...existingByLegacy, slug });
        updated += 1;
        continue;
      }

      if (existingBySlug) {
        await conn.execute(
          `UPDATE \`${targetDb}\`.brands
           SET name = ?, nameEn = ?, logoUrl = ?, seoDescription = ?, isActive = ?,
               legacyId = ?, legacyTable = ?
           WHERE id = ?`,
          [
            name,
            nameEn,
            logoUrl,
            seoDescription,
            isActive ? 1 : 0,
            legacyId,
            legacyTable,
            existingBySlug.id,
          ],
        );
        byLegacy.set(legacyKey, {
          ...existingBySlug,
          legacyId,
          legacyTable,
        });
        updated += 1;
        continue;
      }

      const id = newId();
      // Deterministic fallback if random somehow collides (extremely unlikely)
      const safeId =
        id ||
        createHash('sha1').update(`${legacyTable}:${legacyId}`).digest('hex').slice(0, 36);

      await conn.execute(
        `INSERT INTO \`${targetDb}\`.brands
         (id, legacyId, legacyTable, name, nameEn, slug, logoUrl, seoDescription, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          safeId,
          legacyId,
          legacyTable,
          name,
          nameEn,
          slug,
          logoUrl,
          seoDescription,
          isActive ? 1 : 0,
        ],
      );

      const row: NestBrandRow = {
        id: safeId,
        legacyId,
        legacyTable,
        slug,
      };
      byLegacy.set(legacyKey, row);
      bySlug.set(slug, row);
      inserted += 1;
    }

    const [[{ total }]] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM \`${targetDb}\`.brands`,
    );

    console.log(
      JSON.stringify(
        {
          source: sourceDb,
          target: targetDb,
          inserted,
          updated,
          skipped,
          nestBrandsTotal: Number(total),
        },
        null,
        2,
      ),
    );
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
