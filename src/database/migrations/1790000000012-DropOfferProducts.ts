import type { MigrationInterface, QueryRunner } from 'typeorm';

/** حذف ماژول اضافی offer-products — تأیید از مسیر seller-offers */
export class DropOfferProducts1790000000012 implements MigrationInterface {
  name = 'DropOfferProducts1790000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryRunner.query('DROP TABLE IF EXISTS `offer_products`');
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`offer_products\` (
        \`id\` CHAR(26) NOT NULL,
        \`sellerId\` CHAR(26) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`slug\` VARCHAR(200) NOT NULL,
        \`description\` TEXT NULL,
        \`shortDescription\` TEXT NULL,
        \`brandId\` CHAR(26) NULL,
        \`categoryIds\` JSON NOT NULL DEFAULT ('[]'),
        \`attributes\` JSON NOT NULL DEFAULT ('{}'),
        \`isVirtual\` TINYINT(1) NOT NULL DEFAULT 0,
        \`isDownloadable\` TINYINT(1) NOT NULL DEFAULT 0,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`taxStatus\` VARCHAR(50) NULL,
        \`taxClass\` VARCHAR(100) NULL,
        \`weight\` DECIMAL(10,2) NULL,
        \`length\` DECIMAL(10,2) NULL,
        \`width\` DECIMAL(10,2) NULL,
        \`height\` DECIMAL(10,2) NULL,
        \`sku\` VARCHAR(100) NOT NULL,
        \`price\` DECIMAL(19,4) NOT NULL,
        \`stock\` INT NOT NULL DEFAULT 0,
        \`stockStatus\` VARCHAR(50) NOT NULL DEFAULT 'outofstock',
        \`isOnSale\` TINYINT(1) NOT NULL DEFAULT 0,
        \`approvalStatus\` VARCHAR(20) NOT NULL DEFAULT 'pending',
        \`rejectionReason\` TEXT NULL,
        \`productId\` CHAR(26) NULL,
        \`offerId\` CHAR(26) NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_offer_products\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_offer_products_sellerId\` (\`sellerId\`),
        INDEX \`IDX_offer_products_approvalStatus\` (\`approvalStatus\`),
        UNIQUE INDEX \`IDX_offer_products_slug\` (\`slug\`),
        CONSTRAINT \`CHK_offer_product_price\` CHECK (\`price\` >= 0),
        CONSTRAINT \`CHK_offer_product_stock\` CHECK (\`stock\` >= 0),
        CONSTRAINT \`FK_offer_products_sellerId\` FOREIGN KEY (\`sellerId\`) REFERENCES \`sellers\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_offer_products_productId\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT,
        CONSTRAINT \`FK_offer_products_offerId\` FOREIGN KEY (\`offerId\`) REFERENCES \`seller_offers\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);
  }
}
