/**
 * Imports legacy categories into Nest categories and legacy sub_categories into
 * Nest sub_categories. Parent categories are Nest-owned and selected automatically.
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

const DEFAULT_CATEGORY_SLUG = 'default';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: npm run db:migrate:categories

Attaches legacy categories to the first existing Nest parent category (by sort and
name), or creates a default parent category when none exists.`);
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
  let sequence = 0;
  while (owners.has(slug) && owners.get(slug) !== ownId) {
    sequence += 1;
    const suffix = `${legacyId}${sequence > 1 ? `-${sequence}` : ''}`;
    slug =
      `${base.slice(0, Math.max(1, 200 - suffix.length - 1))}-${suffix}`.slice(
        0,
        200,
      );
  }
  return slug;
}

function legacyKey(row) {
  return `${row.legacyTable}:${Number(row.legacyId)}`;
}

function add(totals, counters) {
  for (const key of Object.keys(totals)) totals[key] += counters[key];
}

async function ensureParentCategory(target) {
  const [existing] = await target.execute(
    'SELECT id FROM parent_categories ORDER BY sort ASC, name ASC, id ASC LIMIT 1',
  );
  if (existing[0]) return existing[0].id;
  const id = newId();
  await target.execute(
    `INSERT INTO parent_categories (id, legacyId, legacyTable, name, nameEn, slug, icon, image,
     sort, isActive, createdAt, updatedAt) VALUES (?, NULL, 'migration_defaults', 'default', NULL,
     'default', NULL, NULL, 0, 1, NOW(), NOW())`,
    [id],
  );
  return id;
}

async function loadTargetCategories(target) {
  const [rows] = await target.execute(
    'SELECT id, parentCategoryId, legacyId, legacyTable, slug FROM categories',
  );
  return {
    byId: new Map(rows.map((row) => [String(row.id), row])),
    byLegacy: new Map(
      rows
        .filter((row) => row.legacyId !== null)
        .map((row) => [legacyKey(row), row]),
    ),
    bySlug: new Map(rows.map((row) => [String(row.slug), row])),
  };
}

async function migrateCategoryBatch({
  target,
  rows,
  offset,
  batchNumber,
  parentCategoryId,
  categoryIds,
}) {
  const startedAt = Date.now();
  const targetRows = await loadTargetCategories(target);
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
      const key = `categories:${legacyId}`;
      const initialSlug = normalizeSlug(row.slug, `category-${legacyId}`);
      let existing =
        targetRows.byLegacy.get(key) || targetRows.byId.get(sourceId) || null;
      if (!existing) {
        const slugMatch = targetRows.bySlug.get(initialSlug);
        if (
          slugMatch &&
          (!slugMatch.legacyTable || legacyKey(slugMatch) === key)
        )
          existing = slugMatch;
      }
      const slug = uniqueSlug(
        initialSlug,
        legacyId,
        slugOwners,
        existing?.id || null,
      );
      if (slug !== initialSlug) counters.slugAdjusted += 1;
      const values = [
        parentCategoryId,
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
          `UPDATE categories SET parentCategoryId = ?, legacyId = ?, legacyTable = ?, name = ?, nameEn = NULL,
           slug = ?, icon = NULL, image = ?, sort = ?, isActive = 1, createdAt = ?, updatedAt = ? WHERE id = ?`,
          [...values, existing.id],
        );
        if (existing.slug !== slug) slugOwners.delete(existing.slug);
        Object.assign(existing, {
          parentCategoryId,
          legacyId,
          legacyTable: 'categories',
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
          parentCategoryId,
          legacyId,
          legacyTable: 'categories',
          slug,
        };
        targetRows.byLegacy.set(key, inserted);
        targetRows.bySlug.set(slug, inserted);
        slugOwners.set(slug, sourceId);
        counters.added += 1;
      }
      categoryIds.set(sourceId, existing?.id || sourceId);
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

async function ensureDefaultCategory(target, parentCategoryId) {
  const [existing] = await target.execute(
    'SELECT id FROM categories WHERE parentCategoryId = ? AND slug = ? LIMIT 1',
    [parentCategoryId, DEFAULT_CATEGORY_SLUG],
  );
  if (existing[0]) return existing[0].id;
  const id = newId();
  await target.execute(
    `INSERT INTO categories (id, parentCategoryId, legacyId, legacyTable, name, nameEn, slug, icon, image,
     sort, isActive, createdAt, updatedAt) VALUES (?, ?, NULL, 'migration_defaults', 'default', NULL, ?, NULL,
     NULL, 999999, 1, NOW(), NOW())`,
    [id, parentCategoryId, DEFAULT_CATEGORY_SLUG],
  );
  return id;
}

async function loadTargetSubCategories(target) {
  const [rows] = await target.execute(
    'SELECT id, categoryId, legacyId, legacyTable, slug FROM sub_categories',
  );
  return {
    byId: new Map(rows.map((row) => [String(row.id), row])),
    byLegacy: new Map(
      rows
        .filter((row) => row.legacyId !== null)
        .map((row) => [legacyKey(row), row]),
    ),
    byCategorySlug: new Map(
      rows.map((row) => [`${row.categoryId}:${row.slug}`, row]),
    ),
  };
}

async function migrateSubCategoryBatch({
  target,
  rows,
  offset,
  batchNumber,
  categoryIds,
  defaultCategoryId,
}) {
  const startedAt = Date.now();
  const targetRows = await loadTargetSubCategories(target);
  const owners = new Map(
    [...targetRows.byCategorySlug].map(([key, row]) => [key, row.id]),
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
      const sourceCategoryId =
        row.categoryId === null ? null : String(row.categoryId);
      const categoryId = sourceCategoryId
        ? categoryIds.get(sourceCategoryId)
        : null;
      if (!categoryId && !defaultCategoryId) {
        throw new Error(
          `Legacy sub-category ${sourceId} has no category and no default category.`,
        );
      }
      const resolvedCategoryId = categoryId || defaultCategoryId;
      if (!categoryId) counters.defaultAssigned += 1;
      const name = requiredText(row.name, 255, 'name');
      const key = `sub_categories:${legacyId}`;
      const initialSlug = normalizeSlug(row.slug, `sub-category-${legacyId}`);
      let existing =
        targetRows.byLegacy.get(key) || targetRows.byId.get(sourceId) || null;
      if (!existing) {
        const slugMatch = targetRows.byCategorySlug.get(
          `${resolvedCategoryId}:${initialSlug}`,
        );
        if (
          slugMatch &&
          (!slugMatch.legacyTable || legacyKey(slugMatch) === key)
        )
          existing = slugMatch;
      }
      const baseKey = `${resolvedCategoryId}:${initialSlug}`;
      let slug = initialSlug;
      let sequence = 0;
      while (
        owners.has(`${resolvedCategoryId}:${slug}`) &&
        owners.get(`${resolvedCategoryId}:${slug}`) !== existing?.id
      ) {
        sequence += 1;
        const suffix = `${legacyId}${sequence > 1 ? `-${sequence}` : ''}`;
        slug =
          `${initialSlug.slice(0, Math.max(1, 200 - suffix.length - 1))}-${suffix}`.slice(
            0,
            200,
          );
      }
      if (`${resolvedCategoryId}:${slug}` !== baseKey)
        counters.slugAdjusted += 1;
      const sort = Number.isFinite(Number(row.position))
        ? Number(row.position)
        : 0;
      const values = [
        resolvedCategoryId,
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
          `UPDATE sub_categories SET categoryId = ?, legacyId = ?, legacyTable = ?, name = ?, nameEn = NULL,
           slug = ?, icon = NULL, image = ?, sort = ?, isActive = 1, createdAt = ?, updatedAt = ? WHERE id = ?`,
          [...values, existing.id],
        );
        if (
          existing.categoryId !== resolvedCategoryId ||
          existing.slug !== slug
        )
          owners.delete(`${existing.categoryId}:${existing.slug}`);
        Object.assign(existing, {
          categoryId: resolvedCategoryId,
          legacyId,
          legacyTable: 'sub_categories',
          slug,
        });
        targetRows.byLegacy.set(key, existing);
        owners.set(`${resolvedCategoryId}:${slug}`, existing.id);
        counters.updated += 1;
      } else {
        await target.execute(
          `INSERT INTO sub_categories (id, categoryId, legacyId, legacyTable, name, nameEn, slug, icon,
           image, sort, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?, 1, ?, ?)`,
          [sourceId, ...values],
        );
        const inserted = {
          id: sourceId,
          categoryId: resolvedCategoryId,
          legacyId,
          legacyTable: 'sub_categories',
          slug,
        };
        targetRows.byLegacy.set(key, inserted);
        owners.set(`${resolvedCategoryId}:${slug}`, sourceId);
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
        entity: 'sub_categories',
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
    `SELECT EXISTS(SELECT 1 FROM sub_categories sub LEFT JOIN categories category_row
     ON category_row.id = sub.categoryId WHERE sub.categoryId IS NULL OR category_row.id IS NULL) AS hasOrphans`,
  );
  return Boolean(rows[0]?.hasOrphans);
}

async function main() {
  const sourceDatabase = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
  const targetDatabase = requiredEnv('DB_DATABASE');
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const categoryIds = new Map();
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
      ['parent_categories', 'categories', 'sub_categories'],
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
    await target.beginTransaction();
    let parentCategoryId;
    try {
      parentCategoryId = await ensureParentCategory(target);
      await target.commit();
    } catch (error) {
      await target.rollback();
      throw error;
    }
    const batches = {};
    batches.categories = await readBatches(
      source,
      'SELECT id, legacyId, name, slug, image, createdAt, updatedAt FROM categories ORDER BY legacyId ASC, id ASC',
      async (rows, offset, batchNumber) => {
        add(
          totals,
          await migrateCategoryBatch({
            target,
            rows,
            offset,
            batchNumber,
            parentCategoryId,
            categoryIds,
          }),
        );
      },
    );
    let defaultCategoryId = null;
    if (await hasOrphanSubCategories(source)) {
      await target.beginTransaction();
      try {
        defaultCategoryId = await ensureDefaultCategory(
          target,
          parentCategoryId,
        );
        await target.commit();
      } catch (error) {
        await target.rollback();
        throw error;
      }
    }
    batches.subCategories = await readBatches(
      source,
      'SELECT id, legacyId, categoryId, name, slug, image, position, createdAt, updatedAt FROM sub_categories ORDER BY legacyId ASC, id ASC',
      async (rows, offset, batchNumber) => {
        add(
          totals,
          await migrateSubCategoryBatch({
            target,
            rows,
            offset,
            batchNumber,
            categoryIds,
            defaultCategoryId,
          }),
        );
      },
    );
    console.log(
      JSON.stringify(
        {
          complete: true,
          parentCategoryId,
          defaultCategoryId,
          batches,
          ...totals,
        },
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
