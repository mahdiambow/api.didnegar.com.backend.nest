import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLocationsLegacyTable1756664000000
  implements MigrationInterface
{
  name = 'RemoveLocationsLegacyTable1756664000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_countries_legacyTable"
    `);

    await queryRunner.query(`
      ALTER TABLE "countries"
      DROP COLUMN IF EXISTS "legacyTable"
    `);

    await queryRunner.query(`
      ALTER TABLE "states"
      DROP COLUMN IF EXISTS "legacyTable"
    `);

    await queryRunner.query(`
      ALTER TABLE "cities"
      DROP COLUMN IF EXISTS "legacyTable"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "countries"
      ADD COLUMN IF NOT EXISTS "legacyTable" character varying(255)
    `);

    await queryRunner.query(`
      UPDATE "countries"
      SET "legacyTable" = 'legacy_countries'
      WHERE "legacyTable" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "countries"
      ALTER COLUMN "legacyTable" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_countries_legacyTable"
      ON "countries" ("legacyTable")
    `);

    await queryRunner.query(`
      ALTER TABLE "states"
      ADD COLUMN IF NOT EXISTS "legacyTable" character varying(255)
    `);

    await queryRunner.query(`
      UPDATE "states"
      SET "legacyTable" = 'legacy_states'
      WHERE "legacyTable" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "states"
      ALTER COLUMN "legacyTable" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "cities"
      ADD COLUMN IF NOT EXISTS "legacyTable" character varying(255)
    `);

    await queryRunner.query(`
      UPDATE "cities"
      SET "legacyTable" = 'legacy_cities'
      WHERE "legacyTable" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "cities"
      ALTER COLUMN "legacyTable" SET NOT NULL
    `);
  }
}
