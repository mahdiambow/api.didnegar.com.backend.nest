import type { MigrationInterface, QueryRunner } from 'typeorm';

/** مشتری همکار + قیمت خرید/فروش روی سفارش تلفنی */
export class CustomerHamkarAndOrderPrices1790000000052
  implements MigrationInterface
{
  name = 'CustomerHamkarAndOrderPrices1790000000052';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('customers')) {
      const customers = await queryRunner.getTable('customers');
      if (!customers?.findColumnByName('isHamkar')) {
        await queryRunner.query(`
          ALTER TABLE \`customers\`
            ADD COLUMN \`isHamkar\` TINYINT NOT NULL DEFAULT 0 AFTER \`phone\`
        `);
      }
    }

    if (await queryRunner.hasTable('orders')) {
      const orders = await queryRunner.getTable('orders');
      if (!orders?.findColumnByName('purchasePrice')) {
        await queryRunner.query(`
          ALTER TABLE \`orders\`
            ADD COLUMN \`purchasePrice\` DECIMAL(19,4) NULL AFTER \`discountAmount\`,
            ADD COLUMN \`salePrice\` DECIMAL(19,4) NULL AFTER \`purchasePrice\`
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('orders')) {
      const orders = await queryRunner.getTable('orders');
      if (orders?.findColumnByName('purchasePrice')) {
        await queryRunner.query(`
          ALTER TABLE \`orders\`
            DROP COLUMN \`salePrice\`,
            DROP COLUMN \`purchasePrice\`
        `);
      }
    }
    if (await queryRunner.hasTable('customers')) {
      const customers = await queryRunner.getTable('customers');
      if (customers?.findColumnByName('isHamkar')) {
        await queryRunner.query(`
          ALTER TABLE \`customers\` DROP COLUMN \`isHamkar\`
        `);
      }
    }
  }
}
