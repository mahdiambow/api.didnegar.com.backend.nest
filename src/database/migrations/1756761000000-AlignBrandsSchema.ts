import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignBrandsSchema1756761000000 implements MigrationInterface {
  name = 'AlignBrandsSchema1756761000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "brands"
      ADD COLUMN IF NOT EXISTS "description" text
    `);

    await queryRunner.query(`
      ALTER TABLE "brands"
      ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      UPDATE "brands"
      SET "legacyId" = sub.rn,
          "legacyTable" = 'brands'
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt", id) AS rn
        FROM "brands"
        WHERE "legacyId" IS NULL OR "legacyTable" IS NULL
      ) AS sub
      WHERE "brands".id = sub.id
    `);

    await queryRunner.query(`
      ALTER TABLE "brands"
      ALTER COLUMN "legacyId" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "brands"
      ALTER COLUMN "legacyTable" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "brands"
      ALTER COLUMN "name" TYPE character varying(200)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_brands_legacySource"
      ON "brands" ("legacyTable", "legacyId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_brands_name"
      ON "brands" ("name")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE indexname = 'IDX_brands_slug'
        ) THEN
          ALTER INDEX "IDX_brands_slug" RENAME TO "uq_brands_slug";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_brands_slug"
      ON "brands" ("slug")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_brands_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_brands_legacySource"`);
    await queryRunner.query(`
      ALTER TABLE "brands" DROP COLUMN IF EXISTS "isActive"
    `);
    await queryRunner.query(`
      ALTER TABLE "brands" DROP COLUMN IF EXISTS "description"
    `);
  }
}
