import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBrandsProductsAndPayments1756710000000
  implements MigrationInterface
{
  name = 'CreateBrandsProductsAndPayments1756710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "brands" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "legacyId" bigint,
        "legacyTable" character varying(255),
        "name" character varying(255) NOT NULL,
        "slug" character varying(200) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_brands_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_brands_slug"
      ON "brands" ("slug")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "legacyId" bigint NOT NULL,
        "legacyTable" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "slug" character varying(200) NOT NULL,
        "description" text,
        "shortDescription" text,
        "status" character varying(50) NOT NULL DEFAULT 'publish',
        "sku" character varying(100),
        "brandId" uuid,
        "minPrice" numeric(19,4),
        "maxPrice" numeric(19,4),
        "isVirtual" boolean NOT NULL DEFAULT false,
        "isDownloadable" boolean NOT NULL DEFAULT false,
        "stockQuantity" integer,
        "stockStatus" character varying(50),
        "isOnSale" boolean NOT NULL DEFAULT false,
        "ratingCount" integer NOT NULL DEFAULT 0,
        "averageRating" numeric(3,2) NOT NULL DEFAULT 0.00,
        "totalSales" integer NOT NULL DEFAULT 0,
        "taxStatus" character varying(50),
        "taxClass" character varying(100),
        "globalUniqueId" character varying(100),
        "weight" numeric(10,2),
        "length" numeric(10,2),
        "width" numeric(10,2),
        "height" numeric(10,2),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_products_brand"
          FOREIGN KEY ("brandId") REFERENCES "brands"("id")
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_products_legacySource"
      ON "products" ("legacyTable", "legacyId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_products_sku"
      ON "products" ("sku")
      WHERE "sku" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_products_slug"
      ON "products" ("slug")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_name"
      ON "products" ("name")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_status"
      ON "products" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_stock_status"
      ON "products" ("stockStatus")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_on_sale"
      ON "products" ("isOnSale")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_brandId"
      ON "products" ("brandId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "amount" numeric(19,4) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_orders_product"
          FOREIGN KEY ("productId") REFERENCES "products"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL,
        "gateway" character varying(20) NOT NULL DEFAULT 'zarinpal',
        "authority" character varying(100) NOT NULL,
        "refId" character varying(100),
        "amount" numeric(19,4) NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'pending',
        "callbackUrl" character varying(500),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payments_orderId" UNIQUE ("orderId"),
        CONSTRAINT "FK_payments_order"
          FOREIGN KEY ("orderId") REFERENCES "orders"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payments_authority"
      ON "payments" ("authority")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "brands"`);
  }
}
