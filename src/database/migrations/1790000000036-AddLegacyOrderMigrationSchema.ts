import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Schema required to retain legacy order headers, snapshots, items and options. */
export class AddLegacyOrderMigrationSchema1790000000036 implements MigrationInterface {
  name = 'AddLegacyOrderMigrationSchema1790000000036';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
        ADD COLUMN \`legacyId\` BIGINT NULL AFTER \`id\`,
        ADD COLUMN \`legacyTable\` VARCHAR(255) NULL AFTER \`legacyId\`,
        ADD COLUMN \`customerId\` CHAR(26) NULL AFTER \`userId\`,
        ADD COLUMN \`legacyStatus\` VARCHAR(50) NULL AFTER \`status\`,
        ADD COLUMN \`taxTotal\` DECIMAL(19,4) NOT NULL DEFAULT 0 AFTER \`shippingAmount\`,
        ADD COLUMN \`currency\` VARCHAR(10) NULL AFTER \`taxTotal\`,
        ADD COLUMN \`paymentMethod\` VARCHAR(100) NULL AFTER \`currency\`,
        ADD COLUMN \`paymentMethodTitle\` VARCHAR(255) NULL AFTER \`paymentMethod\`,
        ADD COLUMN \`transactionId\` VARCHAR(255) NULL AFTER \`paymentMethodTitle\`,
        ADD COLUMN \`customerNote\` TEXT NULL AFTER \`transactionId\`,
        ADD COLUMN \`placedAt\` DATETIME NULL AFTER \`customerNote\`,
        ADD COLUMN \`paidAt\` DATETIME NULL AFTER \`placedAt\`,
        ADD COLUMN \`completedAt\` DATETIME NULL AFTER \`paidAt\`,
        ADD UNIQUE INDEX \`UQ_orders_legacy_source\` (\`legacyTable\`, \`legacyId\`),
        ADD INDEX \`IDX_orders_customerId\` (\`customerId\`),
        ADD CONSTRAINT \`FK_orders_customerId\` FOREIGN KEY (\`customerId\`) REFERENCES \`customers\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE \`order_items\`
        ADD COLUMN \`legacyId\` BIGINT NULL AFTER \`id\`,
        ADD COLUMN \`legacyTable\` VARCHAR(255) NULL AFTER \`legacyId\`,
        ADD COLUMN \`name\` TEXT NULL AFTER \`legacyTable\`,
        ADD COLUMN \`type\` VARCHAR(200) NULL AFTER \`name\`,
        ADD COLUMN \`subtotal\` DECIMAL(19,4) NULL AFTER \`unitPrice\`,
        ADD COLUMN \`subtotalTax\` DECIMAL(19,4) NULL AFTER \`subtotal\`,
        ADD COLUMN \`total\` DECIMAL(19,4) NULL AFTER \`subtotalTax\`,
        ADD COLUMN \`totalTax\` DECIMAL(19,4) NULL AFTER \`total\`,
        ADD COLUMN \`createdAt\` DATETIME NULL AFTER \`totalTax\`,
        ADD UNIQUE INDEX \`UQ_order_items_legacy_source\` (\`legacyTable\`, \`legacyId\`)
    `);
    await queryRunner.query(`
      CREATE TABLE \`order_addresses\` (
        \`id\` CHAR(26) NOT NULL,
        \`orderId\` CHAR(26) NOT NULL,
        \`addressId\` CHAR(26) NULL,
        \`type\` VARCHAR(20) NOT NULL,
        \`firstName\` TEXT NULL, \`lastName\` TEXT NULL, \`company\` TEXT NULL,
        \`address1\` TEXT NULL, \`address2\` TEXT NULL, \`city\` TEXT NULL,
        \`state\` TEXT NULL, \`postalCode\` VARCHAR(20) NULL, \`country\` TEXT NULL,
        \`email\` TEXT NULL, \`phone\` TEXT NULL,
        \`createdAt\` DATETIME NULL, \`updatedAt\` DATETIME NULL,
        PRIMARY KEY (\`id\`), INDEX \`IDX_order_addresses_orderId\` (\`orderId\`),
        CONSTRAINT \`FK_order_addresses_orderId\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT \`FK_order_addresses_addressId\` FOREIGN KEY (\`addressId\`) REFERENCES \`user_addresses\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await queryRunner.query(`
      CREATE TABLE \`order_item_options\` (
        \`id\` CHAR(26) NOT NULL, \`legacyId\` BIGINT NOT NULL, \`legacyTable\` VARCHAR(255) NOT NULL,
        \`orderItemId\` CHAR(26) NOT NULL, \`name\` VARCHAR(255) NOT NULL, \`value\` LONGTEXT NULL,
        \`createdAt\` DATETIME NULL, \`updatedAt\` DATETIME NULL,
        PRIMARY KEY (\`id\`), UNIQUE INDEX \`UQ_order_item_options_legacy_source\` (\`legacyTable\`, \`legacyId\`),
        INDEX \`IDX_order_item_options_itemId\` (\`orderItemId\`),
        CONSTRAINT \`FK_order_item_options_itemId\` FOREIGN KEY (\`orderItemId\`) REFERENCES \`order_items\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `order_item_options`');
    await queryRunner.query('DROP TABLE IF EXISTS `order_addresses`');
    throw new Error(
      'Reverting legacy order columns is intentionally unsupported after import.',
    );
  }
}
