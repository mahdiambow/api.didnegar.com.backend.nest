import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * مبلغ اعتبار استفاده‌شده در پرداخت ترکیبی (partial-bank).
 * deposit.amount = مبلغ درگاه؛ creditApplied = مبلغ قفل‌شده از کیف پول.
 */
export class DepositCreditApplied1790000000033 implements MigrationInterface {
  name = 'DepositCreditApplied1790000000033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('deposits'))) return;
    const table = await queryRunner.getTable('deposits');
    if (table?.findColumnByName('creditApplied')) return;

    await queryRunner.query(`
      ALTER TABLE \`deposits\`
        ADD COLUMN \`creditApplied\` BIGINT NOT NULL DEFAULT 0
        AFTER \`amount\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('deposits'))) return;
    const table = await queryRunner.getTable('deposits');
    if (!table?.findColumnByName('creditApplied')) return;

    await queryRunner.query(
      'ALTER TABLE `deposits` DROP COLUMN `creditApplied`',
    );
  }
}
