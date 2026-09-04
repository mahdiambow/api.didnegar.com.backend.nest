import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignProductCategoriesSchema1756760000000
  implements MigrationInterface
{
  name = 'AlignProductCategoriesSchema1756760000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
        CONSTRAINT "fk_product_categories_product"
          FOREIGN KEY ("productId") REFERENCES "products"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_product_categories_category"
          FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "fk_product_categories_sub_category"
          FOREIGN KEY ("subCategoryId") REFERENCES "sub_categories"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE indexname = 'IDX_product_categories_unique'
        ) THEN
          ALTER INDEX "IDX_product_categories_unique"
            RENAME TO "uq_product_category";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_product_category"
      ON "product_categories" ("productId", "categoryId", "subCategoryId")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE indexname = 'IDX_product_categories_productId'
        ) THEN
          ALTER INDEX "IDX_product_categories_productId"
            RENAME TO "idx_product_categories_productId";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_categories_productId"
      ON "product_categories" ("productId")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE indexname = 'IDX_product_categories_categoryId'
        ) THEN
          ALTER INDEX "IDX_product_categories_categoryId"
            RENAME TO "idx_product_categories_categoryId";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_categories_categoryId"
      ON "product_categories" ("categoryId")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE indexname = 'IDX_product_categories_subCategoryId'
        ) THEN
          ALTER INDEX "IDX_product_categories_subCategoryId"
            RENAME TO "idx_product_categories_subCategoryId";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_categories_subCategoryId"
      ON "product_categories" ("subCategoryId")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_product_categories_product'
        ) THEN
          ALTER TABLE "product_categories"
            RENAME CONSTRAINT "FK_product_categories_product"
            TO "fk_product_categories_product";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_product_categories_category'
        ) THEN
          ALTER TABLE "product_categories"
            RENAME CONSTRAINT "FK_product_categories_category"
            TO "fk_product_categories_category";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'FK_product_categories_sub_category'
        ) THEN
          ALTER TABLE "product_categories"
            RENAME CONSTRAINT "FK_product_categories_sub_category"
            TO "fk_product_categories_sub_category";
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER INDEX IF EXISTS "uq_product_category"
        RENAME TO "IDX_product_categories_unique"
    `);

    await queryRunner.query(`
      ALTER INDEX IF EXISTS "idx_product_categories_productId"
        RENAME TO "IDX_product_categories_productId"
    `);

    await queryRunner.query(`
      ALTER INDEX IF EXISTS "idx_product_categories_categoryId"
        RENAME TO "IDX_product_categories_categoryId"
    `);

    await queryRunner.query(`
      ALTER INDEX IF EXISTS "idx_product_categories_subCategoryId"
        RENAME TO "IDX_product_categories_subCategoryId"
    `);
  }
}
