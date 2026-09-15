/**
 * Imports legacy brands into the existing Nest brands structure.
 * Each 1,000-brand batch is committed atomically in its own target transaction.
 */
import {
  BATCH_SIZE,
  asBoolean,
  asNullableString,
  assertTables,
  newId,
  openLegacyConnection,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: npm run db:migrate:brands

Reads legacy brands through LEGACY_MIGRATED_DB_* and writes batches of ${BATCH_SIZE}
brands to the current DB_* database. Each batch is one target transaction.`);
  process.exit(0);
}

function legacyKey(row) {
  return `${row.legacyTable || 'brands'}:${row.legacyId}`;
}

function normalizeSlug(value, fallback) {
  const slug = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return (slug || fallback).slice(0, 200);
}

function uniqueSlug(base, legacyId, slugOwners, ownId = null) {
  let slug = base;
  let sequence = 0;
  while (slugOwners.has(slug) && slugOwners.get(slug) !== ownId) {
    sequence += 1;
    const suffix = `${legacyId}${sequence > 1 ? `-${sequence}` : ''}`;
    slug = `${base.slice(0, Math.max(1, 200 - suffix.length - 1))}-${suffix}`.slice(0, 200);
  }
  return slug;
}

function splitName(value) {
  const name = String(value || '').trim();
  const match = name.match(/^(.+?)\s*[-–—]\s*([A-Za-z0-9+&./'\s-]{2,})$/u);
  if (!match) return { name: name.slice(0, 200), nameEn: null };
  return { name: match[1].trim().slice(0, 200), nameEn: match[2].trim().slice(0, 200) };
}

function stripHtml(value) {
  if (!value) return null;
  const text = String(value)
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
  return text ? text.slice(0, 65535) : null;
}

async function loadTargetBrands(target, legacyRows) {
  const slugs = [...new Set(legacyRows.map((row) => normalizeSlug(row.slug, `brand-${row.legacyId}`)))];
  const legacyClauses = legacyRows.map(() => '(legacyTable = ? AND legacyId = ?)').join(' OR ');
  const [rows] = await target.execute(
    `SELECT id, legacyId, legacyTable, slug FROM brands
     WHERE slug IN (${slugs.map(() => '?').join(', ')}) OR ${legacyClauses}`,
    [
      ...slugs,
      ...legacyRows.flatMap((row) => [row.legacyTable || 'brands', row.legacyId]),
    ],
  );
  return {
    byLegacy: new Map(rows.map((row) => [legacyKey(row), row])),
    bySlug: new Map(rows.map((row) => [String(row.slug), row])),
  };
}

async function migrateBatch({ source, target, rows, offset, batchNumber }) {
  const startedAt = Date.now();
  const brands = await loadTargetBrands(target, rows);
  const slugOwners = new Map([...brands.bySlug].map(([slug, brand]) => [slug, brand.id]));
  const counters = { read: rows.length, added: 0, updated: 0, skipped: 0, slugAdjusted: 0 };

  await target.beginTransaction();
  try {
    for (const row of rows) {
      const legacyId = Number(row.legacyId);
      const legacyTable = String(row.legacyTable || 'brands');
      const { name, nameEn } = splitName(row.name);
      if (!name) {
        counters.skipped += 1;
        continue;
      }

      const key = `${legacyTable}:${legacyId}`;
      let existing = brands.byLegacy.get(key) || null;
      const initialSlug = normalizeSlug(row.slug, `brand-${legacyId}`);
      if (!existing) {
        const slugMatch = brands.bySlug.get(initialSlug);
        if (slugMatch && (!slugMatch.legacyTable || legacyKey(slugMatch) === key)) existing = slugMatch;
      }
      const slug = uniqueSlug(initialSlug, legacyId, slugOwners, existing?.id || null);
      if (slug !== initialSlug) counters.slugAdjusted += 1;

      const values = [
        legacyId,
        legacyTable,
        name,
        nameEn,
        slug,
        asNullableString(row.logo, 2048),
        stripHtml(row.description),
        asBoolean(row.isActive) ? 1 : 0,
        row.createdAt,
        row.updatedAt,
      ];
      if (existing) {
        await target.execute(
          `UPDATE brands SET legacyId = ?, legacyTable = ?, name = ?, nameEn = ?, slug = ?,
           logoUrl = ?, seoDescription = ?, isActive = ?, createdAt = ?, updatedAt = ?
           WHERE id = ?`,
          [...values, existing.id],
        );
        if (existing.slug !== slug) slugOwners.delete(existing.slug);
        Object.assign(existing, { legacyId, legacyTable, slug });
        brands.byLegacy.set(key, existing);
        brands.bySlug.set(slug, existing);
        slugOwners.set(slug, existing.id);
        counters.updated += 1;
      } else {
        const id = newId();
        await target.execute(
          `INSERT INTO brands (id, legacyId, legacyTable, name, nameEn, slug, logoUrl,
           seoDescription, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, ...values],
        );
        const inserted = { id, legacyId, legacyTable, slug };
        brands.byLegacy.set(key, inserted);
        brands.bySlug.set(slug, inserted);
        slugOwners.set(slug, id);
        counters.added += 1;
      }
    }
    await target.commit();
  } catch (error) {
    await target.rollback();
    throw error;
  }

  console.log(JSON.stringify({ batch: batchNumber, offset, ...counters, elapsedMs: Date.now() - startedAt }, null, 2));
  return counters;
}

async function main() {
  const sourceDatabase = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
  const targetDatabase = requiredEnv('DB_DATABASE');
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const totals = { read: 0, added: 0, updated: 0, skipped: 0, slugAdjusted: 0 };
  try {
    await assertTables(source, sourceDatabase, ['brands'], 'Legacy');
    await assertTables(target, targetDatabase, ['brands'], 'Target');
    let offset = 0;
    let batchNumber = 0;
    while (true) {
      const [rows] = await source.execute(
        `SELECT id, legacyId, legacyTable, name, slug, description, isActive, logo, createdAt, updatedAt
         FROM brands ORDER BY legacyId ASC, id ASC LIMIT ? OFFSET ?`,
        [BATCH_SIZE, offset],
      );
      if (!rows.length) break;
      batchNumber += 1;
      try {
        const counters = await migrateBatch({ source, target, rows, offset, batchNumber });
        for (const key of Object.keys(totals)) totals[key] += counters[key];
      } catch (error) {
        console.error(JSON.stringify({ batch: batchNumber, offset, rolledBack: true, error: error.message }, null, 2));
        throw error;
      }
      offset += rows.length;
      if (rows.length < BATCH_SIZE) break;
    }
    console.log(JSON.stringify({ complete: true, batches: batchNumber, ...totals }, null, 2));
  } finally {
    await Promise.all([source.end(), target.end()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
