import { MigrationInterface, QueryRunner } from 'typeorm';

/** Adds shippingMethod if 178885 already ran without it. */
export class AddProductShippingMethod1788870000000
  implements MigrationInterface
{
  name = 'AddProductShippingMethod1788870000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "shippingMethod" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "shippingMethod"
    `);
  }
}
