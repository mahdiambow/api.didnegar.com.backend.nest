import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePromotions1790000000046 implements MigrationInterface {
  name = 'CreatePromotions1790000000046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`promotions\` (
        \`id\` CHAR(26) NOT NULL,
        \`name\` VARCHAR(200) NOT NULL,
        \`description\` TEXT NULL,
        \`code\` VARCHAR(64) NULL,
        \`discountType\` VARCHAR(20) NOT NULL,
        \`discountValue\` DECIMAL(19,4) NOT NULL,
        \`discountPrice\` DECIMAL(19,4) NULL,
        \`discountStartAt\` DATETIME NULL,
        \`discountEndAt\` DATETIME NULL,
        \`minOrderAmount\` DECIMAL(19,4) NULL,
        \`maxDiscountAmount\` DECIMAL(19,4) NULL,
        \`isActive\` TINYINT NOT NULL DEFAULT 1,
        \`usageLimit\` INT NULL,
        \`usedCount\` INT NOT NULL DEFAULT 0,
        \`usageLimitPerUser\` INT NULL,
        \`maxDiscountAmountPerUser\` DECIMAL(19,4) NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_promotions_code\` (\`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`promotion_usages\` (
        \`id\` CHAR(26) NOT NULL,
        \`promotionId\` CHAR(26) NOT NULL,
        \`userId\` CHAR(26) NOT NULL,
        \`orderId\` CHAR(26) NULL,
        \`discountAmount\` DECIMAL(19,4) NOT NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_promotion_usages_promotionId\` (\`promotionId\`),
        INDEX \`IDX_promotion_usages_userId\` (\`userId\`),
        INDEX \`IDX_promotion_usages_promo_user\` (\`promotionId\`, \`userId\`),
        CONSTRAINT \`FK_promotion_usages_promotionId\`
          FOREIGN KEY (\`promotionId\`) REFERENCES \`promotions\`(\`id\`)
          ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT \`FK_promotion_usages_userId\`
          FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT \`FK_promotion_usages_orderId\`
          FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`)
          ON DELETE SET NULL ON UPDATE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    if (await queryRunner.hasTable('orders')) {
      const table = await queryRunner.getTable('orders');
      if (!table?.findColumnByName('discountAmount')) {
        await queryRunner.query(`
          ALTER TABLE \`orders\`
            ADD COLUMN \`discountAmount\` DECIMAL(19,4) NOT NULL DEFAULT 0 AFTER \`amount\`
        `);
      }
      if (!table?.findColumnByName('promotionId')) {
        await queryRunner.query(`
          ALTER TABLE \`orders\`
            ADD COLUMN \`promotionId\` CHAR(26) NULL AFTER \`discountAmount\`,
            ADD INDEX \`IDX_orders_promotionId\` (\`promotionId\`),
            ADD CONSTRAINT \`FK_orders_promotionId\`
              FOREIGN KEY (\`promotionId\`) REFERENCES \`promotions\`(\`id\`)
              ON DELETE SET NULL ON UPDATE RESTRICT
        `);
      }
    }

    // پرمیشن‌های promotions روی نقش سیستمی super-admin
    for (const permission of [
      'promotions:read',
      'promotions:create',
      'promotions:update',
      'promotions:delete',
    ]) {
      await queryRunner.query(
        `
        UPDATE \`roles\`
        SET \`permissions\` = JSON_ARRAY_APPEND(\`permissions\`, '$', ?)
        WHERE \`slug\` = 'super-admin'
          AND \`sellerId\` IS NULL
          AND NOT JSON_CONTAINS(\`permissions\`, JSON_QUOTE(?), '$')
        `,
        [permission, permission],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('orders')) {
      const table = await queryRunner.getTable('orders');
      if (table?.findColumnByName('promotionId')) {
        await queryRunner.query(`
          ALTER TABLE \`orders\`
            DROP FOREIGN KEY \`FK_orders_promotionId\`,
            DROP INDEX \`IDX_orders_promotionId\`,
            DROP COLUMN \`promotionId\`
        `);
      }
      if (table?.findColumnByName('discountAmount')) {
        await queryRunner.query(`
          ALTER TABLE \`orders\` DROP COLUMN \`discountAmount\`
        `);
      }
    }

    await queryRunner.query('DROP TABLE IF EXISTS `promotion_usages`');
    await queryRunner.query('DROP TABLE IF EXISTS `promotions`');
  }
}
