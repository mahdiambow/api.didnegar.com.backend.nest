import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSellerContractAdminIdAndDates1756658000000
  implements MigrationInterface
{
  name = 'UpdateSellerContractAdminIdAndDates1756658000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('seller_contracts');
    if (!tableExists) {
      return;
    }

    const hasAdminName = await queryRunner.hasColumn(
      'seller_contracts',
      'adminName',
    );
    if (hasAdminName) {
      await queryRunner.query(`
        ALTER TABLE "seller_contracts" DROP COLUMN "adminName"
      `);
    }

    const hasAdminId = await queryRunner.hasColumn(
      'seller_contracts',
      'adminId',
    );
    if (!hasAdminId) {
      await queryRunner.query(`
        ALTER TABLE "seller_contracts" ADD COLUMN "adminId" uuid
      `);
    }

    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      ALTER COLUMN "contractDate" TYPE TIMESTAMP WITH TIME ZONE
      USING "contractDate"::timestamptz
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      ALTER COLUMN "createdAt" TYPE TIMESTAMP WITH TIME ZONE
      USING "createdAt"::timestamptz
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      ALTER COLUMN "updatedAt" TYPE TIMESTAMP WITH TIME ZONE
      USING "updatedAt"::timestamptz
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_seller_contracts_adminId'
        ) THEN
          ALTER TABLE "seller_contracts"
          ADD CONSTRAINT "FK_seller_contracts_adminId"
          FOREIGN KEY ("adminId") REFERENCES "users"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_seller_contracts_adminId"
      ON "seller_contracts" ("adminId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('seller_contracts'))) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "seller_contracts" DROP CONSTRAINT IF EXISTS "FK_seller_contracts_adminId"
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_contracts" DROP COLUMN IF EXISTS "adminId"
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      ADD COLUMN IF NOT EXISTS "adminName" character varying(150)
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      ALTER COLUMN "contractDate" TYPE date
      USING "contractDate"::date
    `);
  }
}
