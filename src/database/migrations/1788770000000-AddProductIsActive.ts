import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductIsActive1788770000000 implements MigrationInterface {
  name = 'AddProductIsActive1788770000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "isActive"`,
    );
  }
}
