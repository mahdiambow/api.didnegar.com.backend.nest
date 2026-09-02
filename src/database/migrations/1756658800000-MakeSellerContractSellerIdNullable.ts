import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeSellerContractSellerIdNullable1756658800000
  implements MigrationInterface
{
  name = 'MakeSellerContractSellerIdNullable1756658800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      ALTER COLUMN "sellerId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "seller_contracts"
      WHERE "sellerId" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      ALTER COLUMN "sellerId" SET NOT NULL
    `);
  }
}
