import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Shipping, coupon, fee, and tax lines are order adjustments, not products. */
export class CreateOrderAdjustments1790000000039 implements MigrationInterface {
  name = 'CreateOrderAdjustments1790000000039';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`order_adjustments\` (
        \`id\` CHAR(26) NOT NULL, \`legacyId\` BIGINT NOT NULL, \`legacyTable\` VARCHAR(255) NOT NULL,
        \`orderId\` CHAR(26) NOT NULL, \`type\` VARCHAR(200) NOT NULL, \`name\` TEXT NOT NULL,
        \`subtotal\` DECIMAL(19,4) NULL, \`subtotalTax\` DECIMAL(19,4) NULL,
        \`total\` DECIMAL(19,4) NULL, \`totalTax\` DECIMAL(19,4) NULL, \`createdAt\` DATETIME NULL,
        PRIMARY KEY (\`id\`), UNIQUE INDEX \`UQ_order_adjustments_legacy_source\` (\`legacyTable\`, \`legacyId\`),
        INDEX \`IDX_order_adjustments_orderId\` (\`orderId\`),
        CONSTRAINT \`FK_order_adjustments_orderId\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `order_adjustments`');
  }
}
