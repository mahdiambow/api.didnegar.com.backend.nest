import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLES = [
  'parent_categories',
  'categories',
  'sub_categories',
] as const;

export class AddCategoryIconImageUrls1790000000007
  implements MigrationInterface
{
  name = 'AddCategoryIconImageUrls1790000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      const icon: Array<{ Field: string }> = await queryRunner.query(
        `SHOW COLUMNS FROM \`${table}\` LIKE 'icon'`,
      );
      if (icon.length === 0) {
        await queryRunner.query(`
          ALTER TABLE \`${table}\`
          ADD \`icon\` varchar(2048) NULL AFTER \`slug\`
        `);
      }

      const image: Array<{ Field: string }> = await queryRunner.query(
        `SHOW COLUMNS FROM \`${table}\` LIKE 'image'`,
      );
      if (image.length === 0) {
        await queryRunner.query(`
          ALTER TABLE \`${table}\`
          ADD \`image\` varchar(2048) NULL AFTER \`icon\`
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      for (const column of ['image', 'icon'] as const) {
        const cols: Array<{ Field: string }> = await queryRunner.query(
          `SHOW COLUMNS FROM \`${table}\` LIKE '${column}'`,
        );
        if (cols.length > 0) {
          await queryRunner.query(
            `ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``,
          );
        }
      }
    }
  }
}
