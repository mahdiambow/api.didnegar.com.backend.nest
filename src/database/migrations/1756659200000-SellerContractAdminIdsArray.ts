import { MigrationInterface, QueryRunner } from 'typeorm';

export class SellerContractAdminIdsArray1756659200000
  implements MigrationInterface
{
  name = 'SellerContractAdminIdsArray1756659200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      ADD COLUMN IF NOT EXISTS "adminIds" uuid[] NOT NULL DEFAULT '{}'
    `);

    await queryRunner.query(`
      UPDATE "seller_contracts"
      SET "adminIds" = ARRAY["adminId"]
      WHERE "adminId" IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      DROP CONSTRAINT IF EXISTS "FK_seller_contracts_adminId"
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      DROP CONSTRAINT IF EXISTS "FK_272c71e885e7375cab737f08bc3"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_seller_contracts_adminId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_272c71e885e7375cab737f08bc"
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      DROP COLUMN IF EXISTS "adminId"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      ADD COLUMN IF NOT EXISTS "adminId" uuid
    `);

    await queryRunner.query(`
      UPDATE "seller_contracts"
      SET "adminId" = "adminIds"[1]
      WHERE COALESCE(array_length("adminIds", 1), 0) > 0
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      ALTER COLUMN "adminId" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      DROP COLUMN IF EXISTS "adminIds"
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_seller_contracts_adminId"
      ON "seller_contracts" ("adminId")
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      ADD CONSTRAINT "FK_seller_contracts_adminId"
      FOREIGN KEY ("adminId") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
    `);
  }
}
