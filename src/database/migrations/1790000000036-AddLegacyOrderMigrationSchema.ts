import type { MigrationInterface, QueryRunner } from 'typeorm';

type RefColumn = {
  COLUMN_TYPE: string;
  CHARACTER_SET_NAME: string | null;
  COLLATION_NAME: string | null;
};

/** Schema required to retain legacy order headers, snapshots, items and options. */
export class AddLegacyOrderMigrationSchema1790000000036 implements MigrationInterface {
  name = 'AddLegacyOrderMigrationSchema1790000000036';

  private referenceType(column: RefColumn): string {
    return `${column.COLUMN_TYPE}${
      column.CHARACTER_SET_NAME
        ? ` CHARACTER SET ${column.CHARACTER_SET_NAME} COLLATE ${column.COLLATION_NAME}`
        : ''
    }`;
  }

  private async loadRef(
    queryRunner: QueryRunner,
    table: string,
  ): Promise<RefColumn> {
    const [column] = await queryRunner.query(`
      SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = '${table}'
        AND COLUMN_NAME = 'id'
    `);
    if (!column) {
      throw new Error(`Cannot resolve ${table}.id definition.`);
    }
    return column;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const orders = await queryRunner.getTable('orders');
    const orderColumns: Array<[string, string]> = [
      ['legacyId', 'ADD COLUMN `legacyId` BIGINT NULL AFTER `id`'],
      ['legacyTable', 'ADD COLUMN `legacyTable` VARCHAR(255) NULL AFTER `legacyId`'],
      ['customerId', 'ADD COLUMN `customerId` CHAR(26) NULL AFTER `userId`'],
      ['legacyStatus', 'ADD COLUMN `legacyStatus` VARCHAR(50) NULL AFTER `status`'],
      [
        'taxTotal',
        'ADD COLUMN `taxTotal` DECIMAL(19,4) NOT NULL DEFAULT 0 AFTER `shippingAmount`',
      ],
      ['currency', 'ADD COLUMN `currency` VARCHAR(10) NULL AFTER `taxTotal`'],
      [
        'paymentMethod',
        'ADD COLUMN `paymentMethod` VARCHAR(100) NULL AFTER `currency`',
      ],
      [
        'paymentMethodTitle',
        'ADD COLUMN `paymentMethodTitle` VARCHAR(255) NULL AFTER `paymentMethod`',
      ],
      [
        'transactionId',
        'ADD COLUMN `transactionId` VARCHAR(255) NULL AFTER `paymentMethodTitle`',
      ],
      [
        'customerNote',
        'ADD COLUMN `customerNote` TEXT NULL AFTER `transactionId`',
      ],
      ['placedAt', 'ADD COLUMN `placedAt` DATETIME NULL AFTER `customerNote`'],
      ['paidAt', 'ADD COLUMN `paidAt` DATETIME NULL AFTER `placedAt`'],
      ['completedAt', 'ADD COLUMN `completedAt` DATETIME NULL AFTER `paidAt`'],
    ];

    for (const [column, sql] of orderColumns) {
      if (!orders?.findColumnByName(column)) {
        await queryRunner.query(`ALTER TABLE \`orders\` ${sql}`);
      }
    }

    const ordersAfter = await queryRunner.getTable('orders');
    if (
      !ordersAfter?.indices.some((index) => index.name === 'UQ_orders_legacy_source')
    ) {
      await queryRunner.query(
        'ALTER TABLE `orders` ADD UNIQUE INDEX `UQ_orders_legacy_source` (`legacyTable`, `legacyId`)',
      );
    }
    if (
      !ordersAfter?.indices.some((index) => index.name === 'IDX_orders_customerId')
    ) {
      await queryRunner.query(
        'ALTER TABLE `orders` ADD INDEX `IDX_orders_customerId` (`customerId`)',
      );
    }
    if (
      !ordersAfter?.foreignKeys.some(
        (fk) => fk.name === 'FK_orders_customerId',
      )
    ) {
      await queryRunner.query(
        'ALTER TABLE `orders` ADD CONSTRAINT `FK_orders_customerId` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT',
      );
    }

    const orderItems = await queryRunner.getTable('order_items');
    const orderItemColumns: Array<[string, string]> = [
      ['legacyId', 'ADD COLUMN `legacyId` BIGINT NULL AFTER `id`'],
      ['legacyTable', 'ADD COLUMN `legacyTable` VARCHAR(255) NULL AFTER `legacyId`'],
      ['name', 'ADD COLUMN `name` TEXT NULL AFTER `legacyTable`'],
      ['type', 'ADD COLUMN `type` VARCHAR(200) NULL AFTER `name`'],
      ['subtotal', 'ADD COLUMN `subtotal` DECIMAL(19,4) NULL AFTER `unitPrice`'],
      ['subtotalTax', 'ADD COLUMN `subtotalTax` DECIMAL(19,4) NULL AFTER `subtotal`'],
      ['total', 'ADD COLUMN `total` DECIMAL(19,4) NULL AFTER `subtotalTax`'],
      ['totalTax', 'ADD COLUMN `totalTax` DECIMAL(19,4) NULL AFTER `total`'],
      ['createdAt', 'ADD COLUMN `createdAt` DATETIME NULL AFTER `totalTax`'],
    ];

    for (const [column, sql] of orderItemColumns) {
      if (!orderItems?.findColumnByName(column)) {
        await queryRunner.query(`ALTER TABLE \`order_items\` ${sql}`);
      }
    }

    const orderItemsAfter = await queryRunner.getTable('order_items');
    if (
      !orderItemsAfter?.indices.some(
        (index) => index.name === 'UQ_order_items_legacy_source',
      )
    ) {
      await queryRunner.query(
        'ALTER TABLE `order_items` ADD UNIQUE INDEX `UQ_order_items_legacy_source` (`legacyTable`, `legacyId`)',
      );
    }

    const orderId = await this.loadRef(queryRunner, 'orders');
    const addressId = await this.loadRef(queryRunner, 'user_addresses');
    const orderItemId = await this.loadRef(queryRunner, 'order_items');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`order_addresses\` (
        \`id\` CHAR(26) NOT NULL,
        \`orderId\` ${this.referenceType(orderId)} NOT NULL,
        \`addressId\` ${this.referenceType(addressId)} NULL,
        \`type\` VARCHAR(20) NOT NULL,
        \`firstName\` TEXT NULL, \`lastName\` TEXT NULL, \`company\` TEXT NULL,
        \`address1\` TEXT NULL, \`address2\` TEXT NULL, \`city\` TEXT NULL,
        \`state\` TEXT NULL, \`postalCode\` VARCHAR(20) NULL, \`country\` TEXT NULL,
        \`email\` TEXT NULL, \`phone\` TEXT NULL,
        \`createdAt\` DATETIME NULL, \`updatedAt\` DATETIME NULL,
        PRIMARY KEY (\`id\`), INDEX \`IDX_order_addresses_orderId\` (\`orderId\`),
        CONSTRAINT \`FK_order_addresses_orderId\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT \`FK_order_addresses_addressId\` FOREIGN KEY (\`addressId\`) REFERENCES \`user_addresses\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`order_item_options\` (
        \`id\` CHAR(26) NOT NULL, \`legacyId\` BIGINT NOT NULL, \`legacyTable\` VARCHAR(255) NOT NULL,
        \`orderItemId\` ${this.referenceType(orderItemId)} NOT NULL, \`name\` VARCHAR(255) NOT NULL, \`value\` LONGTEXT NULL,
        \`createdAt\` DATETIME NULL, \`updatedAt\` DATETIME NULL,
        PRIMARY KEY (\`id\`), UNIQUE INDEX \`UQ_order_item_options_legacy_source\` (\`legacyTable\`, \`legacyId\`),
        INDEX \`IDX_order_item_options_itemId\` (\`orderItemId\`),
        CONSTRAINT \`FK_order_item_options_itemId\` FOREIGN KEY (\`orderItemId\`) REFERENCES \`order_items\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
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
