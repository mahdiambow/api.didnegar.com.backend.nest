import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttributes1756750000000 implements MigrationInterface {
  name = 'CreateAttributes1756750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attributes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "legacyId" bigint NOT NULL,
        "legacyTable" character varying(255) NOT NULL,
        "name" character varying(200) NOT NULL,
        "label" character varying(200) NOT NULL,
        "isPublic" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attributes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_attributes_legacySource"
      ON "attributes" ("legacyTable", "legacyId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_attributes_name"
      ON "attributes" ("name")
    `);

    const attributeValuesExists = await queryRunner.hasTable('attribute_values');

    if (attributeValuesExists) {
      await queryRunner.query(`
        ALTER TABLE "attribute_values"
        ADD COLUMN IF NOT EXISTS "attributeId" uuid
      `);

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
        DROP INDEX IF EXISTS "IDX_attribute_values_slug"
      `);
    } else {
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "attribute_values" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "legacyId" bigint NOT NULL,
          "legacyTable" character varying(255) NOT NULL,
          "attributeId" uuid NOT NULL,
          "value" character varying(200) NOT NULL,
          "slug" character varying(200) NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_attribute_values_id" PRIMARY KEY ("id")
        )
      `);
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_attribute_values_legacySource"
      ON "attribute_values" ("legacyTable", "legacyId")
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "attribute_values"
      DROP CONSTRAINT IF EXISTS "FK_attribute_values_attribute"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "attributes"`);
  }
}
