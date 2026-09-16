import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CheckoutCreditAndOrderAddress1790000000016
  implements MigrationInterface
{
  name = 'CheckoutCreditAndOrderAddress1790000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const orders = await queryRunner.getTable('orders');
    if (orders && !orders.findColumnByName('addressId')) {
      await queryRunner.query(`
        ALTER TABLE \`orders\`
          ADD COLUMN \`addressId\` varchar(26) NULL AFTER \`userId\`
      `);
      await queryRunner.query(`
        ALTER TABLE \`orders\`
          ADD CONSTRAINT \`FK_orders_addressId\`
          FOREIGN KEY (\`addressId\`) REFERENCES \`user_addresses\`(\`id\`)
          ON DELETE SET NULL ON UPDATE RESTRICT
      `);
    }
    if (orders && !orders.findColumnByName('shippingMethodIds')) {
      await queryRunner.query(`
        ALTER TABLE \`orders\`
          ADD COLUMN \`shippingMethodIds\` json NULL AFTER \`shippingMethodId\`
      `);
    }

    if (!(await queryRunner.hasTable('user_credits'))) {
      await queryRunner.query(`
        CREATE TABLE \`user_credits\` (
          \`id\` varchar(26) NOT NULL,
          \`userId\` varchar(26) NOT NULL,
          \`amount\` decimal(19,4) NOT NULL DEFAULT 0,
          \`lockedAmount\` decimal(19,4) NOT NULL DEFAULT 0,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`UQ_user_credits_userId\` (\`userId\`),
          CONSTRAINT \`FK_user_credits_userId\`
            FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
            ON DELETE CASCADE ON UPDATE RESTRICT
        ) ENGINE=InnoDB
      `);
    }

    if (!(await queryRunner.hasTable('credit_logs'))) {
      await queryRunner.query(`
        CREATE TABLE \`credit_logs\` (
          \`id\` varchar(26) NOT NULL,
          \`userId\` varchar(26) NOT NULL,
          \`amount\` decimal(19,4) NOT NULL,
          \`sourceType\` varchar(20) NOT NULL,
          \`sourceId\` varchar(26) NULL,
          \`amountBefore\` decimal(19,4) NOT NULL,
          \`amountAfter\` decimal(19,4) NOT NULL,
          \`lockedBefore\` decimal(19,4) NOT NULL,
          \`lockedAfter\` decimal(19,4) NOT NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          KEY \`IDX_credit_logs_userId\` (\`userId\`),
          KEY \`IDX_credit_logs_sourceId\` (\`sourceId\`),
          CONSTRAINT \`FK_credit_logs_userId\`
            FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
            ON DELETE CASCADE ON UPDATE RESTRICT
        ) ENGINE=InnoDB
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `credit_logs`');
    await queryRunner.query('DROP TABLE IF EXISTS `credit_ledger`');
    await queryRunner.query('DROP TABLE IF EXISTS `user_credits`');

    const orders = await queryRunner.getTable('orders');
    if (orders?.findColumnByName('shippingMethodIds')) {
      await queryRunner.query(
        'ALTER TABLE `orders` DROP COLUMN `shippingMethodIds`',
      );
    }
    if (orders?.findColumnByName('addressId')) {
      await queryRunner.query(
        'ALTER TABLE `orders` DROP FOREIGN KEY `FK_orders_addressId`',
      );
      await queryRunner.query('ALTER TABLE `orders` DROP COLUMN `addressId`');
    }
  }
}
