import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ثبت استفاده پروموشن برای سفارش تلفنی (customer) —
 * userId اختیاری می‌شود و customerId اضافه می‌گردد.
 */
export class PromotionUsageCustomerId1790000000051
  implements MigrationInterface
{
  name = 'PromotionUsageCustomerId1790000000051';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('promotion_usages'))) return;
    const table = await queryRunner.getTable('promotion_usages');
    if (!table) return;

    if (!table.findColumnByName('customerId')) {
      await queryRunner.query(`
        ALTER TABLE \`promotion_usages\`
          ADD COLUMN \`customerId\` CHAR(26) NULL AFTER \`userId\`,
          ADD INDEX \`IDX_promotion_usages_customerId\` (\`customerId\`),
          ADD INDEX \`IDX_promotion_usages_promo_customer\` (\`promotionId\`, \`customerId\`)
      `);

      if (await queryRunner.hasTable('customers')) {
        await queryRunner.query(`
          ALTER TABLE \`promotion_usages\`
            ADD CONSTRAINT \`FK_promotion_usages_customerId\`
            FOREIGN KEY (\`customerId\`) REFERENCES \`customers\`(\`id\`)
            ON DELETE CASCADE ON UPDATE RESTRICT
        `);
      }
    }

    const userFk = table.foreignKeys.find((f) =>
      f.columnNames.includes('userId'),
    );
    if (userFk) {
      await queryRunner.query(
        `ALTER TABLE \`promotion_usages\` DROP FOREIGN KEY \`${userFk.name}\``,
      );
    }

    await queryRunner.query(`
      ALTER TABLE \`promotion_usages\`
        MODIFY COLUMN \`userId\` CHAR(26) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`promotion_usages\`
        ADD CONSTRAINT \`FK_promotion_usages_userId\`
        FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
        ON DELETE CASCADE ON UPDATE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('promotion_usages'))) return;
    const table = await queryRunner.getTable('promotion_usages');
    if (!table) return;

    if (table.findColumnByName('customerId')) {
      const custFk = table.foreignKeys.find((f) =>
        f.columnNames.includes('customerId'),
      );
      if (custFk) {
        await queryRunner.query(
          `ALTER TABLE \`promotion_usages\` DROP FOREIGN KEY \`${custFk.name}\``,
        );
      }
      await queryRunner.query(`
        ALTER TABLE \`promotion_usages\`
          DROP INDEX \`IDX_promotion_usages_promo_customer\`,
          DROP INDEX \`IDX_promotion_usages_customerId\`,
          DROP COLUMN \`customerId\`
      `);
    }

    // برگشت userId به NOT NULL فقط اگر ردیف بدون userId نباشد
    await queryRunner.query(`
      DELETE FROM \`promotion_usages\` WHERE \`userId\` IS NULL
    `);

    const userFk = (await queryRunner.getTable('promotion_usages'))?.foreignKeys.find(
      (f) => f.columnNames.includes('userId'),
    );
    if (userFk) {
      await queryRunner.query(
        `ALTER TABLE \`promotion_usages\` DROP FOREIGN KEY \`${userFk.name}\``,
      );
    }
    await queryRunner.query(`
      ALTER TABLE \`promotion_usages\`
        MODIFY COLUMN \`userId\` CHAR(26) NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`promotion_usages\`
        ADD CONSTRAINT \`FK_promotion_usages_userId\`
        FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
        ON DELETE CASCADE ON UPDATE RESTRICT
    `);
  }
}
