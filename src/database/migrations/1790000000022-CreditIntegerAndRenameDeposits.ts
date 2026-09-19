import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - credit amounts: decimal → bigint (whole numbers)
 * - payments → deposits, authority → trackId
 */
export class CreditIntegerAndRenameDeposits1790000000022
  implements MigrationInterface
{
  name = 'CreditIntegerAndRenameDeposits1790000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('user_credits')) {
      await queryRunner.query(`
        ALTER TABLE \`user_credits\`
          MODIFY COLUMN \`amount\` BIGINT NOT NULL DEFAULT 0,
          MODIFY COLUMN \`lockedAmount\` BIGINT NOT NULL DEFAULT 0
      `);
    }

    if (await queryRunner.hasTable('credit_logs')) {
      await queryRunner.query(`
        ALTER TABLE \`credit_logs\`
          MODIFY COLUMN \`amount\` BIGINT NOT NULL,
          MODIFY COLUMN \`amountBefore\` BIGINT NOT NULL,
          MODIFY COLUMN \`amountAfter\` BIGINT NOT NULL,
          MODIFY COLUMN \`lockedBefore\` BIGINT NOT NULL,
          MODIFY COLUMN \`lockedAfter\` BIGINT NOT NULL
      `);
    }

    if (
      (await queryRunner.hasTable('payments')) &&
      !(await queryRunner.hasTable('deposits'))
    ) {
      await queryRunner.query(`
        RENAME TABLE \`payments\` TO \`deposits\`
      `);
    }

    if (await queryRunner.hasTable('deposits')) {
      const table = await queryRunner.getTable('deposits');
      if (table?.findColumnByName('authority') && !table.findColumnByName('trackId')) {
        await queryRunner.query(`
          ALTER TABLE \`deposits\`
            CHANGE COLUMN \`authority\` \`trackId\` VARCHAR(100) NOT NULL
        `);
      }

      // rename indexes / constraints if they still use payments_ prefix
      try {
        await queryRunner.query(
          'ALTER TABLE `deposits` RENAME INDEX `IDX_payments_authority` TO `IDX_deposits_trackId`',
        );
      } catch {
        /* already renamed or different name */
      }
      try {
        await queryRunner.query(
          'ALTER TABLE `deposits` RENAME INDEX `IDX_payments_orderId` TO `IDX_deposits_orderId`',
        );
      } catch {
        /* ignore */
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('deposits')) {
      const table = await queryRunner.getTable('deposits');
      if (table?.findColumnByName('trackId') && !table.findColumnByName('authority')) {
        await queryRunner.query(`
          ALTER TABLE \`deposits\`
            CHANGE COLUMN \`trackId\` \`authority\` VARCHAR(100) NOT NULL
        `);
      }
    }

    if (
      (await queryRunner.hasTable('deposits')) &&
      !(await queryRunner.hasTable('payments'))
    ) {
      await queryRunner.query(`RENAME TABLE \`deposits\` TO \`payments\``);
    }

    if (await queryRunner.hasTable('credit_logs')) {
      await queryRunner.query(`
        ALTER TABLE \`credit_logs\`
          MODIFY COLUMN \`amount\` DECIMAL(19,4) NOT NULL,
          MODIFY COLUMN \`amountBefore\` DECIMAL(19,4) NOT NULL,
          MODIFY COLUMN \`amountAfter\` DECIMAL(19,4) NOT NULL,
          MODIFY COLUMN \`lockedBefore\` DECIMAL(19,4) NOT NULL,
          MODIFY COLUMN \`lockedAfter\` DECIMAL(19,4) NOT NULL
      `);
    }

    if (await queryRunner.hasTable('user_credits')) {
      await queryRunner.query(`
        ALTER TABLE \`user_credits\`
          MODIFY COLUMN \`amount\` DECIMAL(19,4) NOT NULL DEFAULT 0,
          MODIFY COLUMN \`lockedAmount\` DECIMAL(19,4) NOT NULL DEFAULT 0
      `);
    }
  }
}
