import type { MigrationInterface, QueryRunner } from 'typeorm';

const CUSTOMER_PERMISSIONS = [
  'customers:read',
  'customers:create',
  'customers:update',
  'customers:delete',
] as const;

/**
 * سفارش تلفنی: پرمیشن customers:* روی نقش سیستمی super-seller (و super-admin).
 * اگر SEED_ON_STARTUP خاموش باشد بدون این migration، ۴۰۳ می‌ماند.
 */
export class AddCustomersPermissionsToSuperSeller1790000000045
  implements MigrationInterface
{
  name = 'AddCustomersPermissionsToSuperSeller1790000000045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('roles'))) return;

    for (const permission of CUSTOMER_PERMISSIONS) {
      await queryRunner.query(
        `
        UPDATE \`roles\`
        SET \`permissions\` = JSON_ARRAY_APPEND(\`permissions\`, '$', ?)
        WHERE \`slug\` IN ('super-seller', 'super-admin')
          AND \`sellerId\` IS NULL
          AND NOT JSON_CONTAINS(\`permissions\`, JSON_QUOTE(?), '$')
        `,
        [permission, permission],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('roles'))) return;

    for (const permission of CUSTOMER_PERMISSIONS) {
      await queryRunner.query(
        `
        UPDATE \`roles\`
        SET \`permissions\` = JSON_REMOVE(
          \`permissions\`,
          JSON_UNQUOTE(JSON_SEARCH(\`permissions\`, 'one', ?))
        )
        WHERE \`slug\` = 'super-seller'
          AND \`sellerId\` IS NULL
          AND JSON_SEARCH(\`permissions\`, 'one', ?) IS NOT NULL
        `,
        [permission, permission],
      );
    }
  }
}
