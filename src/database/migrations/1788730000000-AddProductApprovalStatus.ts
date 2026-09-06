import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductApprovalStatus1788730000000
  implements MigrationInterface
{
  name = 'AddProductApprovalStatus1788730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "approvalStatus" character varying(20)
        NOT NULL DEFAULT 'pending'
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "rejectionReason" text
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_approvalStatus"
      ON "products" ("approvalStatus")
    `);

    // محصولات موجود را تأییدشده در نظر بگیر
    await queryRunner.query(`
      UPDATE "products"
      SET "approvalStatus" = 'approved'
      WHERE "status" = 'publish'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_products_approvalStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "rejectionReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "approvalStatus"`,
    );
  }
}
