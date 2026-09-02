import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductVariants1756740000000 implements MigrationInterface {
  name = 'CreateProductVariants1756740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attribute_values" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "legacyId" bigint,
        "legacyTable" character varying(255),
        "value" character varying(255) NOT NULL,
        "slug" character varying(200) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attribute_values_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_attribute_values_legacySource"
      ON "attribute_values" ("legacyTable", "legacyId")
      WHERE "legacyTable" IS NOT NULL AND "legacyId" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_attribute_values_slug"
      ON "attribute_values" ("slug")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_variants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "legacyId" bigint NOT NULL,
        "legacyTable" character varying(255) NOT NULL,
        "productId" uuid NOT NULL,
        "sku" character varying(100),
        "minPrice" numeric(19,4),
        "maxPrice" numeric(19,4),
        "isVirtual" boolean NOT NULL DEFAULT false,
        "isDownloadable" boolean NOT NULL DEFAULT false,
        "stockQuantity" integer,
        "stockStatus" character varying(50),
        "taxStatus" character varying(50),
        "taxClass" character varying(100),
        "description" text,
        "status" character varying(50) NOT NULL DEFAULT 'publish',
        "weight" numeric(10,2),
        "length" numeric(10,2),
        "width" numeric(10,2),
        "height" numeric(10,2),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_variants_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_variants_product"
          FOREIGN KEY ("productId") REFERENCES "products"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variants_legacySource"
      ON "product_variants" ("legacyTable", "legacyId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variants_sku"
      ON "product_variants" ("sku")
      WHERE "sku" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variants_productId"
      ON "product_variants" ("productId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variants_stockStatus"
      ON "product_variants" ("stockStatus")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_variant_attributes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "variantId" uuid NOT NULL,
        "attributeValueId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_variant_attributes_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_variant_attributes_variant"
          FOREIGN KEY ("variantId") REFERENCES "product_variants"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_product_variant_attributes_attribute_value"
          FOREIGN KEY ("attributeValueId") REFERENCES "attribute_values"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_variant_attributes_pair"
      ON "product_variant_attributes" ("variantId", "attributeValueId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variant_attributes_variantId"
      ON "product_variant_attributes" ("variantId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_product_variant_attributes_attributeValueId"
      ON "product_variant_attributes" ("attributeValueId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variant_attributes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attribute_values"`);
  }
}
