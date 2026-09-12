import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendBrandsCatalogFields1790000000006
  implements MigrationInterface
{
  name = 'ExtendBrandsCatalogFields1790000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const nameEn: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`brands\` LIKE 'nameEn'`,
    );
    if (nameEn.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`brands\`
        ADD \`nameEn\` varchar(200) NULL AFTER \`name\`
      `);
    }

    const logoUrl: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`brands\` LIKE 'logoUrl'`,
    );
    if (logoUrl.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`brands\`
        ADD \`logoUrl\` varchar(2048) NULL AFTER \`slug\`
      `);
    }

    const seoDescription: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`brands\` LIKE 'seoDescription'`,
    );
    if (seoDescription.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`brands\`
        ADD \`seoDescription\` text NULL AFTER \`logoUrl\`
      `);
    }

    const description: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`brands\` LIKE 'description'`,
    );
    if (description.length > 0) {
      await queryRunner.query(`
        UPDATE \`brands\`
        SET \`seoDescription\` = \`description\`
        WHERE \`seoDescription\` IS NULL AND \`description\` IS NOT NULL
      `);
      await queryRunner.query(`
        ALTER TABLE \`brands\` DROP COLUMN \`description\`
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const description: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`brands\` LIKE 'description'`,
    );
    if (description.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`brands\`
        ADD \`description\` text NULL AFTER \`slug\`
      `);
      await queryRunner.query(`
        UPDATE \`brands\`
        SET \`description\` = \`seoDescription\`
        WHERE \`seoDescription\` IS NOT NULL
      `);
    }

    for (const column of ['seoDescription', 'logoUrl', 'nameEn'] as const) {
      const cols: Array<{ Field: string }> = await queryRunner.query(
        `SHOW COLUMNS FROM \`brands\` LIKE '${column}'`,
      );
      if (cols.length > 0) {
        await queryRunner.query(
          `ALTER TABLE \`brands\` DROP COLUMN \`${column}\``,
        );
      }
    }
  }
}
