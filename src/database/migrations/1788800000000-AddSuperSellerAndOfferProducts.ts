import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLE_SLUGS,
} from '../../roles/permissions.js';

export class AddSuperSellerAndOfferProducts1788800000000
  implements MigrationInterface
{
  name = 'AddSuperSellerAndOfferProducts1788800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      ...DEFAULT_ROLE_PERMISSIONS[DEFAULT_ROLE_SLUGS.SUPER_SELLER],
    ];

    await queryRunner.query(
      `
      INSERT INTO "roles" ("slug", "name", "permissions", "isSystem", "sellerId")
      SELECT $1::varchar, $2::varchar, $3::text[], true, NULL
      WHERE NOT EXISTS (
        SELECT 1 FROM "roles"
        WHERE "slug" = $1::varchar AND "sellerId" IS NULL
      )
    `,
      [DEFAULT_ROLE_SLUGS.SUPER_SELLER, 'سوپر فروشنده', permissions],
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "offer_products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sellerId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "slug" character varying(200) NOT NULL,
        "description" text,
        "shortDescription" text,
        "brandId" uuid,
        "categoryIds" uuid[] NOT NULL DEFAULT '{}',
        "attributes" jsonb NOT NULL DEFAULT '{}',
        "isVirtual" boolean NOT NULL DEFAULT false,
        "isDownloadable" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "taxStatus" character varying(50),
        "taxClass" character varying(100),
        "weight" numeric(10,2),
        "length" numeric(10,2),
        "width" numeric(10,2),
        "height" numeric(10,2),
        "sku" character varying(100) NOT NULL,
        "price" numeric(19,4) NOT NULL,
        "stock" integer NOT NULL DEFAULT 0,
        "stockStatus" character varying(50) NOT NULL DEFAULT 'outofstock',
        "isOnSale" boolean NOT NULL DEFAULT false,
        "approvalStatus" character varying(20) NOT NULL DEFAULT 'pending',
        "rejectionReason" text,
        "productId" uuid,
        "offerId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_offer_products_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_offer_product_price" CHECK ("price" >= 0),
        CONSTRAINT "CHK_offer_product_stock" CHECK ("stock" >= 0),
        CONSTRAINT "FK_offer_products_sellerId"
          FOREIGN KEY ("sellerId") REFERENCES "sellers"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "FK_offer_products_productId"
          FOREIGN KEY ("productId") REFERENCES "products"("id")
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "FK_offer_products_offerId"
          FOREIGN KEY ("offerId") REFERENCES "seller_offers"("id")
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_offer_products_slug"
      ON "offer_products" ("slug")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_offer_products_sellerId"
      ON "offer_products" ("sellerId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_offer_products_approvalStatus"
      ON "offer_products" ("approvalStatus")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "offer_products"`);
    await queryRunner.query(`
      DELETE FROM "roles"
      WHERE "slug" = 'super-seller' AND "sellerId" IS NULL
    `);
  }
}
