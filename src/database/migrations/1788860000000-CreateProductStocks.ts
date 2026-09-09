import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductStocks1788860000000 implements MigrationInterface {
  name = 'CreateProductStocks1788860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_stocks" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "productId" uuid NOT NULL,
        "stock" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_stocks_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_product_stocks_productId" UNIQUE ("productId"),
        CONSTRAINT "CHK_product_stock" CHECK ("stock" >= 0),
        CONSTRAINT "FK_product_stocks_product"
          FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
      )
    `);

    const hasProductStock = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'stock'
      LIMIT 1
    `);

    if (hasProductStock.length > 0) {
      await queryRunner.query(`
        INSERT INTO "product_stocks" ("productId", "stock")
        SELECT "id", COALESCE("stock", 0)
        FROM "products"
        ON CONFLICT ("productId") DO NOTHING
      `);

      await queryRunner.query(`
        ALTER TABLE "products"
        DROP COLUMN IF EXISTS "stock"
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "stock" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      UPDATE "products" p
      SET "stock" = COALESCE(s."stock", 0)
      FROM "product_stocks" s
      WHERE s."productId" = p.id
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "product_stocks"`);
  }
}
