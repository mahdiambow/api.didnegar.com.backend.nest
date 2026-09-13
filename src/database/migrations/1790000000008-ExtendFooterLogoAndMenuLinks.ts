import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendFooterLogoAndMenuLinks1790000000008
  implements MigrationInterface
{
  name = 'ExtendFooterLogoAndMenuLinks1790000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const logoUrl: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`footer_settings\` LIKE 'logoUrl'`,
    );
    if (logoUrl.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`footer_settings\`
        ADD \`logoUrl\` varchar(2048) NULL AFTER \`id\`
      `);
    }

    const logoText: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`footer_settings\` LIKE 'logoText'`,
    );
    if (logoText.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`footer_settings\`
        ADD \`logoText\` varchar(200) NULL AFTER \`logoUrl\`
      `);
    }

    const menuLinks: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`footer_settings\` LIKE 'menuLinks'`,
    );
    if (menuLinks.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`footer_settings\`
        ADD \`menuLinks\` JSON NOT NULL DEFAULT ('[]') AFTER \`logoText\`
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const column of ['menuLinks', 'logoText', 'logoUrl'] as const) {
      const cols: Array<{ Field: string }> = await queryRunner.query(
        `SHOW COLUMNS FROM \`footer_settings\` LIKE '${column}'`,
      );
      if (cols.length > 0) {
        await queryRunner.query(
          `ALTER TABLE \`footer_settings\` DROP COLUMN \`${column}\``,
        );
      }
    }
  }
}
