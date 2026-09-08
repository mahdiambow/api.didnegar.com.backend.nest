import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryIsActive1788760000000 implements MigrationInterface {
  name = 'AddCategoryIsActive1788760000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true
    `);
    await queryRunner.query(`
      ALTER TABLE "sub_categories"
      ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sub_categories" DROP COLUMN IF EXISTS "isActive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "isActive"`,
    );
  }
}
