import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategoriesAndProductCategories1756730000000
  implements MigrationInterface
{
  name = 'CreateCategoriesAndProductCategories1756730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "legacyId" bigint,
        "legacyTable" character varying(255),
        "name" character varying(255) NOT NULL,
        "slug" character varying(200) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_categories_slug"
      ON "categories" ("slug")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sub_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "categoryId" uuid NOT NULL,
        "legacyId" bigint,
        "legacyTable" character varying(255),
        "name" character varying(255) NOT NULL,
        "slug" character varying(200) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sub_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sub_categories_category"
          FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_sub_categories_category_slug"
      ON "sub_categories" ("categoryId", "slug")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sub_categories_categoryId"
      ON "sub_categories" ("categoryId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "productId" uuid NOT NULL,
        "categoryId" uuid,
        "subCategoryId" uuid,
        "isPrimary" boolean NOT NULL DEFAULT false,
        "position" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_categories_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_categories_product"
          FOREIGN KEY ("productId") REFERENCES "products"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_product_categories_category"
          FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_product_categories_sub_category"
          FOREIGN KEY ("subCategoryId") REFERENCES "sub_categories"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_categories_unique"
      ON "product_categories" ("productId", "categoryId", "subCategoryId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_categories_productId"
      ON "product_categories" ("productId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_categories_categoryId"
      ON "product_categories" ("categoryId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_categories_subCategoryId"
      ON "product_categories" ("subCategoryId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sub_categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
