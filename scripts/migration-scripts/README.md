# Legacy migration scripts

## Product media URLs

```sh
npm run db:migrate:product-media-urls
```

Run after the physical legacy product files have been converted and uploaded to
SeaweedFS. It verifies each `optimized-wordpress/...webp` object with SeaweedFS
before repointing product-linked legacy `media.url` and `products.image` values
to `MEDIA_PUBLIC_BASE_URL/optimized-wordpress/...webp`. Missing objects and
ambiguous `.jpg`/`.png` → `.webp` collisions are left unchanged and recorded in
`/tmp/migration-product-media-urls-report.jsonl`. It is idempotent.

`migrate-users.mjs` imports `users`, `user_roles`, and validated `sellers` from the database
configured by `LEGACY_MIGRATED_DB_*` into this application's existing `users`, `roles`,
`sellers`, and `admins` tables.

It maps legacy roles for user authorization. A target seller is created only when the source
user has a row in the legacy `sellers` table; WordPress capabilities such as `shop_manager`
and `dokan_export_order` cannot create sellers on their own. Validated sellers receive the
target `seller` role and are linked through `users.sellerId`; admin- and super-admin-role
users receive an `admins` row and are linked through `users.adminId`.

Run it with:

```sh
npm run db:migrate:users
```

It reads and commits 1,000 users per batch. Every target batch is one transaction: a failure
rolls back that batch and stops the script. The script prints added, updated, skipped,
seller-added, seller-updated, admin-added, admin-updated, and unmapped-role-link counts after
each committed batch.

## Brands

```sh
npm run db:migrate:brands
```

See [BRANDS_PLAN.md](./BRANDS_PLAN.md) for the field mappings and conflict policy.

## Locations

```sh
npm run db:migrate:locations
```

Imports `countries`, then `states`, then `cities`. Source IDs are retained where
possible so existing legacy references remain valid. Countries match by ID or code;
states match by ID or their resolved `(countryId, code)` pair; cities match only by
ID. Missing relations or a city whose country conflicts with its state's country stop
and roll back the affected batch.

## Addresses

```sh
npm run db:migrate:addresses
```

Run after users and locations. The legacy address ID becomes the target
`user_addresses.id`, so rerunning safely updates imported rows. The importer only
uses an exact imported legacy-user identity and requires a city, province, address
detail, and recipient name. `recipientPhone` and `postalCode` are copied without
format validation; values that cannot fit their target columns become NULL. Every
skipped row and its reason is written to
`migration-addresses-report.jsonl` (or the path configured by
`MIGRATION_ADDRESSES_REPORT_PATH`).

## Customers

```sh
npm run db:migrate:customers
```

Run the normal Nest schema migration first, then run this after users and locations.
It preserves the legacy customer ID and source identity for upcoming order migration.
Customer records are not skipped when an optional user, country, state, or city link
cannot be found; user/state/city links become `NULL`. An unresolved legacy country
link is assigned to the target country with code `IR`. Every fallback is recorded in
`migration-customers-report.jsonl`.

## Categories

```sh
npm run db:migrate:categories
```

Legacy `categories` remain Nest `categories`; legacy `sub_categories` remain Nest
`sub_categories`. All imported categories attach to the first existing Nest
parent-category, ordered by `sort`, then `name`. If none exists, the importer creates a
`default` parent category. Orphan legacy sub-categories attach to a generated or reused
`default` Nest category beneath that same parent.

## Attributes

```sh
npm run db:migrate:attributes
```

Imports legacy `attributes` and `attribute_values`. Legacy value `slug` becomes the
target value label when present; value ordering is deterministic by legacy order.

## Product-category relations

```sh
npm run db:migrate:product-relations
```

Run after categories and catalog. Imports legacy `product_categories`, resolving
products, categories, and sub-categories through their legacy identities. Invalid
references are skipped and recorded in `migration-product-relations-report.jsonl`.

## Product-brand relations

```sh
npm run db:migrate:product-brands
```

Run after brands and catalog. It links only imported legacy products to imported
brands by the exact `(legacyTable, legacyId)` identity; it never guesses by name or
slug. Missing links are recorded in `migration-product-brands-report.jsonl`.

## Seller-offer attributes

```sh
npm run db:migrate:offer-attributes
```

Run after attributes and catalog. It transforms legacy `product_variant_attributes`
into `products.price[].valueAttributeIds`; the Nest `product_variants` table is
not populated. Invalid links are recorded in
`migration-offer-attributes-report.jsonl`.

## Product table information

```sh
npm run db:migrate:product-table-info
```

Run after `db:migrate:offer-attributes`. It gathers all distinct legacy variant attribute
values for each product and writes them as `products.tableInfo` under `مشخصات فنی`.
Each item has the imported attribute label as `key` and its distinct imported values
as `val`. The migrated value IDs are removed from that product's
`products.price[].valueAttributeIds` (and the deprecated `attributeIds` alias).

## Product images

```sh
npm run db:migrate:media
npm run db:migrate:product-images
```

First run the normal Nest schema migrations to create the Nest database's
legacy-compatible `media` table. `db:migrate:media` then preserves all legacy media
metadata and IDs in that table. Run it after catalog, then run the product image
migration. It maps legacy `product_variant_images` through the migrated Nest media table into the existing product
`image` JSON: `{ "featuredImg": "...", "gallery": ["..."] }` and creates the
normalized `product_media` relation rows. The `product_media` table is the Nest
equivalent of legacy `product_variant_images`, using `productId` because target
product variants are intentionally not stored.
The first valid image ordered by legacy primary flag and sort order becomes
`featuredImg`; all unique URLs are retained in `gallery`. No target schema migration
or seller-offer image column is used.

## Product media WebP metadata

After product-linked JPEG/PNG files have been uploaded to SeaweedFS, update
their Nest media MIME types across every legacy upload year:

```sh
npm run db:migrate:product-media-webp
```

The script changes only `media.mimeType` to `image/webp` for product-linked
media rows that have both `legacyTable` and `legacyId`. It leaves documents,
GIFs, existing WebP rows, non-legacy rows, `media.url`, and `products.image`
unchanged.
Rows whose different source filenames map to the same `.webp` output are also
skipped and recorded for review.
