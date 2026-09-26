import type { MigrationInterface, QueryRunner } from 'typeorm';

/** مبلغ تخفیف سفارش — برای آبجکت price در پاسخ */
export class AddOrderDiscountAmount1790000000046
  implements MigrationInterface
{
  name = 'AddOrderDiscountAmount1790000000046';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('orders'))) return;
    const table = await queryRunner.getTable('orders');
    if (table?.findColumnByName('discountAmount')) return;

    await queryRunner.query(`
      ALTER TABLE \`orders\`
        ADD COLUMN \`discountAmount\` DECIMAL(19,4) NOT NULL DEFAULT 0
        AFTER \`amount\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('orders'))) return;
    const table = await queryRunner.getTable('orders');
    if (!table?.findColumnByName('discountAmount')) return;

    await queryRunner.query(`
      ALTER TABLE \`orders\` DROP COLUMN \`discountAmount\`
    `);
  }
}
