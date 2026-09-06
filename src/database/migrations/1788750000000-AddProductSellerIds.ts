import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductSellerIds1788750000000 implements MigrationInterface {
  name = 'AddProductSellerIds1788750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "sellerIds" uuid[] NOT NULL DEFAULT '{}'::uuid[]
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "createdBySellerId" uuid
    `);

    // فروشنده‌های دارای آفر تأییدشده را به لیست محصول اضافه کن
    await queryRunner.query(`
      UPDATE "products" p
      SET "sellerIds" = COALESCE((
        SELECT ARRAY_AGG(DISTINCT o."sellerId")
        FROM "seller_offers" o
        WHERE o."productId" = p.id
          AND o."approvalStatus" = 'approved'
      ), '{}'::uuid[])
      WHERE p."sellerIds" = '{}'::uuid[]
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "createdBySellerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "sellerIds"`,
    );
  }
}
