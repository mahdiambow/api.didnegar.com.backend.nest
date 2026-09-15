# Legacy migration scripts

`migrate-users.mjs` imports `users` and `user_roles` from the database configured by
`LEGACY_MIGRATED_DB_*` into this application's existing `users`, `roles`, and `sellers` tables.

It maps the legacy roles exactly as follows: `customer` → `user`, `shop_manager` and
`dokan_export_order` → `seller`, `subscriber`, `edit_users`, `gform_full_access`,
`edit_files`, `edit_plugins`, `edit_themes`, and `manage_links` → `admin`, and
`administrator` → `super-admin`. Any user with the mapped `seller` role receives a
seller row and is linked through `users.sellerId`. Admins remain rows in `users` with
the `admin` or `super-admin` role because the Nest schema has no separate `admins` table.

Run it with:

```sh
npm run db:migrate:users
```

It reads and commits 1,000 users per batch. Every target batch is one transaction:
a failure rolls back that batch and stops the script. The script prints added, updated,
skipped, seller-added, seller-updated, and unmapped-role-link counts after each committed batch.

## Brands

```sh
npm run db:migrate:brands
```

See [BRANDS_PLAN.md](./BRANDS_PLAN.md) for the field mappings and conflict policy.
