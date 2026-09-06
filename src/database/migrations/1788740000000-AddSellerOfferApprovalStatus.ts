import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSellerOfferApprovalStatus1788740000000
  implements MigrationInterface
{
  name = 'AddSellerOfferApprovalStatus1788740000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "seller_offers"
      ADD COLUMN IF NOT EXISTS "approvalStatus" character varying(20)
        NOT NULL DEFAULT 'approved'
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_offers"
      ADD COLUMN IF NOT EXISTS "rejectionReason" text
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_seller_offers_approvalStatus"
      ON "seller_offers" ("approvalStatus")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_seller_offers_approvalStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_offers" DROP COLUMN IF EXISTS "rejectionReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "seller_offers" DROP COLUMN IF EXISTS "approvalStatus"`,
    );
  }
}
