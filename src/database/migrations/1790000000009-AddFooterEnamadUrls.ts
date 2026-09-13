import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFooterEnamadUrls1790000000009 implements MigrationInterface {
  name = 'AddFooterEnamadUrls1790000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`footer_settings\` LIKE 'enamadUrls'`,
    );
    if (cols.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`footer_settings\`
        ADD \`enamadUrls\` JSON NOT NULL DEFAULT ('[]') AFTER \`menuLinks\`
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cols: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`footer_settings\` LIKE 'enamadUrls'`,
    );
    if (cols.length > 0) {
      await queryRunner.query(
        `ALTER TABLE \`footer_settings\` DROP COLUMN \`enamadUrls\``,
      );
    }
  }
}
