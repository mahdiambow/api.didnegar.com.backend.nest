import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoleAudience1790000000018 implements MigrationInterface {
  name = 'AddRoleAudience1790000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`roles\`
        ADD COLUMN \`audience\` VARCHAR(20) NOT NULL DEFAULT 'user'
        AFTER \`isSystem\`
    `);

    await queryRunner.query(`
      UPDATE \`roles\`
      SET \`audience\` = CASE \`slug\`
        WHEN 'seller' THEN 'seller'
        WHEN 'super-seller' THEN 'seller'
        WHEN 'admin' THEN 'admin'
        WHEN 'super-admin' THEN 'admin'
        ELSE 'user'
      END
      WHERE \`isSystem\` = 1
    `);

    await queryRunner.query(`
      UPDATE \`roles\`
      SET \`audience\` = 'seller'
      WHERE \`isSystem\` = 0 AND \`sellerId\` IS NOT NULL
    `);

    await queryRunner.query(`
      UPDATE \`roles\`
      SET \`audience\` = 'admin'
      WHERE \`isSystem\` = 0 AND \`sellerId\` IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `roles` DROP COLUMN `audience`');
  }
}
