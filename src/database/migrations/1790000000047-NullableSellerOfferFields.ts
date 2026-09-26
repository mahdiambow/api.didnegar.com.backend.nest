import type { MigrationInterface, QueryRunner } from 'typeorm';

/** فیلدهای اختیاری seller_offers — هم‌تراز DTO */
export class NullableSellerOfferFields1790000000047
  implements MigrationInterface
{
  name = 'NullableSellerOfferFields1790000000047';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('seller_offers'))) return;

    await queryRunner.query(`
      ALTER TABLE \`seller_offers\`
        MODIFY \`price\` DECIMAL(19,4) NULL DEFAULT 0,
        MODIFY \`stock\` INT NULL DEFAULT 0,
        MODIFY \`stockStatus\` VARCHAR(50) NULL DEFAULT 'outofstock',
        MODIFY \`isVirtual\` TINYINT(1) NULL DEFAULT 0,
        MODIFY \`isDownloadable\` TINYINT(1) NULL DEFAULT 0,
        MODIFY \`isOnSale\` TINYINT(1) NULL DEFAULT 0,
        MODIFY \`isActive\` TINYINT(1) NULL DEFAULT 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('seller_offers'))) return;

    await queryRunner.query(`
      UPDATE \`seller_offers\`
      SET
        \`price\` = COALESCE(\`price\`, 0),
        \`stock\` = COALESCE(\`stock\`, 0),
        \`stockStatus\` = COALESCE(\`stockStatus\`, 'outofstock'),
        \`isVirtual\` = COALESCE(\`isVirtual\`, 0),
        \`isDownloadable\` = COALESCE(\`isDownloadable\`, 0),
        \`isOnSale\` = COALESCE(\`isOnSale\`, 0),
        \`isActive\` = COALESCE(\`isActive\`, 1)
    `);

    await queryRunner.query(`
      ALTER TABLE \`seller_offers\`
        MODIFY \`price\` DECIMAL(19,4) NOT NULL,
        MODIFY \`stock\` INT NOT NULL DEFAULT 0,
        MODIFY \`stockStatus\` VARCHAR(50) NOT NULL DEFAULT 'outofstock',
        MODIFY \`isVirtual\` TINYINT(1) NOT NULL DEFAULT 0,
        MODIFY \`isDownloadable\` TINYINT(1) NOT NULL DEFAULT 0,
        MODIFY \`isOnSale\` TINYINT(1) NOT NULL DEFAULT 0,
        MODIFY \`isActive\` TINYINT(1) NOT NULL DEFAULT 1
    `);
  }
}
