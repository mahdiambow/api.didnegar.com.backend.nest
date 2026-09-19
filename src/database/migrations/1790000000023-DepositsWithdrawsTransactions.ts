import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Deposit = واریز (orderId اختیاری + userId)
 * Withdraw / Transaction جدا
 */
export class DepositsWithdrawsTransactions1790000000023
  implements MigrationInterface
{
  name = 'DepositsWithdrawsTransactions1790000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('deposits')) {
      const table = await queryRunner.getTable('deposits');

      // drop unique/FK on orderId if OneToOne leftover
      for (const fk of table?.foreignKeys ?? []) {
        if (fk.columnNames.includes('orderId')) {
          await queryRunner.query(
            `ALTER TABLE \`deposits\` DROP FOREIGN KEY \`${fk.name}\``,
          );
        }
      }
      for (const idx of table?.indices ?? []) {
        if (
          idx.isUnique &&
          idx.columnNames.length === 1 &&
          idx.columnNames[0] === 'orderId'
        ) {
          await queryRunner.query(
            `ALTER TABLE \`deposits\` DROP INDEX \`${idx.name}\``,
          );
        }
      }

      if (!table?.findColumnByName('userId')) {
        await queryRunner.query(`
          ALTER TABLE \`deposits\`
            ADD COLUMN \`userId\` VARCHAR(26) NULL AFTER \`id\`
        `);
        await queryRunner.query(`
          UPDATE \`deposits\` d
          INNER JOIN \`orders\` o ON o.\`id\` = d.\`orderId\`
          SET d.\`userId\` = o.\`userId\`
          WHERE d.\`userId\` IS NULL
        `);
        await queryRunner.query(`
          ALTER TABLE \`deposits\`
            MODIFY COLUMN \`userId\` VARCHAR(26) NOT NULL
        `);
        await queryRunner.query(`
          ALTER TABLE \`deposits\`
            ADD INDEX \`IDX_deposits_userId\` (\`userId\`),
            ADD CONSTRAINT \`FK_deposits_userId\`
              FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
              ON DELETE CASCADE ON UPDATE RESTRICT
        `);
      }

      await queryRunner.query(`
        ALTER TABLE \`deposits\`
          MODIFY COLUMN \`orderId\` VARCHAR(26) NULL
      `);
      await queryRunner.query(`
        ALTER TABLE \`deposits\`
          MODIFY COLUMN \`amount\` BIGINT NOT NULL
      `);

      try {
        await queryRunner.query(`
          ALTER TABLE \`deposits\`
            ADD INDEX \`IDX_deposits_orderId\` (\`orderId\`),
            ADD CONSTRAINT \`FK_deposits_orderId\`
              FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`)
              ON DELETE SET NULL ON UPDATE RESTRICT
        `);
      } catch {
        /* already exists */
      }
    }

    if (!(await queryRunner.hasTable('withdraws'))) {
      await queryRunner.query(`
        CREATE TABLE \`withdraws\` (
          \`id\` varchar(26) NOT NULL,
          \`userId\` varchar(26) NOT NULL,
          \`amount\` bigint NOT NULL,
          \`status\` varchar(20) NOT NULL DEFAULT 'pending',
          \`trackId\` varchar(100) NULL,
          \`description\` varchar(500) NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`IDX_withdraws_trackId\` (\`trackId\`),
          KEY \`IDX_withdraws_userId\` (\`userId\`),
          CONSTRAINT \`FK_withdraws_userId\`
            FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
            ON DELETE CASCADE ON UPDATE RESTRICT
        ) ENGINE=InnoDB
      `);
    }

    if (!(await queryRunner.hasTable('transactions'))) {
      await queryRunner.query(`
        CREATE TABLE \`transactions\` (
          \`id\` varchar(26) NOT NULL,
          \`userId\` varchar(26) NOT NULL,
          \`amount\` bigint NOT NULL,
          \`type\` varchar(20) NOT NULL,
          \`sourceType\` varchar(40) NOT NULL,
          \`sourceId\` varchar(26) NULL,
          \`state\` varchar(20) NOT NULL DEFAULT 'pending',
          \`userType\` varchar(20) NOT NULL DEFAULT 'user',
          \`orderId\` varchar(26) NULL,
          \`description\` varchar(500) NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          KEY \`IDX_transactions_userId\` (\`userId\`),
          KEY \`IDX_transactions_sourceId\` (\`sourceId\`),
          KEY \`IDX_transactions_orderId\` (\`orderId\`),
          CONSTRAINT \`FK_transactions_userId\`
            FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
            ON DELETE CASCADE ON UPDATE RESTRICT,
          CONSTRAINT \`FK_transactions_orderId\`
            FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`)
            ON DELETE SET NULL ON UPDATE RESTRICT
        ) ENGINE=InnoDB
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `transactions`');
    await queryRunner.query('DROP TABLE IF EXISTS `withdraws`');
  }
}
