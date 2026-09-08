import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductStockAndRenameOfferStock1788790000000
  implements MigrationInterface
{
  name = 'AddProductStockAndRenameOfferStock1788790000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "stock" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_offers"
      DROP CONSTRAINT IF EXISTS "CHK_offer_stock"
    `);

    const hasStockQuantity = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'seller_offers'
        AND column_name = 'stockQuantity'
      LIMIT 1
    `);
    const hasStock = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'seller_offers'
        AND column_name = 'stock'
      LIMIT 1
    `);

    if (hasStockQuantity.length > 0 && hasStock.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "seller_offers"
        RENAME COLUMN "stockQuantity" TO "stock"
      `);
    } else if (hasStock.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "seller_offers"
        ADD COLUMN "stock" integer NOT NULL DEFAULT 0
      `);
    }

    await queryRunner.query(`
      ALTER TABLE "seller_offers"
      ADD CONSTRAINT "CHK_offer_stock" CHECK ("stock" >= 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "seller_offers"
      DROP CONSTRAINT IF EXISTS "CHK_offer_stock"
    `);

    const hasStock = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'seller_offers'
        AND column_name = 'stock'
      LIMIT 1
    `);
    const hasStockQuantity = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'seller_offers'
        AND column_name = 'stockQuantity'
      LIMIT 1
    `);

    if (hasStock.length > 0 && hasStockQuantity.length === 0) {
      await queryRunner.query(`
        ALTER TABLE "seller_offers"
        RENAME COLUMN "stock" TO "stockQuantity"
      `);
    }

    await queryRunner.query(`
      ALTER TABLE "seller_offers"
      ADD CONSTRAINT "CHK_offer_stock" CHECK ("stockQuantity" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "stock"
    `);
  }
}
