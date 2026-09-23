import type { MigrationInterface, QueryRunner } from 'typeorm';

/** تمایز سفارش کاربر آنلاین و سفارش تلفنی مشتری (Customer) */
export class AddOrderTypeAndEnsureCustomerId1790000000043
  implements MigrationInterface
{
  name = 'AddOrderTypeAndEnsureCustomerId1790000000043';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
        ADD COLUMN \`type\` VARCHAR(20) NOT NULL DEFAULT 'user' AFTER \`status\`,
        ADD INDEX \`IDX_orders_type\` (\`type\`)
    `);

    await queryRunner.query(`
      UPDATE \`orders\`
      SET \`type\` = 'customer'
      WHERE \`customerId\` IS NOT NULL AND (\`userId\` IS NULL OR \`userId\` = '')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`orders\`
        DROP INDEX \`IDX_orders_type\`,
        DROP COLUMN \`type\`
    `);
  }
}
