import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migrates older credit schema (balance + credit_ledger) to
 * amount/lockedAmount + credit_logs with sourceType in|out|lock|unlock.
 */
export class RefactorCreditLockedAndLog1790000000021
  implements MigrationInterface
{
  name = 'RefactorCreditLockedAndLog1790000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('user_credits')) {
      const table = await queryRunner.getTable('user_credits');
      if (table?.findColumnByName('balance') && !table.findColumnByName('amount')) {
        await queryRunner.query(`
          ALTER TABLE \`user_credits\`
            CHANGE COLUMN \`balance\` \`amount\` decimal(19,4) NOT NULL DEFAULT 0
        `);
      }
      if (table && !table.findColumnByName('lockedAmount')) {
        await queryRunner.query(`
          ALTER TABLE \`user_credits\`
            ADD COLUMN \`lockedAmount\` decimal(19,4) NOT NULL DEFAULT 0 AFTER \`amount\`
        `);
      }
    }

    if (
      (await queryRunner.hasTable('credit_ledger')) &&
      !(await queryRunner.hasTable('credit_logs'))
    ) {
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

      await queryRunner.query(`
        INSERT INTO \`credit_logs\`
          (\`id\`, \`userId\`, \`amount\`, \`sourceType\`, \`sourceId\`,
           \`amountBefore\`, \`amountAfter\`, \`lockedBefore\`, \`lockedAfter\`, \`createdAt\`)
        SELECT
          \`id\`,
          \`userId\`,
          \`amount\`,
          CASE WHEN \`type\` = 'deposit' THEN 'in' ELSE 'out' END,
          COALESCE(\`paymentId\`, \`orderId\`),
          CASE
            WHEN \`type\` = 'deposit' THEN \`balanceAfter\` - \`amount\`
            ELSE \`balanceAfter\` + \`amount\`
          END,
          \`balanceAfter\`,
          0,
          0,
          \`createdAt\`
        FROM \`credit_ledger\`
      `);

      await queryRunner.query('DROP TABLE IF EXISTS `credit_ledger`');
    } else if (!(await queryRunner.hasTable('credit_logs'))) {
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
    } else if (await queryRunner.hasTable('credit_ledger')) {
      await queryRunner.query('DROP TABLE IF EXISTS `credit_ledger`');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (
      (await queryRunner.hasTable('credit_logs')) &&
      !(await queryRunner.hasTable('credit_ledger'))
    ) {
      await queryRunner.query(`
        CREATE TABLE \`credit_ledger\` (
          \`id\` varchar(26) NOT NULL,
          \`userId\` varchar(26) NOT NULL,
          \`amount\` decimal(19,4) NOT NULL,
          \`type\` varchar(20) NOT NULL,
          \`reason\` varchar(100) NOT NULL,
          \`orderId\` varchar(26) NULL,
          \`paymentId\` varchar(26) NULL,
          \`balanceAfter\` decimal(19,4) NOT NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          KEY \`IDX_credit_ledger_userId\` (\`userId\`),
          KEY \`IDX_credit_ledger_orderId\` (\`orderId\`),
          KEY \`IDX_credit_ledger_paymentId\` (\`paymentId\`),
          CONSTRAINT \`FK_credit_ledger_userId\`
            FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
            ON DELETE CASCADE ON UPDATE RESTRICT
        ) ENGINE=InnoDB
      `);

      await queryRunner.query(`
        INSERT INTO \`credit_ledger\`
          (\`id\`, \`userId\`, \`amount\`, \`type\`, \`reason\`, \`orderId\`, \`paymentId\`, \`balanceAfter\`, \`createdAt\`)
        SELECT
          \`id\`,
          \`userId\`,
          \`amount\`,
          CASE WHEN \`sourceType\` = 'in' THEN 'deposit' ELSE 'charge' END,
          \`sourceType\`,
          NULL,
          \`sourceId\`,
          \`amountAfter\`,
          \`createdAt\`
        FROM \`credit_logs\`
        WHERE \`sourceType\` IN ('in', 'out')
      `);

      await queryRunner.query('DROP TABLE IF EXISTS `credit_logs`');
    }

    if (await queryRunner.hasTable('user_credits')) {
      const table = await queryRunner.getTable('user_credits');
      if (table?.findColumnByName('lockedAmount')) {
        await queryRunner.query(
          'ALTER TABLE `user_credits` DROP COLUMN `lockedAmount`',
        );
      }
      if (table?.findColumnByName('amount') && !table.findColumnByName('balance')) {
        await queryRunner.query(`
          ALTER TABLE \`user_credits\`
            CHANGE COLUMN \`amount\` \`balance\` decimal(19,4) NOT NULL DEFAULT 0
        `);
      }
    }
  }
}
