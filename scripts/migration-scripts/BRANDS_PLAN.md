# Brand migration plan

- Read legacy `brands` using `LEGACY_MIGRATED_DB_*`; write to the existing Nest `brands` table using `DB_*`.
- Import 1,000 rows per batch. All writes in a batch occur in one target transaction; a failure rolls that batch back.
- Preserve `legacyId`, `legacyTable`, `isActive`, `createdAt`, and `updatedAt`.
- Map `name` to `name` (and extract `nameEn` only from a recognizable Persian–English `name`), `logo` to `logoUrl`, and HTML-stripped `description` to `seoDescription`.
- Upsert by legacy identity first, then slug. A collision owned by another legacy record receives a deterministic `-<legacyId>` suffix.
- Emit per-batch and final read, added, updated, skipped, and adjusted-slug counts.
