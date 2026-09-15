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
