/**
 * Import Nest-compatible data from legacy dump DB (didnegar_new) into Nest DB.
 *
 * Usage:
 *   npm run db:import:legacy -- locations
 *   npm run db:import:legacy -- attributes
 *   npm run db:import:legacy -- brands
 *   npm run db:import:legacy -- categories
 *   npm run db:import:legacy -- products
 *   npm run db:import:legacy -- product-categories
 *   npm run db:import:legacy -- users
 *   npm run db:import:legacy -- addresses
 *   npm run db:import:legacy -- orders
 *   npm run db:import:legacy -- payments
 *   npm run db:import:legacy -- media
 *   npm run db:import:legacy -- all
 *
 * Skipped (no Nest table / incompatible): reviews, attribute_values rows,
 * product_variant_* rows, order_item_options, companies, customers (map only).
 * Note: product.attributeIds IS filled from variant→attribute_values links.
 * Media rows map into media_assets (metadata + public URL path; files stay on CDN/SFTP).
 */
import type { RowDataPacket } from 'mysql2/promise';
import {
  ensureIdMap,
  getMap,
  loadMap,
  logStep,
  newId,
  normalizeSlug,
  openConn,
  putMap,
  sourceDb,
  splitFaEn,
  stripHtml,
  targetDb,
  toMediaUrl,
  type StepContext,
} from './legacy-import/shared.js';

const STEPS = [
  'locations',
  'attributes',
  'brands',
  'categories',
  'products',
  'product-categories',
  'users',
  'addresses',
  'orders',
  'payments',
  'media',
] as const;

type StepName = (typeof STEPS)[number] | 'all';

async function importLocations(ctx: StepContext) {
  const { conn, source, target } = ctx;
  let countries = 0;
  let states = 0;
  let cities = 0;

  const [legacyCountries] = await conn.query<RowDataPacket[]>(
    `SELECT id, code, name FROM \`${source}\`.countries`,
  );
  for (const row of legacyCountries) {
    const code = String(row.code || '').slice(0, 100) || `c-${row.id}`.slice(0, 100);
    const [existing] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM \`${target}\`.countries WHERE code = ? LIMIT 1`,
      [code],
    );
    const nestId = existing[0]?.id ?? newId();
    if (!existing[0]) {
      await conn.execute(
        `INSERT INTO \`${target}\`.countries (id, code, name) VALUES (?, ?, ?)`,
        [nestId, code, String(row.name).slice(0, 255)],
      );
      countries += 1;
    } else {
      await conn.execute(
        `UPDATE \`${target}\`.countries SET name = ? WHERE id = ?`,
        [String(row.name).slice(0, 255), nestId],
      );
    }
    await putMap(conn, target, 'countries', String(row.id), nestId);
  }

  const countryMap = await loadMap(conn, target, 'countries');
  const [legacyStates] = await conn.query<RowDataPacket[]>(
    `SELECT id, countryId, code, name FROM \`${source}\`.states`,
  );
  for (const row of legacyStates) {
    const nestCountryId = countryMap.get(String(row.countryId));
    if (!nestCountryId) continue;
    const code = String(row.code || row.id).slice(0, 255);
    const [existing] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM \`${target}\`.states WHERE countryId = ? AND code = ? LIMIT 1`,
      [nestCountryId, code],
    );
    const nestId = existing[0]?.id ?? newId();
    if (!existing[0]) {
      await conn.execute(
        `INSERT INTO \`${target}\`.states (id, countryId, code, name) VALUES (?, ?, ?, ?)`,
        [nestId, nestCountryId, code, String(row.name).slice(0, 255)],
      );
      states += 1;
    } else {
      await conn.execute(
        `UPDATE \`${target}\`.states SET name = ? WHERE id = ?`,
        [String(row.name).slice(0, 255), nestId],
      );
    }
    await putMap(conn, target, 'states', String(row.id), nestId);
  }

  const stateMap = await loadMap(conn, target, 'states');
  const [legacyCities] = await conn.query<RowDataPacket[]>(
    `SELECT id, countryId, stateId, name FROM \`${source}\`.cities`,
  );
  for (const row of legacyCities) {
    const nestCountryId = countryMap.get(String(row.countryId)) ?? null;
    const nestStateId = stateMap.get(String(row.stateId)) ?? null;
    const name = String(row.name).slice(0, 255);
    let nestId = await getMap(conn, target, 'cities', String(row.id));
    if (!nestId) {
      const [existing] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM \`${target}\`.cities
         WHERE name = ? AND ((? IS NULL AND countryId IS NULL) OR countryId = ?)
           AND ((? IS NULL AND stateId IS NULL) OR stateId = ?)
         LIMIT 1`,
        [name, nestCountryId, nestCountryId, nestStateId, nestStateId],
      );
      nestId = (existing[0]?.id as string | undefined) ?? newId();
      if (!existing[0]) {
        await conn.execute(
          `INSERT INTO \`${target}\`.cities (id, countryId, stateId, name)
           VALUES (?, ?, ?, ?)`,
          [nestId, nestCountryId, nestStateId, name],
        );
        cities += 1;
      }
    } else {
      await conn.execute(
        `UPDATE \`${target}\`.cities SET countryId = ?, stateId = ?, name = ? WHERE id = ?`,
        [nestCountryId, nestStateId, name, nestId],
      );
    }
    await putMap(conn, target, 'cities', String(row.id), nestId as string);
  }

  logStep('locations', { countries, states, cities });
}

async function importAttributes(ctx: StepContext) {
  const { conn, source, target } = ctx;
  let inserted = 0;
  let updated = 0;
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id, legacyId, legacyTable, name, label, isPublic FROM \`${source}\`.attributes`,
  );
  for (const row of rows) {
    const legacyId = Number(row.legacyId);
    const legacyTable = String(row.legacyTable || 'attributes');
    const name = String(row.name).slice(0, 200);
    const label = String(row.label || row.name).slice(0, 200);
    const isPublic = row.isPublic ? 1 : 0;

    const [byLegacy] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM \`${target}\`.attributes
       WHERE legacyTable = ? AND legacyId = ? LIMIT 1`,
      [legacyTable, legacyId],
    );
    const [byName] = byLegacy[0]
      ? [[] as RowDataPacket[]]
      : await conn.query<RowDataPacket[]>(
          `SELECT id FROM \`${target}\`.attributes WHERE name = ? LIMIT 1`,
          [name],
        );

    const nestId = byLegacy[0]?.id ?? byName[0]?.id ?? newId();
    if (byLegacy[0] || byName[0]) {
      await conn.execute(
        `UPDATE \`${target}\`.attributes
         SET name = ?, label = ?, isPublic = ?, legacyId = ?, legacyTable = ?
         WHERE id = ?`,
        [name, label, isPublic, legacyId, legacyTable, nestId],
      );
      updated += 1;
    } else {
      await conn.execute(
        `INSERT INTO \`${target}\`.attributes
         (id, legacyId, legacyTable, name, label, isPublic)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nestId, legacyId, legacyTable, name, label, isPublic],
      );
      inserted += 1;
    }
    await putMap(conn, target, 'attributes', String(row.id), nestId);
  }
  logStep('attributes', { inserted, updated, total: rows.length });
}

async function importBrands(ctx: StepContext) {
  const { conn, source, target } = ctx;
  let inserted = 0;
  let updated = 0;
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id, legacyId, legacyTable, name, slug, description, isActive, logo
     FROM \`${source}\`.brands ORDER BY legacyId`,
  );

  for (const row of rows) {
    const legacyId = Number(row.legacyId);
    const legacyTable = String(row.legacyTable || 'brands');
    const { name, nameEn } = splitFaEn(String(row.name || ''));
    let slug = normalizeSlug(String(row.slug || ''), `brand-${legacyId}`);
    const logoUrl = row.logo ? String(row.logo).slice(0, 2048) : null;
    const seoDescription = stripHtml(row.description as string | null);
    const isActive = row.isActive ? 1 : 0;
    if (!name) continue;

    const [byLegacy] = await conn.query<RowDataPacket[]>(
      `SELECT id, slug FROM \`${target}\`.brands
       WHERE legacyTable = ? AND legacyId = ? LIMIT 1`,
      [legacyTable, legacyId],
    );
    let nestId = byLegacy[0]?.id as string | undefined;
    if (!nestId) {
      const [bySlug] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM \`${target}\`.brands WHERE slug = ? LIMIT 1`,
        [slug],
      );
      if (bySlug[0]) nestId = String(bySlug[0].id);
      else {
        const [clash] = await conn.query<RowDataPacket[]>(
          `SELECT id FROM \`${target}\`.brands WHERE slug = ? LIMIT 1`,
          [slug],
        );
        if (clash[0]) slug = normalizeSlug(`${slug}-${legacyId}`, `brand-${legacyId}`);
        nestId = newId();
        await conn.execute(
          `INSERT INTO \`${target}\`.brands
           (id, legacyId, legacyTable, name, nameEn, slug, logoUrl, seoDescription, isActive)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nestId,
            legacyId,
            legacyTable,
            name.slice(0, 200),
            nameEn?.slice(0, 200) ?? null,
            slug,
            logoUrl,
            seoDescription,
            isActive,
          ],
        );
        inserted += 1;
        await putMap(conn, target, 'brands', String(row.id), nestId);
        continue;
      }
    }

    await conn.execute(
      `UPDATE \`${target}\`.brands
       SET name = ?, nameEn = ?, slug = ?, logoUrl = ?, seoDescription = ?,
           isActive = ?, legacyId = ?, legacyTable = ?
       WHERE id = ?`,
      [
        name.slice(0, 200),
        nameEn?.slice(0, 200) ?? null,
        slug,
        logoUrl,
        seoDescription,
        isActive,
        legacyId,
        legacyTable,
        nestId!,
      ],
    );
    updated += 1;
    await putMap(conn, target, 'brands', String(row.id), nestId!);
  }
  logStep('brands', { inserted, updated, source: rows.length });
}

async function importCategories(ctx: StepContext) {
  const { conn, source, target } = ctx;

  // Single parent bucket for legacy 2-level tree
  const parentSlug = 'legacy-import';
  let [parents] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM \`${target}\`.parent_categories WHERE slug = ? LIMIT 1`,
    [parentSlug],
  );
  let parentId = parents[0]?.id as string | undefined;
  if (!parentId) {
    parentId = newId();
    await conn.execute(
      `INSERT INTO \`${target}\`.parent_categories
       (id, legacyId, legacyTable, name, nameEn, slug, icon, image, sort, isActive)
       VALUES (?, NULL, 'import', ?, 'Legacy Import', ?, NULL, NULL, 0, 1)`,
      [parentId, 'دسته‌های مهاجرت‌شده', parentSlug],
    );
  }
  await putMap(conn, target, 'parent_categories', 'legacy-import-root', parentId);

  let catIns = 0;
  let catUpd = 0;
  let catWithImage = 0;
  const [legacyCats] = await conn.query<RowDataPacket[]>(
    `SELECT id, legacyId, legacyTable, name, slug, image
     FROM \`${source}\`.categories ORDER BY legacyId`,
  );
  for (const row of legacyCats) {
    const legacyId = row.legacyId != null ? Number(row.legacyId) : null;
    const legacyTable = row.legacyTable ? String(row.legacyTable) : 'categories';
    const { name, nameEn } = splitFaEn(String(row.name || ''));
    let slug = normalizeSlug(String(row.slug || ''), `cat-${legacyId ?? row.id}`);
    const image = toMediaUrl(row.image != null ? String(row.image) : null);
    const icon = null;
    if (image) catWithImage += 1;
    if (!name) continue;

    let nestId: string | undefined;
    if (legacyId != null) {
      const [byLegacy] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM \`${target}\`.categories
         WHERE legacyId = ? AND legacyTable = ? LIMIT 1`,
        [legacyId, legacyTable],
      );
      nestId = byLegacy[0]?.id;
    }
    if (!nestId) {
      const [bySlug] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM \`${target}\`.categories WHERE slug = ? LIMIT 1`,
        [slug],
      );
      nestId = bySlug[0]?.id;
    }
    if (!nestId) {
      const [clash] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM \`${target}\`.categories WHERE slug = ? LIMIT 1`,
        [slug],
      );
      if (clash[0]) slug = normalizeSlug(`${slug}-${legacyId ?? 'x'}`, slug);
      nestId = newId();
      await conn.execute(
        `INSERT INTO \`${target}\`.categories
         (id, parentCategoryId, legacyId, legacyTable, name, nameEn, slug, icon, image, sort, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
        [nestId, parentId, legacyId, legacyTable, name, nameEn, slug, icon, image],
      );
      catIns += 1;
    } else {
      await conn.execute(
        `UPDATE \`${target}\`.categories
         SET parentCategoryId = ?, name = ?, nameEn = ?, slug = ?,
             icon = ?, image = ?,
             legacyId = ?, legacyTable = ?, isActive = 1
         WHERE id = ?`,
        [parentId, name, nameEn, slug, icon, image, legacyId, legacyTable, nestId],
      );
      catUpd += 1;
    }
    await putMap(conn, target, 'categories', String(row.id), nestId);
  }

  const categoryMap = await loadMap(conn, target, 'categories');
  let subIns = 0;
  let subUpd = 0;
  let subWithImage = 0;
  const [legacySubs] = await conn.query<RowDataPacket[]>(
    `SELECT id, legacyId, legacyTable, categoryId, name, slug, position, image
     FROM \`${source}\`.sub_categories ORDER BY legacyId`,
  );
  for (const row of legacySubs) {
    const nestCategoryId = categoryMap.get(String(row.categoryId));
    if (!nestCategoryId) continue;
    const legacyId = row.legacyId != null ? Number(row.legacyId) : null;
    const legacyTable = row.legacyTable ? String(row.legacyTable) : 'sub_categories';
    const { name, nameEn } = splitFaEn(String(row.name || ''));
    let slug = normalizeSlug(String(row.slug || ''), `sub-${legacyId ?? row.id}`);
    const sort = Number(row.position ?? 0) || 0;
    const image = toMediaUrl(row.image != null ? String(row.image) : null);
    const icon = null;
    if (image) subWithImage += 1;
    if (!name) continue;

    let nestId: string | undefined;
    const [bySlug] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM \`${target}\`.sub_categories
       WHERE categoryId = ? AND slug = ? LIMIT 1`,
      [nestCategoryId, slug],
    );
    nestId = bySlug[0]?.id;
    if (!nestId && legacyId != null) {
      const [byLegacy] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM \`${target}\`.sub_categories
         WHERE legacyId = ? AND legacyTable = ? LIMIT 1`,
        [legacyId, legacyTable],
      );
      nestId = byLegacy[0]?.id;
    }
    if (!nestId) {
      nestId = newId();
      await conn.execute(
        `INSERT INTO \`${target}\`.sub_categories
         (id, categoryId, legacyId, legacyTable, name, nameEn, slug, icon, image, sort, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          nestId,
          nestCategoryId,
          legacyId,
          legacyTable,
          name,
          nameEn,
          slug,
          icon,
          image,
          sort,
        ],
      );
      subIns += 1;
    } else {
      await conn.execute(
        `UPDATE \`${target}\`.sub_categories
         SET categoryId = ?, name = ?, nameEn = ?, slug = ?, sort = ?,
             icon = ?, image = ?,
             legacyId = ?, legacyTable = ?, isActive = 1
         WHERE id = ?`,
        [
          nestCategoryId,
          name,
          nameEn,
          slug,
          sort,
          icon,
          image,
          legacyId,
          legacyTable,
          nestId,
        ],
      );
      subUpd += 1;
    }
    await putMap(conn, target, 'sub_categories', String(row.id), nestId);
  }

  logStep('categories', {
    parentId,
    categoriesInserted: catIns,
    categoriesUpdated: catUpd,
    categoriesWithImage: catWithImage,
    subInserted: subIns,
    subUpdated: subUpd,
    subWithImage,
  });
}

/** Distinct Nest attribute UUIDs per legacy product ULID (via variants → values). */
async function loadProductAttributeIds(ctx: StepContext) {
  const { conn, source, target } = ctx;
  const attrMap = await loadMap(conn, target, 'attributes');
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT DISTINCT pv.productId AS productId, av.attributeId AS attributeId
     FROM \`${source}\`.product_variants pv
     INNER JOIN \`${source}\`.product_variant_attributes pva
       ON pva.variantId = pv.id
     INNER JOIN \`${source}\`.attribute_values av
       ON av.id = pva.attributeValueId`,
  );

  const byProduct = new Map<string, Set<string>>();
  let unmapped = 0;
  for (const row of rows) {
    const nestAttrId = attrMap.get(String(row.attributeId));
    if (!nestAttrId) {
      unmapped += 1;
      continue;
    }
    const productId = String(row.productId);
    let set = byProduct.get(productId);
    if (!set) {
      set = new Set();
      byProduct.set(productId, set);
    }
    set.add(nestAttrId);
  }

  const out = new Map<string, string[]>();
  for (const [productId, ids] of byProduct) {
    out.set(productId, [...ids]);
  }
  return { byProduct: out, linkRows: rows.length, unmapped };
}

async function importProducts(ctx: StepContext) {
  const { conn, source, target } = ctx;
  const brandMap = await loadMap(conn, target, 'brands');
  const { byProduct: productAttrIds, linkRows, unmapped } =
    await loadProductAttributeIds(ctx);
  const [sellerRows] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM \`${target}\`.sellers WHERE slug = 'didnegar-shop' LIMIT 1`,
  );
  const sellerId = (sellerRows[0]?.id as string | undefined) ?? null;

  let inserted = 0;
  let updated = 0;
  let stocks = 0;
  let withAttrs = 0;

  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT * FROM \`${source}\`.products ORDER BY legacyId`,
  );

  for (const row of rows) {
    const legacyId = Number(row.legacyId);
    const legacyTable = String(row.legacyTable || 'products');
    const name = String(row.name || '').slice(0, 255);
    let slug = normalizeSlug(String(row.slug || ''), `product-${legacyId}`);
    let sku = String(row.sku || `SKU-${legacyId}`).slice(0, 100);
    if (!name) continue;

    const nestBrandId = row.brandId
      ? brandMap.get(String(row.brandId)) ?? null
      : null;
    const description =
      row.description != null ? String(row.description).slice(0, 60000) : null;
    const shortDescription =
      row.shortDescription != null
        ? String(row.shortDescription).slice(0, 60000)
        : null;
    const priceNum =
      row.minPrice != null
        ? Number(row.minPrice)
        : row.maxPrice != null
          ? Number(row.maxPrice)
          : null;
    const nestAttributeIds = productAttrIds.get(String(row.id)) ?? [];
    if (nestAttributeIds.length > 0) withAttrs += 1;
    const image = JSON.stringify({
      featuredImg: row.featuredImage ? String(row.featuredImage) : null,
      gallery: [],
    });
    const price = JSON.stringify([
      {
        attributeIds: [],
        price: priceNum,
        discountPercentage: null,
        discountAmount: null,
        expireDate: null,
        maxQuantity: null,
        minQuantity: 1,
        finalPrice: priceNum,
      },
    ]);
    const attributeIdsJson = JSON.stringify(nestAttributeIds);
    const sellerIds = JSON.stringify(sellerId ? [sellerId] : []);
    const stock = Math.max(0, Math.floor(Number(row.stockQuantity ?? 0) || 0));
    const status = String(row.status || 'publish').slice(0, 50);

    const [byLegacy] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM \`${target}\`.products
       WHERE legacyTable = ? AND legacyId = ? LIMIT 1`,
      [legacyTable, legacyId],
    );
    let nestId = byLegacy[0]?.id as string | undefined;

    if (!nestId) {
      const [bySlug] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM \`${target}\`.products WHERE slug = ? LIMIT 1`,
        [slug],
      );
      const [bySku] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM \`${target}\`.products WHERE sku = ? LIMIT 1`,
        [sku],
      );
      nestId = bySlug[0]?.id ?? bySku[0]?.id;
    }

    if (!nestId) {
      const [slugClash] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM \`${target}\`.products WHERE slug = ? LIMIT 1`,
        [slug],
      );
      const [skuClash] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM \`${target}\`.products WHERE sku = ? LIMIT 1`,
        [sku],
      );
      if (slugClash[0]) slug = `${slug}-${legacyId}`.slice(0, 200);
      if (skuClash[0]) sku = `L-${legacyId}`.slice(0, 100);

      nestId = newId();
      await conn.execute(
        `INSERT INTO \`${target}\`.products
         (id, legacyId, legacyTable, name, slug, description, shortDescription, sku,
          status, approvalStatus, brandId, isVirtual, isDownloadable, isActive, isFeatured,
          seo, image, price, tableInfo, ratingCount, averageRating, totalSales,
          taxStatus, taxClass, globalUniqueId, weight, length, width, height,
          attributeIds, sellerIds, createdBySellerId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, 1, 0,
                 CAST('[]' AS JSON), CAST(? AS JSON), CAST(? AS JSON), CAST('[]' AS JSON),
                 ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                 CAST(? AS JSON), CAST(? AS JSON), ?)`,
        [
          nestId,
          legacyId,
          legacyTable,
          name,
          slug,
          description,
          shortDescription,
          sku,
          status,
          nestBrandId,
          row.isVirtual ? 1 : 0,
          row.isDownloadable ? 1 : 0,
          image,
          price,
          Number(row.ratingCount ?? 0) || 0,
          Number(row.averageRating ?? 0) || 0,
          Number(row.totalSales ?? 0) || 0,
          row.taxStatus ?? null,
          row.taxClass ?? null,
          row.globalUniqueId ?? null,
          row.weight ?? null,
          row.length ?? null,
          row.width ?? null,
          row.height ?? null,
          attributeIdsJson,
          sellerIds,
          sellerId,
        ],
      );
      inserted += 1;
    } else {
      await conn.execute(
        `UPDATE \`${target}\`.products SET
           legacyId = ?, legacyTable = ?, name = ?, slug = ?, description = ?,
           shortDescription = ?, sku = ?, status = ?, approvalStatus = 'approved',
           brandId = ?, isVirtual = ?, isDownloadable = ?,
           image = CAST(? AS JSON), price = CAST(? AS JSON),
           ratingCount = ?, averageRating = ?, totalSales = ?,
           taxStatus = ?, taxClass = ?, globalUniqueId = ?,
           weight = ?, length = ?, width = ?, height = ?,
           attributeIds = CAST(? AS JSON),
           sellerIds = CAST(? AS JSON),
           createdBySellerId = COALESCE(createdBySellerId, ?)
         WHERE id = ?`,
        [
          legacyId,
          legacyTable,
          name,
          slug,
          description,
          shortDescription,
          sku,
          status,
          nestBrandId,
          row.isVirtual ? 1 : 0,
          row.isDownloadable ? 1 : 0,
          image,
          price,
          Number(row.ratingCount ?? 0) || 0,
          Number(row.averageRating ?? 0) || 0,
          Number(row.totalSales ?? 0) || 0,
          row.taxStatus ?? null,
          row.taxClass ?? null,
          row.globalUniqueId ?? null,
          row.weight ?? null,
          row.length ?? null,
          row.width ?? null,
          row.height ?? null,
          attributeIdsJson,
          sellerIds,
          sellerId,
          nestId,
        ],
      );
      updated += 1;
    }

    await putMap(conn, target, 'products', String(row.id), nestId);

    const [stockRow] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM \`${target}\`.product_stocks WHERE productId = ? LIMIT 1`,
      [nestId],
    );
    if (stockRow[0]) {
      await conn.execute(
        `UPDATE \`${target}\`.product_stocks SET stock = ? WHERE id = ?`,
        [stock, stockRow[0].id],
      );
    } else {
      await conn.execute(
        `INSERT INTO \`${target}\`.product_stocks (id, productId, stock) VALUES (?, ?, ?)`,
        [newId(), nestId, stock],
      );
      stocks += 1;
    }
  }

  logStep('products', {
    inserted,
    updated,
    stocks,
    withAttrs,
    attrLinkRows: linkRows,
    attrUnmapped: unmapped,
    source: rows.length,
  });
}

async function importProductCategories(ctx: StepContext) {
  const { conn, source, target } = ctx;
  const productMap = await loadMap(conn, target, 'products');
  const categoryMap = await loadMap(conn, target, 'categories');
  const subMap = await loadMap(conn, target, 'sub_categories');

  let inserted = 0;
  let skipped = 0;
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id, productId, categoryId, subCategoryId, isPrimary, position
     FROM \`${source}\`.product_categories`,
  );

  for (const row of rows) {
    const productId = productMap.get(String(row.productId));
    if (!productId) {
      skipped += 1;
      continue;
    }
    const categoryId = row.categoryId
      ? categoryMap.get(String(row.categoryId)) ?? null
      : null;
    const subCategoryId = row.subCategoryId
      ? subMap.get(String(row.subCategoryId)) ?? null
      : null;
    if (!categoryId && !subCategoryId) {
      skipped += 1;
      continue;
    }

    const [existing] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM \`${target}\`.product_categories
       WHERE productId = ?
         AND ((? IS NULL AND categoryId IS NULL) OR categoryId = ?)
         AND ((? IS NULL AND subCategoryId IS NULL) OR subCategoryId = ?)
       LIMIT 1`,
      [productId, categoryId, categoryId, subCategoryId, subCategoryId],
    );
    if (existing[0]) {
      await putMap(conn, target, 'product_categories', String(row.id), existing[0].id);
      continue;
    }

    const nestId = newId();
    await conn.execute(
      `INSERT INTO \`${target}\`.product_categories
       (id, productId, categoryId, subCategoryId, isPrimary, position)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nestId,
        productId,
        categoryId,
        subCategoryId,
        row.isPrimary ? 1 : 0,
        Number(row.position ?? 0) || 0,
      ],
    );
    await putMap(conn, target, 'product_categories', String(row.id), nestId);
    inserted += 1;
  }

  logStep('product-categories', { inserted, skipped, source: rows.length });
}

function mapRoleSlug(roles: string[]): string {
  const set = new Set(roles.map((r) => r.toLowerCase()));
  if (set.has('administrator') || set.has('shop_manager')) return 'admin';
  if (set.has('seller') || set.has('vendor') || set.has('dokan_seller')) {
    return 'seller';
  }
  return 'user';
}

async function importUsers(ctx: StepContext) {
  const { conn, source, target } = ctx;
  const [roleRows] = await conn.query<RowDataPacket[]>(
    `SELECT id, slug FROM \`${target}\`.roles`,
  );
  const roleBySlug = new Map(roleRows.map((r) => [String(r.slug), String(r.id)]));
  const defaultRoleId = roleBySlug.get('user');
  if (!defaultRoleId) throw new Error('Nest role "user" missing — run seed first');

  const [sellerRows] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM \`${target}\`.sellers WHERE slug = 'didnegar-shop' LIMIT 1`,
  );
  const sellerId = (sellerRows[0]?.id as string | undefined) ?? null;

  const [roleLinks] = await conn.query<RowDataPacket[]>(
    `SELECT userId, role FROM \`${source}\`.user_roles`,
  );
  const rolesByUser = new Map<string, string[]>();
  for (const link of roleLinks) {
    const uid = String(link.userId);
    const list = rolesByUser.get(uid) ?? [];
    list.push(String(link.role));
    rolesByUser.set(uid, list);
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id, legacyId, legacyTable, username, password, email, displayName,
            firstName, lastName, website, isActive
     FROM \`${source}\`.users ORDER BY legacyId`,
  );

  const usedUsernames = new Set<string>();
  const [existingUsers] = await conn.query<RowDataPacket[]>(
    `SELECT username FROM \`${target}\`.users`,
  );
  for (const u of existingUsers) usedUsernames.add(String(u.username));

  for (const row of rows) {
    const rawUsername = String(row.username || '').trim();
    if (!rawUsername) {
      skipped += 1;
      continue;
    }

    let username = rawUsername.slice(0, 20);
    const legacyId = row.legacyId != null ? Number(row.legacyId) : null;
    const legacyTable = row.legacyTable ? String(row.legacyTable) : 'users';

    // Prefer matching existing Nest seed users by exact username
    const [byUsernameExact] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM \`${target}\`.users WHERE username = ? LIMIT 1`,
      [rawUsername.length <= 20 ? rawUsername : username],
    );
    let nestId = byUsernameExact[0]?.id as string | undefined;

    if (!nestId && legacyId != null) {
      const [byLegacy] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM \`${target}\`.users
         WHERE legacyId = ? AND legacyTable = ? LIMIT 1`,
        [legacyId, legacyTable],
      );
      nestId = byLegacy[0]?.id;
    }

    if (!nestId) {
      let candidate = username;
      let n = 0;
      while (usedUsernames.has(candidate)) {
        n += 1;
        const suffix = String(legacyId ?? n);
        candidate = `${username.slice(0, Math.max(1, 20 - suffix.length - 1))}-${suffix}`.slice(
          0,
          20,
        );
      }
      username = candidate;
      usedUsernames.add(username);

      const roleSlug = mapRoleSlug(rolesByUser.get(String(row.id)) ?? []);
      const roleId = roleBySlug.get(roleSlug) ?? defaultRoleId;
      const attachSeller = roleSlug === 'seller' ? sellerId : null;

      nestId = newId();
      await conn.execute(
        `INSERT INTO \`${target}\`.users
         (id, legacyId, legacyTable, username, password, email, displayName,
          firstName, lastName, website, isActive, roleId, extraRoleIds, sellerId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST('[]' AS JSON), ?)`,
        [
          nestId,
          legacyId,
          legacyTable,
          username,
          row.password ?? null,
          row.email ? String(row.email).slice(0, 150) : null,
          row.displayName ? String(row.displayName).slice(0, 150) : null,
          row.firstName ? String(row.firstName).slice(0, 100) : null,
          row.lastName ? String(row.lastName).slice(0, 100) : null,
          row.website ? String(row.website).slice(0, 255) : null,
          row.isActive ? 1 : 0,
          roleId,
          attachSeller,
        ],
      );
      inserted += 1;
    } else {
      // Do not overwrite seed super-admin password/role; only attach legacy map + soft fields
      await conn.execute(
        `UPDATE \`${target}\`.users SET
           legacyId = COALESCE(legacyId, ?),
           legacyTable = COALESCE(legacyTable, ?),
           email = COALESCE(email, ?),
           displayName = COALESCE(displayName, ?),
           firstName = COALESCE(firstName, ?),
           lastName = COALESCE(lastName, ?)
         WHERE id = ?`,
        [
          legacyId,
          legacyTable,
          row.email ? String(row.email).slice(0, 150) : null,
          row.displayName ? String(row.displayName).slice(0, 150) : null,
          row.firstName ? String(row.firstName).slice(0, 100) : null,
          row.lastName ? String(row.lastName).slice(0, 100) : null,
          nestId,
        ],
      );
      updated += 1;
    }

    await putMap(conn, target, 'users', String(row.id), nestId);
  }

  logStep('users', { inserted, updated, skipped, source: rows.length });
}

async function importAddresses(ctx: StepContext) {
  const { conn, source, target } = ctx;
  const userMap = await loadMap(conn, target, 'users');
  const cityMap = await loadMap(conn, target, 'cities');
  const stateMap = await loadMap(conn, target, 'states');

  // preload city/state names
  const [cities] = await conn.query<RowDataPacket[]>(
    `SELECT id, name FROM \`${target}\`.cities`,
  );
  const cityName = new Map(cities.map((c) => [String(c.id), String(c.name)]));
  const [states] = await conn.query<RowDataPacket[]>(
    `SELECT id, name FROM \`${target}\`.states`,
  );
  const stateName = new Map(states.map((s) => [String(s.id), String(s.name)]));

  let inserted = 0;
  let skipped = 0;
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id, userId, type, address1, address2, cityId, stateId, postalCode, isDefault
     FROM \`${source}\`.addresses`,
  );

  for (const row of rows) {
    const userId = userMap.get(String(row.userId));
    if (!userId) {
      skipped += 1;
      continue;
    }
    const nestCityId = row.cityId ? cityMap.get(String(row.cityId)) : null;
    const nestStateId = row.stateId ? stateMap.get(String(row.stateId)) : null;
    const city = (nestCityId && cityName.get(nestCityId)) || 'نامشخص';
    const province = (nestStateId && stateName.get(nestStateId)) || 'نامشخص';
    const detail = [row.address1, row.address2].filter(Boolean).join(' — ').trim();
    if (!detail) {
      skipped += 1;
      continue;
    }
    const postal = String(row.postalCode || '0000000000').replace(/\D/g, '').slice(0, 10) ||
      '0000000000';
    const title = row.type === 'billing' ? 'صورتحساب' : 'ارسال';

    const existing = await getMap(conn, target, 'user_addresses', String(row.id));
    if (existing) continue;

    const nestId = newId();
    await conn.execute(
      `INSERT INTO \`${target}\`.user_addresses
       (id, userId, title, province, city, addressDetail, postalCode,
        recipientFullName, recipientPhone, isDefault)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nestId,
        userId,
        title,
        province.slice(0, 100),
        city.slice(0, 100),
        detail,
        postal.slice(0, 10),
        'مشتری',
        '09000000000',
        row.isDefault ? 1 : 0,
      ],
    );
    await putMap(conn, target, 'user_addresses', String(row.id), nestId);
    inserted += 1;
  }

  logStep('addresses', { inserted, skipped, source: rows.length });
}

function mapOrderStatus(status: string): 'pending' | 'paid' | 'failed' | 'cancelled' {
  const s = status.toLowerCase();
  if (s.includes('completed') || s.includes('processing') || s.includes('paid')) {
    return 'paid';
  }
  if (s.includes('cancel') || s.includes('refund') || s.includes('trash')) {
    return 'cancelled';
  }
  if (s.includes('fail')) return 'failed';
  return 'pending';
}

async function importOrders(ctx: StepContext) {
  const { conn, source, target } = ctx;
  const userMap = await loadMap(conn, target, 'users');
  const productMap = await loadMap(conn, target, 'products');

  const [customers] = await conn.query<RowDataPacket[]>(
    `SELECT id, userId FROM \`${source}\`.customers WHERE userId IS NOT NULL`,
  );
  const customerToUser = new Map(
    customers.map((c) => [String(c.id), String(c.userId)]),
  );

  let inserted = 0;
  let skipped = 0;
  let itemsInserted = 0;

  const [orders] = await conn.query<RowDataPacket[]>(
    `SELECT id, customerId, status, total, shippingTotal, netTotal, createdAt, updatedAt
     FROM \`${source}\`.orders`,
  );

  const orderNestIds = new Map<string, string>();

  for (const row of orders) {
    const legacyUserId = row.customerId
      ? customerToUser.get(String(row.customerId))
      : null;
    const userId = legacyUserId ? userMap.get(legacyUserId) : null;
    if (!userId) {
      skipped += 1;
      continue;
    }

    let nestOrderId = await getMap(conn, target, 'orders', String(row.id));
    if (!nestOrderId) {
      nestOrderId = newId();
      const amount = Number(row.netTotal ?? row.total ?? 0) || 0;
      const shipping = Number(row.shippingTotal ?? 0) || 0;
      const subtotal = Math.max(0, amount - shipping);
      await conn.execute(
        `INSERT INTO \`${target}\`.orders
         (id, userId, shippingMethodId, subtotal, shippingAmount, amount, status, createdAt, updatedAt)
         VALUES (?, ?, NULL, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP(6)), COALESCE(?, CURRENT_TIMESTAMP(6)))`,
        [
          nestOrderId,
          userId,
          subtotal,
          shipping,
          amount,
          mapOrderStatus(String(row.status || '')),
          row.createdAt ?? null,
          row.updatedAt ?? null,
        ],
      );
      await putMap(conn, target, 'orders', String(row.id), nestOrderId);
      inserted += 1;
    }
    orderNestIds.set(String(row.id), nestOrderId);
  }

  const existingItemMap = await loadMap(conn, target, 'order_items');
  const [items] = await conn.query<RowDataPacket[]>(
    `SELECT id, orderId, productId, quantity, total, subtotal, sku
     FROM \`${source}\`.order_items`,
  );

  for (const item of items) {
    const nestOrderId = orderNestIds.get(String(item.orderId));
    if (!nestOrderId) continue;
    const productId = item.productId
      ? productMap.get(String(item.productId))
      : null;
    if (!productId) continue;
    if (existingItemMap.has(String(item.id))) continue;

    const qty = Math.max(1, Math.floor(Number(item.quantity ?? 1) || 1));
    const lineTotal = Number(item.total ?? item.subtotal ?? 0) || 0;
    const unitPrice = qty > 0 ? lineTotal / qty : lineTotal;
    const nestItemId = newId();
    try {
      await conn.execute(
        `INSERT INTO \`${target}\`.order_items
         (id, orderId, productId, offerId, attributes, sellerId, sku, quantity, unitPrice)
         VALUES (?, ?, ?, NULL, CAST('{}' AS JSON), NULL, ?, ?, ?)`,
        [
          nestItemId,
          nestOrderId,
          productId,
          item.sku ? String(item.sku).slice(0, 100) : null,
          qty,
          unitPrice,
        ],
      );
      await putMap(conn, target, 'order_items', String(item.id), nestItemId);
      existingItemMap.set(String(item.id), nestItemId);
      itemsInserted += 1;
    } catch {
      // skip FK / duplicate edge cases
    }
  }

  logStep('orders', { inserted, skipped, itemsInserted, source: orders.length });
}

async function importPayments(ctx: StepContext) {
  const { conn, source, target } = ctx;
  const orderMap = await loadMap(conn, target, 'orders');
  let inserted = 0;
  let skipped = 0;

  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT id, orderId, referenceNumber, traceNumber, amount, status, createdAt
     FROM \`${source}\`.payment_history`,
  );

  for (const row of rows) {
    const orderId = row.orderId ? orderMap.get(String(row.orderId)) : null;
    if (!orderId) {
      skipped += 1;
      continue;
    }
    const [existing] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM \`${target}\`.payments WHERE orderId = ? LIMIT 1`,
      [orderId],
    );
    if (existing[0]) {
      await putMap(conn, target, 'payments', String(row.id), existing[0].id);
      continue;
    }

    const authority = String(
      row.referenceNumber || row.traceNumber || `legacy-${row.id}`,
    ).slice(0, 100);
    const [authClash] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM \`${target}\`.payments WHERE authority = ? LIMIT 1`,
      [authority],
    );
    if (authClash[0]) {
      skipped += 1;
      continue;
    }

    const statusRaw = String(row.status || '').toLowerCase();
    const status =
      statusRaw.includes('success') ||
      statusRaw.includes('ok') ||
      statusRaw.includes('paid') ||
      statusRaw === '1'
        ? 'success'
        : statusRaw.includes('fail')
          ? 'failed'
          : 'pending';

    const nestId = newId();
    await conn.execute(
      `INSERT INTO \`${target}\`.payments
       (id, orderId, gateway, authority, refId, amount, status, createdAt, updatedAt)
       VALUES (?, ?, 'zarinpal', ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP(6)), COALESCE(?, CURRENT_TIMESTAMP(6)))`,
      [
        nestId,
        orderId,
        authority,
        row.traceNumber ? String(row.traceNumber).slice(0, 100) : null,
        Number(row.amount ?? 0) || 0,
        status,
        row.createdAt ?? null,
        row.createdAt ?? null,
      ],
    );
    await putMap(conn, target, 'payments', String(row.id), nestId);
    inserted += 1;
  }

  logStep('payments', { inserted, skipped, source: rows.length });
}

async function importMedia(ctx: StepContext) {
  const { conn, source, target } = ctx;
  const [sellerRows] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM \`${target}\`.sellers WHERE slug = 'didnegar-shop' LIMIT 1`,
  );
  const sellerId = sellerRows[0]?.id as string | undefined;
  const [adminRows] = await conn.query<RowDataPacket[]>(
    `SELECT id FROM \`${target}\`.users WHERE username = '09363078987' LIMIT 1`,
  );
  const uploaderId = adminRows[0]?.id as string | undefined;
  if (!sellerId || !uploaderId) {
    throw new Error(
      'Need didnegar-shop seller and 09363078987 user for media import',
    );
  }

  let inserted = 0;
  let skipped = 0;
  const batchSize = 500;
  let offset = 0;
  const existing = await loadMap(conn, target, 'media_assets');

  for (;;) {
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT id, filename, mimeType, title, altText
       FROM \`${source}\`.media
       ORDER BY createdAt, id
       LIMIT ${batchSize} OFFSET ${offset}`,
    );
    if (!rows.length) break;

    const valueSql: string[] = [];
    const params: Array<string | number | null> = [];
    const mapSql: string[] = [];
    const mapParams: string[] = [];

    for (const row of rows) {
      const legacyKey = String(row.id);
      if (existing.has(legacyKey)) {
        skipped += 1;
        continue;
      }

      const filename = String(row.filename || '').replace(/^\/+/, '').trim();
      const relativePath = (filename || `legacy/${legacyKey}`).slice(0, 500);
      const originalName = (
        relativePath.split('/').pop() ||
        String(row.title || `media-${legacyKey}`)
      ).slice(0, 255);
      const mimeType = String(row.mimeType || 'application/octet-stream').slice(
        0,
        100,
      );
      const alt = row.altText ? String(row.altText).slice(0, 500) : null;
      const group = mimeType.startsWith('image/')
        ? 'product'
        : mimeType.startsWith('video/')
          ? 'other'
          : 'other';
      const nestId = newId();

      valueSql.push(
        '(?, ?, ?, ?, NULL, ?, ?, ?, 0, ?, \'gallery\', \'approved\', 1, NULL)',
      );
      params.push(
        nestId,
        group,
        sellerId,
        uploaderId,
        originalName,
        alt,
        mimeType,
        relativePath,
      );

      mapSql.push('(?, ?, ?)');
      mapParams.push('media_assets', legacyKey, nestId);
      existing.set(legacyKey, nestId);
    }

    if (valueSql.length) {
      try {
        await conn.execute(
          `INSERT INTO \`${target}\`.media_assets
           (\`id\`, \`group\`, sellerId, uploadedByUserId, productId, originalName, alt,
            mimeType, sizeBytes, relativePath, storageLocation, status, isUsed, expiresAt)
           VALUES ${valueSql.join(',')}`,
          params,
        );
        await conn.execute(
          `INSERT INTO \`${target}\`.legacy_id_map (entity, legacy_ulid, nest_uuid)
           VALUES ${mapSql.join(',')}
           ON DUPLICATE KEY UPDATE nest_uuid = VALUES(nest_uuid)`,
          mapParams,
        );
        inserted += valueSql.length;
      } catch (error) {
        // Fallback row-by-row if a batch fails (rare)
        for (let i = 0; i < valueSql.length; i += 1) {
          const sliceParams = params.slice(i * 8, i * 8 + 8);
          const nestId = sliceParams[0] as string;
          const legacyKey = mapParams[i * 3 + 1];
          try {
            await conn.execute(
              `INSERT INTO \`${target}\`.media_assets
               (\`id\`, \`group\`, sellerId, uploadedByUserId, productId, originalName, alt,
                mimeType, sizeBytes, relativePath, storageLocation, status, isUsed, expiresAt)
               VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 0, ?, 'gallery', 'approved', 1, NULL)`,
              sliceParams,
            );
            await putMap(conn, target, 'media_assets', legacyKey, nestId);
            inserted += 1;
          } catch {
            existing.delete(legacyKey);
            skipped += 1;
          }
        }
        console.warn(
          `media batch fallback at offset=${offset}: ${String(
            (error as Error).message || error,
          ).slice(0, 200)}`,
        );
      }
    }

    offset += rows.length;
    console.log(
      `media progress: offset=${offset} inserted=${inserted} skipped=${skipped}`,
    );
    if (rows.length < batchSize) break;
  }

  logStep('media', { inserted, skipped, sourceOffset: offset });
}

const runners: Record<
  (typeof STEPS)[number],
  (ctx: StepContext) => Promise<void>
> = {
  locations: importLocations,
  attributes: importAttributes,
  brands: importBrands,
  categories: importCategories,
  products: importProducts,
  'product-categories': importProductCategories,
  users: importUsers,
  addresses: importAddresses,
  orders: importOrders,
  payments: importPayments,
  media: importMedia,
};

async function main() {
  const stepArg = (process.argv[2] || 'all') as StepName;
  const selected =
    stepArg === 'all'
      ? [...STEPS]
      : (STEPS as readonly string[]).includes(stepArg)
        ? [stepArg as (typeof STEPS)[number]]
        : null;

  if (!selected) {
    console.error(
      `Unknown step "${stepArg}". Use one of: all, ${STEPS.join(', ')}`,
    );
    process.exit(1);
  }

  const conn = await openConn();
  const source = sourceDb();
  const target = targetDb();
  const ctx: StepContext = { conn, source, target };

  try {
    await ensureIdMap(conn, target);
    for (const step of selected) {
      console.log(`\n=== importing ${step} ===`);
      await runners[step](ctx);
    }
    console.log('\nDone.');
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
