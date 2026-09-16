# Legacy migration scripts

`migrate-users.mjs` imports `users` and `user_roles` from the database configured by
`LEGACY_MIGRATED_DB_*` into this application's existing `users`, `roles`, `sellers`, and
`admins` tables.

It maps the legacy roles exactly as follows: `customer` -> `user`, `shop_manager` and
`dokan_export_order` -> `seller`, `subscriber`, `edit_users`, `gform_full_access`,
`edit_files`, `edit_plugins`, `edit_themes`, and `manage_links` -> `admin`, and
`administrator` -> `super-admin`. Seller-role users receive a `sellers` row and are linked
through `users.sellerId`; admin- and super-admin-role users receive an `admins` row and are
linked through `users.adminId`.

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

## Categories

```sh
npm run db:migrate:categories
```

Reshapes legacy `categories` into `parent_categories` and legacy `sub_categories`
into `categories`; the current Nest third level is intentionally left empty. A legacy
sub-category with a missing or null parent is retained under a generated (or reused)
`default` parent category. Legacy product-category links are not imported by this
catalog-only migration.
