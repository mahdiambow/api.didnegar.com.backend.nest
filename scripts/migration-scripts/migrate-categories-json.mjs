/**
 * Seeds the category hierarchy defined in ../../categories.json.
 *
 * Rows managed by this script are identified by their legacyTable/legacyId pair,
 * not by their display names. This makes the import safe to rerun and ensures a
 * category is always placed below the parent declared in the JSON file.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  assertTables,
  newId,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

const SOURCE_TABLE = 'categories_json';
const SOURCE_FILE = fileURLToPath(
  new URL('./categories.json', import.meta.url),
);

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`Usage: npm run db:migrate:categories-json

Creates or updates the parent-category/category/sub-category tree in
categories.json. The operation is idempotent and does not remove unmanaged rows.`);
  process.exit(0);
}

function text(value, field) {
  const result = String(value ?? '').trim();
  if (!result) throw new Error(`categories.json has an empty ${field}.`);
  return result.slice(0, 255);
}

function slugPart(value, fallback) {
  const slug = String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || fallback;
}

function baseSlug(parts) {
  return parts
    .map(([value, fallback]) => slugPart(value, fallback))
    .join('-')
    .slice(0, 200);
}

function uniqueSlug(
  base,
  identity,
  owners,
  ownId = null,
  keyForSlug = (slug) => slug,
) {
  let slug = base;
  let suffix = 1;
  while (
    owners.has(keyForSlug(slug)) &&
    owners.get(keyForSlug(slug)) !== ownId
  ) {
    suffix += 1;
    const ending = `-${identity}-${suffix}`;
    slug = `${base.slice(0, Math.max(1, 200 - ending.length))}${ending}`;
  }
  return slug;
}

function sourceKey(kind, index) {
  // The kind has its own legacyTable, so each deterministic traversal index is
  // sufficient and stays within the BIGINT column used by category entities.
  return { legacyTable: `${SOURCE_TABLE}:${kind}`, legacyId: index + 1 };
}

async function readSource() {
  const data = JSON.parse(await readFile(SOURCE_FILE, 'utf8'));
  if (!Array.isArray(data.parent_categories)) {
    throw new Error('categories.json must contain a parent_categories array.');
  }
  return data.parent_categories.map((parent, parentIndex) => {
    const categories = parent?.categories;
    if (!Array.isArray(categories)) {
      throw new Error(
        `Parent category ${parentIndex + 1} must contain a categories array.`,
      );
    }
    return {
      name: text(parent.name_fa, `parent_categories[${parentIndex}].name_fa`),
      nameEn: text(parent.name_en, `parent_categories[${parentIndex}].name_en`),
      categories: categories.map((category, categoryIndex) => {
        const subCategories = category?.sub_categories ?? [];
        if (!Array.isArray(subCategories)) {
          throw new Error(
            `Category ${parentIndex + 1}/${categoryIndex + 1} has invalid sub_categories.`,
          );
        }
        return {
          name: text(
            category.name_fa,
            `categories[${parentIndex}][${categoryIndex}].name_fa`,
          ),
          nameEn: text(
            category.name_en,
            `categories[${parentIndex}][${categoryIndex}].name_en`,
          ),
          subCategories: subCategories.map((subCategory, subCategoryIndex) => ({
            name: text(
              subCategory.name_fa,
              `sub_categories[${parentIndex}][${categoryIndex}][${subCategoryIndex}].name_fa`,
            ),
            nameEn: text(
              subCategory.name_en,
              `sub_categories[${parentIndex}][${categoryIndex}][${subCategoryIndex}].name_en`,
            ),
          })),
        };
      }),
    };
  });
}

async function loadRows(connection, table) {
  const [rows] = await connection.execute(
    `SELECT id, legacyId, legacyTable, slug${table === 'sub_categories' ? ', categoryId' : ''} FROM ${table}`,
  );
  const bySource = new Map();
  const slugOwners = new Map();
  for (const row of rows) {
    const slugKey =
      table === 'sub_categories'
        ? `${row.categoryId}:${row.slug}`
        : String(row.slug);
    slugOwners.set(slugKey, String(row.id));
    if (row.legacyId !== null && row.legacyTable) {
      bySource.set(`${row.legacyTable}:${row.legacyId}`, row);
    }
  }
  return { bySource, slugOwners };
}

async function upsertParent(connection, row, source, sort, state) {
  const key = `${source.legacyTable}:${source.legacyId}`;
  const existing = state.bySource.get(key);
  const slug = uniqueSlug(
    baseSlug([
      [row.nameEn, `parent-${source.legacyId}`],
      [source.legacyId, ''],
    ]),
    source.legacyId,
    state.slugOwners,
    existing?.id,
  );
  if (existing) {
    await connection.execute(
      `UPDATE parent_categories SET name = ?, nameEn = ?, slug = ?, sort = ?, isActive = 1, updatedAt = NOW() WHERE id = ?`,
      [row.name, row.nameEn, slug, sort, existing.id],
    );
    if (existing.slug !== slug) state.slugOwners.delete(existing.slug);
    existing.slug = slug;
    state.slugOwners.set(slug, String(existing.id));
    return String(existing.id);
  }
  const id = newId();
  await connection.execute(
    `INSERT INTO parent_categories (id, legacyId, legacyTable, name, nameEn, slug, icon, image, sort, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, 1, NOW(), NOW())`,
    [id, source.legacyId, source.legacyTable, row.name, row.nameEn, slug, sort],
  );
  const inserted = { id, slug };
  state.bySource.set(key, inserted);
  state.slugOwners.set(slug, id);
  return id;
}

async function upsertCategory(
  connection,
  row,
  source,
  parentCategoryId,
  sort,
  state,
  parentSlug,
) {
  const key = `${source.legacyTable}:${source.legacyId}`;
  const existing = state.bySource.get(key);
  const slug = uniqueSlug(
    baseSlug([
      [parentSlug, `parent-${source.legacyId}`],
      [row.nameEn, `category-${source.legacyId}`],
      [source.legacyId, ''],
    ]),
    source.legacyId,
    state.slugOwners,
    existing?.id,
  );
  if (existing) {
    await connection.execute(
      `UPDATE categories SET parentCategoryId = ?, name = ?, nameEn = ?, slug = ?, sort = ?, isActive = 1, updatedAt = NOW() WHERE id = ?`,
      [parentCategoryId, row.name, row.nameEn, slug, sort, existing.id],
    );
    if (existing.slug !== slug) state.slugOwners.delete(existing.slug);
    existing.slug = slug;
    state.slugOwners.set(slug, String(existing.id));
    return { id: String(existing.id), slug };
  }
  const id = newId();
  await connection.execute(
    `INSERT INTO categories (id, parentCategoryId, legacyId, legacyTable, name, nameEn, slug, icon, image, sort, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, 1, NOW(), NOW())`,
    [
      id,
      parentCategoryId,
      source.legacyId,
      source.legacyTable,
      row.name,
      row.nameEn,
      slug,
      sort,
    ],
  );
  state.bySource.set(key, { id, slug });
  state.slugOwners.set(slug, id);
  return { id, slug };
}

async function upsertSubCategory(
  connection,
  row,
  source,
  categoryId,
  sort,
  state,
  categorySlug,
) {
  const key = `${source.legacyTable}:${source.legacyId}`;
  const existing = state.bySource.get(key);
  // Subcategory slugs are only unique within their category.
  const base = baseSlug([
    [categorySlug, `category-${source.legacyId}`],
    [row.nameEn, `sub-category-${source.legacyId}`],
    [source.legacyId, ''],
  ]);
  const ownerKey = (slug) => `${categoryId}:${slug}`;
  const slug = uniqueSlug(
    base,
    source.legacyId,
    state.slugOwners,
    existing?.id,
    ownerKey,
  );
  if (existing) {
    await connection.execute(
      `UPDATE sub_categories SET categoryId = ?, name = ?, nameEn = ?, slug = ?, sort = ?, isActive = 1, updatedAt = NOW() WHERE id = ?`,
      [categoryId, row.name, row.nameEn, slug, sort, existing.id],
    );
    state.slugOwners.delete(`${existing.categoryId}:${existing.slug}`);
    existing.categoryId = categoryId;
    existing.slug = slug;
    state.slugOwners.set(ownerKey(slug), String(existing.id));
    return;
  }
  const id = newId();
  await connection.execute(
    `INSERT INTO sub_categories (id, categoryId, legacyId, legacyTable, name, nameEn, slug, icon, image, sort, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, 1, NOW(), NOW())`,
    [
      id,
      categoryId,
      source.legacyId,
      source.legacyTable,
      row.name,
      row.nameEn,
      slug,
      sort,
    ],
  );
  state.bySource.set(key, { id, categoryId, slug });
  state.slugOwners.set(ownerKey(slug), id);
}

async function main() {
  const parents = await readSource();
  const database = requiredEnv('DB_DATABASE');
  const target = await openTargetConnection();
  try {
    await assertTables(
      target,
      database,
      ['parent_categories', 'categories', 'sub_categories'],
      'Target',
    );
    const [parentState, categoryState, subCategoryState] = await Promise.all([
      loadRows(target, 'parent_categories'),
      loadRows(target, 'categories'),
      loadRows(target, 'sub_categories'),
    ]);
    await target.beginTransaction();
    try {
      let categoryIndex = 0;
      let subCategoryIndex = 0;
      for (const [parentIndex, parent] of parents.entries()) {
        const parentSource = sourceKey('parent', parentIndex);
        const parentId = await upsertParent(
          target,
          parent,
          parentSource,
          parentIndex,
          parentState,
        );
        const parentRow = parentState.bySource.get(
          `${parentSource.legacyTable}:${parentSource.legacyId}`,
        );
        for (const [categorySort, category] of parent.categories.entries()) {
          const categorySource = sourceKey('category', categoryIndex++);
          const categoryRow = await upsertCategory(
            target,
            category,
            categorySource,
            parentId,
            categorySort,
            categoryState,
            parentRow.slug,
          );
          for (const [
            subCategorySort,
            subCategory,
          ] of category.subCategories.entries()) {
            await upsertSubCategory(
              target,
              subCategory,
              sourceKey('sub_category', subCategoryIndex++),
              categoryRow.id,
              subCategorySort,
              subCategoryState,
              categoryRow.slug,
            );
          }
        }
      }
      await target.commit();
      console.log(
        JSON.stringify(
          {
            complete: true,
            parents: parents.length,
            categories: categoryIndex,
            subCategories: subCategoryIndex,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      await target.rollback();
      throw error;
    }
  } finally {
    await target.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
