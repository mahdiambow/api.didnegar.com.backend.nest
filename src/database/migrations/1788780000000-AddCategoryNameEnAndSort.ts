import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryNameEnAndSort1788780000000
  implements MigrationInterface
{
  name = 'AddCategoryNameEnAndSort1788780000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "nameEn" character varying(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "sort" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "sub_categories"
      ADD COLUMN IF NOT EXISTS "nameEn" character varying(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "sub_categories"
      ADD COLUMN IF NOT EXISTS "sort" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sub_categories" DROP COLUMN IF EXISTS "sort"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sub_categories" DROP COLUMN IF EXISTS "nameEn"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "sort"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "nameEn"`,
    );
  }
}
