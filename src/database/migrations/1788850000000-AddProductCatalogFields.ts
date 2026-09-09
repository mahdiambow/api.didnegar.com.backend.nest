import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCatalogFields1788850000000
  implements MigrationInterface
{
  name = 'AddProductCatalogFields1788850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "subtitle" character varying(255),
      ADD COLUMN IF NOT EXISTS "excerpt" text,
      ADD COLUMN IF NOT EXISTS "sku" character varying(100),
      ADD COLUMN IF NOT EXISTS "isFeatured" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "seo" jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS "image" jsonb NOT NULL DEFAULT '{"featuredImg":null,"gallery":[]}'::jsonb,
      ADD COLUMN IF NOT EXISTS "price" jsonb,
      ADD COLUMN IF NOT EXISTS "shippingMethod" jsonb,
      ADD COLUMN IF NOT EXISTS "tableInfo" jsonb NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS "attributeIds" uuid[] NOT NULL DEFAULT '{}'
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "attributes"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_products_sku"
      ON "products" ("sku")
      WHERE "sku" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_sku"`);
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "attributes" jsonb NOT NULL DEFAULT '{}'::jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "attributeIds",
      DROP COLUMN IF EXISTS "tableInfo",
      DROP COLUMN IF EXISTS "shippingMethod",
      DROP COLUMN IF EXISTS "price",
      DROP COLUMN IF EXISTS "image",
      DROP COLUMN IF EXISTS "seo",
      DROP COLUMN IF EXISTS "isFeatured",
      DROP COLUMN IF EXISTS "sku",
      DROP COLUMN IF EXISTS "excerpt",
      DROP COLUMN IF EXISTS "subtitle"
    `);
  }
}
