import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFooterAboutUs1790000000010 implements MigrationInterface {
  name = 'AddFooterAboutUs1790000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`footer_settings\` LIKE 'aboutUs'`,
    );
    if (cols.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`footer_settings\`
        ADD \`aboutUs\` JSON NULL AFTER \`enamadUrls\`
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cols: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`footer_settings\` LIKE 'aboutUs'`,
    );
    if (cols.length > 0) {
      await queryRunner.query(
        `ALTER TABLE \`footer_settings\` DROP COLUMN \`aboutUs\``,
      );
    }
  }
}
