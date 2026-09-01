import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameSellerContractAdminIdsToUserIds1756659600000
  implements MigrationInterface
{
  name = 'RenameSellerContractAdminIdsToUserIds1756659600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      RENAME COLUMN "adminIds" TO "userIds"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "seller_contracts"
      RENAME COLUMN "userIds" TO "adminIds"
    `);
  }
}
