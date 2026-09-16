/**
 * Reshapes the two-level legacy catalog into Nest's parent-category/category model.
 * Legacy categories become parent_categories and legacy sub_categories become categories.
 */
import {
  BATCH_SIZE,
  asNullableString,
  assertColumns,
  assertTables,
  newId,
  openLegacyConnection,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

const DEFAULT_PARENT_SLUG = 'default';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: npm run db:migrate:categories

Reads legacy categories and sub_categories through LEGACY_MIGRATED_DB_* and writes
the reshaped catalog to the current DB_* database. Each target batch is one transaction.`);
  process.exit(0);
}

function requiredText(value, maxLength, field) {
  const result = String(value ?? '')
    .trim()
    .slice(0, maxLength);
  if (!result)
    throw new Error(`Legacy category has an empty required ${field}.`);
  return result;
}

function normalizeSlug(value, fallback) {
  const slug = String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return (slug || fallback).slice(0, 200);
}

function uniqueSlug(base, legacyId, owners, ownId = null) {
  let slug = base;
  let suffixNumber = 0;
  while (owners.has(slug) && owners.get(slug) !== ownId) {
    suffixNumber += 1;
    const suffix = `${legacyId}${suffixNumber > 1 ? `-${suffixNumber}` : ''}`;
    slug =
      `${base.slice(0, Math.max(1, 200 - suffix.length - 1))}-${suffix}`.slice(
        0,
        200,
      );
  }
  return slug;
}

function legacyKey(row, table) {
  return `${table}:${Number(row.legacyId)}`;
}

function add(totals, counters) {
  for (const key of Object.keys(totals)) totals[key] += counters[key];
}

async function loadTargetParents(target) {
  const [found] = await target.execute(
    'SELECT id, legacyId, legacyTable, slug FROM parent_categories',
  );
  return {
    byId: new Map(found.map((row) => [String(row.id), row])),
    byLegacy: new Map(
      found
        .filter((row) => row.legacyId !== null)
        .map((row) => [legacyKey(row, String(row.legacyTable)), row]),
    ),
    bySlug: new Map(found.map((row) => [String(row.slug), row])),
  };
}

async function migrateParents({
  target,
  rows,
  offset,
  batchNumber,
  parentIds,
}) {
  const startedAt = Date.now();
  const targetRows = await loadTargetParents(target);
  const slugOwners = new Map(
    [...targetRows.bySlug].map(([slug, row]) => [slug, row.id]),
  );
  const counters = {
    read: rows.length,
    added: 0,
    updated: 0,
    skipped: 0,
    slugAdjusted: 0,
  };
  await target.beginTransaction();
  try {
    for (const [index, row] of rows.entries()) {
      const sourceId = requiredText(row.id, 26, 'id');
      const legacyId = Number(row.legacyId);
      const name = requiredText(row.name, 255, 'name');
      const initialSlug = normalizeSlug(row.slug, `category-${legacyId}`);
      const key = `categories:${legacyId}`;
      let existing =
        targetRows.byLegacy.get(key) || targetRows.byId.get(sourceId) || null;
      if (!existing) {
        const slugMatch = targetRows.bySlug.get(initialSlug);
        if (
          slugMatch &&
          (!slugMatch.legacyTable ||
            legacyKey(slugMatch, String(slugMatch.legacyTable)) === key)
        ) {
          existing = slugMatch;
        }
      }
      const slug = uniqueSlug(
        initialSlug,
        legacyId,
        slugOwners,
        existing?.id || null,
      );
      if (slug !== initialSlug) counters.slugAdjusted += 1;
      const values = [
        legacyId,
        'categories',
        name,
        slug,
        asNullableString(row.image, 2048),
        offset + index,
        row.createdAt,
        row.updatedAt,
      ];
      if (existing) {
        await target.execute(
          `UPDATE parent_categories SET legacyId = ?, legacyTable = ?, name = ?, nameEn = NULL,
           slug = ?, icon = NULL, image = ?, sort = ?, isActive = 1, createdAt = ?, updatedAt = ? WHERE id = ?`,
          [...values, existing.id],
        );
        if (existing.slug !== slug) slugOwners.delete(existing.slug);
        Object.assign(existing, { legacyId, legacyTable: 'categories', slug });
        targetRows.byLegacy.set(key, existing);
        targetRows.bySlug.set(slug, existing);
        slugOwners.set(slug, existing.id);
        counters.updated += 1;
      } else {
        await target.execute(
          `INSERT INTO parent_categories (id, legacyId, legacyTable, name, nameEn, slug, icon, image,
           sort, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, NULL, ?, NULL, ?, ?, 1, ?, ?)`,
          [sourceId, ...values],
        );
        const inserted = {
          id: sourceId,
          legacyId,
          legacyTable: 'categories',
          slug,
        };
        targetRows.byLegacy.set(key, inserted);
        targetRows.bySlug.set(slug, inserted);
        slugOwners.set(slug, sourceId);
        counters.added += 1;
      }
      parentIds.set(sourceId, existing?.id || sourceId);
    }
    await target.commit();
  } catch (error) {
    await target.rollback();
    throw error;
  }
  console.log(
    JSON.stringify(
      {
        entity: 'parent_categories',
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

async function ensureDefaultParent(target) {
  const [existing] = await target.execute(
    'SELECT id FROM parent_categories WHERE slug = ? LIMIT 1',
    [DEFAULT_PARENT_SLUG],
  );
  if (existing[0]) return existing[0].id;
  const id = newId();
  await target.execute(
    `INSERT INTO parent_categories (id, legacyId, legacyTable, name, nameEn, slug, icon, image,
     sort, isActive, createdAt, updatedAt) VALUES (?, NULL, 'migration_defaults', 'default', NULL, ?, NULL, NULL, 999999, 1, NOW(), NOW())`,
    [id, DEFAULT_PARENT_SLUG],
  );
  return id;
}

async function loadTargetCategories(target, parentIds, defaultParentId) {
  const [found] = await target.execute(
    'SELECT id, legacyId, legacyTable, slug FROM categories',
  );
  return {
    byId: new Map(found.map((row) => [String(row.id), row])),
    byLegacy: new Map(
      found
        .filter((row) => row.legacyId !== null)
        .map((row) => [legacyKey(row, String(row.legacyTable)), row]),
    ),
    bySlug: new Map(found.map((row) => [String(row.slug), row])),
    parentFor: (sourceParentId) =>
      parentIds.get(String(sourceParentId)) || defaultParentId,
  };
}

async function migrateCategories({
  target,
  rows,
  offset,
  batchNumber,
  parentIds,
  defaultParentId,
}) {
  const startedAt = Date.now();
  const targetRows = await loadTargetCategories(
    target,
    parentIds,
    defaultParentId,
  );
  const slugOwners = new Map(
    [...targetRows.bySlug].map(([slug, row]) => [slug, row.id]),
  );
  const counters = {
    read: rows.length,
    added: 0,
    updated: 0,
    skipped: 0,
    slugAdjusted: 0,
    defaultAssigned: 0,
  };
  await target.beginTransaction();
  try {
    for (const row of rows) {
      const sourceId = requiredText(row.id, 26, 'id');
      const legacyId = Number(row.legacyId);
      const name = requiredText(row.name, 255, 'name');
      const sourceParentId =
        row.categoryId === null ? null : String(row.categoryId);
      const parentCategoryId = targetRows.parentFor(sourceParentId);
      if (!sourceParentId || !parentIds.has(sourceParentId))
        counters.defaultAssigned += 1;
      const initialSlug = normalizeSlug(row.slug, `sub-category-${legacyId}`);
      const key = `sub_categories:${legacyId}`;
      let existing =
        targetRows.byLegacy.get(key) || targetRows.byId.get(sourceId) || null;
      if (!existing) {
        const slugMatch = targetRows.bySlug.get(initialSlug);
        if (
          slugMatch &&
          (!slugMatch.legacyTable ||
            legacyKey(slugMatch, String(slugMatch.legacyTable)) === key)
        ) {
          existing = slugMatch;
        }
      }
      const slug = uniqueSlug(
        initialSlug,
        legacyId,
        slugOwners,
        existing?.id || null,
      );
      if (slug !== initialSlug) counters.slugAdjusted += 1;
      const sort = Number.isFinite(Number(row.position))
        ? Number(row.position)
        : 0;
      const values = [
        parentCategoryId,
        legacyId,
        'sub_categories',
        name,
        slug,
        asNullableString(row.image, 2048),
        sort,
        row.createdAt,
        row.updatedAt,
      ];
      if (existing) {
        await target.execute(
          `UPDATE categories SET parentCategoryId = ?, legacyId = ?, legacyTable = ?, name = ?, nameEn = NULL,
           slug = ?, icon = NULL, image = ?, sort = ?, isActive = 1, createdAt = ?, updatedAt = ? WHERE id = ?`,
          [...values, existing.id],
        );
        if (existing.slug !== slug) slugOwners.delete(existing.slug);
        Object.assign(existing, {
          legacyId,
          legacyTable: 'sub_categories',
          slug,
        });
        targetRows.byLegacy.set(key, existing);
        targetRows.bySlug.set(slug, existing);
        slugOwners.set(slug, existing.id);
        counters.updated += 1;
      } else {
        await target.execute(
          `INSERT INTO categories (id, parentCategoryId, legacyId, legacyTable, name, nameEn, slug, icon,
           image, sort, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?, 1, ?, ?)`,
          [sourceId, ...values],
        );
        const inserted = {
          id: sourceId,
          legacyId,
          legacyTable: 'sub_categories',
          slug,
        };
        targetRows.byLegacy.set(key, inserted);
        targetRows.bySlug.set(slug, inserted);
        slugOwners.set(slug, sourceId);
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
        entity: 'categories',
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

async function hasOrphanSubCategories(source) {
  const [rows] = await source.execute(
    `SELECT EXISTS(
       SELECT 1 FROM sub_categories sub
       LEFT JOIN categories parent ON parent.id = sub.categoryId
       WHERE sub.categoryId IS NULL OR parent.id IS NULL
     ) AS hasOrphans`,
  );
  return Boolean(rows[0]?.hasOrphans);
}

async function main() {
  const sourceDatabase = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
  const targetDatabase = requiredEnv('DB_DATABASE');
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const parentIds = new Map();
  const totals = {
    read: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    slugAdjusted: 0,
    defaultAssigned: 0,
  };
  try {
    await assertTables(
      source,
      sourceDatabase,
      ['categories', 'sub_categories'],
      'Legacy',
    );
    await assertTables(
      target,
      targetDatabase,
      ['parent_categories', 'categories'],
      'Target',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'categories',
      ['id', 'legacyId', 'name', 'slug', 'image', 'createdAt', 'updatedAt'],
      'Legacy',
    );
    await assertColumns(
      source,
      sourceDatabase,
      'sub_categories',
      [
        'id',
        'legacyId',
        'categoryId',
        'name',
        'slug',
        'image',
        'position',
        'createdAt',
        'updatedAt',
      ],
      'Legacy',
    );
    await assertColumns(
      target,
      targetDatabase,
      'parent_categories',
      [
        'id',
        'legacyId',
        'legacyTable',
        'name',
        'nameEn',
        'slug',
        'icon',
        'image',
        'sort',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
      'Target',
    );
    await assertColumns(
      target,
      targetDatabase,
      'categories',
      [
        'id',
        'parentCategoryId',
        'legacyId',
        'legacyTable',
        'name',
        'nameEn',
        'slug',
        'icon',
        'image',
        'sort',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
      'Target',
    );

    const batches = {};
    batches.parents = await readBatches(
      source,
      'SELECT id, legacyId, name, slug, image, createdAt, updatedAt FROM categories ORDER BY legacyId ASC, id ASC',
      async (rows, offset, batchNumber) => {
        add(
          totals,
          await migrateParents({
            target,
            rows,
            offset,
            batchNumber,
            parentIds,
          }),
        );
      },
    );
    let defaultParentId = null;
    if (await hasOrphanSubCategories(source)) {
      await target.beginTransaction();
      try {
        defaultParentId = await ensureDefaultParent(target);
        await target.commit();
      } catch (error) {
        await target.rollback();
        throw error;
      }
    }
    batches.categories = await readBatches(
      source,
      'SELECT id, legacyId, categoryId, name, slug, image, position, createdAt, updatedAt FROM sub_categories ORDER BY legacyId ASC, id ASC',
      async (rows, offset, batchNumber) => {
        add(
          totals,
          await migrateCategories({
            target,
            rows,
            offset,
            batchNumber,
            parentIds,
            defaultParentId,
          }),
        );
      },
    );
    console.log(
      JSON.stringify(
        { complete: true, defaultParentId, batches, ...totals },
        null,
        2,
      ),
    );
  } finally {
    await Promise.all([source.end(), target.end()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
