import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * وضعیت‌های fulfillment سفارش:
 * processing (در حال پردازش) | left_warehouse (خروج از انبار) | shipped (ارسال شده)
 * paid قبلی → processing
 */
export class OrderFulfillmentStatuses1790000000044
  implements MigrationInterface
{
  name = 'OrderFulfillmentStatuses1790000000044';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('orders'))) return;

    await queryRunner.query(`
      UPDATE \`orders\`
      SET \`status\` = 'processing'
      WHERE \`status\` = 'paid'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('orders'))) return;

    await queryRunner.query(`
      UPDATE \`orders\`
      SET \`status\` = 'paid'
      WHERE \`status\` IN ('processing', 'left_warehouse', 'shipped')
    `);
  }
}
