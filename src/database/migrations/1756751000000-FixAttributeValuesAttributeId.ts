import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAttributeValuesAttributeId1756751000000
  implements MigrationInterface
{
  name = 'FixAttributeValuesAttributeId1756751000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasAttributeId = await queryRunner.hasColumn(
      'attribute_values',
      'attributeId',
    );

    if (!hasAttributeId) {
      await queryRunner.query(`
        ALTER TABLE "attribute_values"
        ADD COLUMN "attributeId" uuid
      `);
    }

    await queryRunner.query(`
      INSERT INTO "attributes" ("legacyId", "legacyTable", "name", "label", "isPublic")
      SELECT 1, 'attributes', 'storage', 'حافظه', true
      WHERE NOT EXISTS (
        SELECT 1 FROM "attributes" WHERE "name" = 'storage'
      )
    `);

    await queryRunner.query(`
      INSERT INTO "attributes" ("legacyId", "legacyTable", "name", "label", "isPublic")
      SELECT 2, 'attributes', 'color', 'رنگ', true
      WHERE NOT EXISTS (
        SELECT 1 FROM "attributes" WHERE "name" = 'color'
      )
    `);

    await queryRunner.query(`
      UPDATE "attribute_values" av
      SET "attributeId" = a."id"
      FROM "attributes" a
      WHERE av."attributeId" IS NULL
        AND av."slug" IN ('256gb', '512gb')
        AND a."name" = 'storage'
    `);

    await queryRunner.query(`
      UPDATE "attribute_values" av
      SET "attributeId" = a."id"
      FROM "attributes" a
      WHERE av."attributeId" IS NULL
        AND av."slug" IN ('black', 'titanium')
        AND a."name" = 'color'
    `);

    await queryRunner.query(`
      UPDATE "attribute_values"
      SET "legacyId" = COALESCE("legacyId", 0),
          "legacyTable" = COALESCE("legacyTable", 'attribute_values')
      WHERE "legacyId" IS NULL OR "legacyTable" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "attribute_values" av
      SET "attributeId" = sub."id"
      FROM (
        SELECT a."id" FROM "attributes" a WHERE a."name" = 'storage' LIMIT 1
      ) sub
      WHERE av."attributeId" IS NULL
    `);

    await queryRunner.query(`
      DELETE FROM "attribute_values" WHERE "attributeId" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "attribute_values"
      ALTER COLUMN "legacyId" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "attribute_values"
      ALTER COLUMN "legacyTable" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "attribute_values"
      ALTER COLUMN "attributeId" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "attribute_values"
      DROP COLUMN IF EXISTS "updatedAt"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_bd7ad33d1afb1f37f65d9f8a3e"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_attribute_values_slug"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_attribute_values_attribute_slug"
      ON "attribute_values" ("attributeId", "slug")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_attribute_values_attributeId"
      ON "attribute_values" ("attributeId")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_attribute_values_attribute'
        ) THEN
          ALTER TABLE "attribute_values"
          ADD CONSTRAINT "FK_attribute_values_attribute"
            FOREIGN KEY ("attributeId") REFERENCES "attributes"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "attribute_values"
      ALTER COLUMN "value" TYPE character varying(200)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "attribute_values"
      DROP CONSTRAINT IF EXISTS "FK_attribute_values_attribute"
    `);

    await queryRunner.query(`
      ALTER TABLE "attribute_values"
      DROP COLUMN IF EXISTS "attributeId"
    `);
  }
}
