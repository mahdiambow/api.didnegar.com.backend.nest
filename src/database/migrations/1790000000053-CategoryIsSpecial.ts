import type { MigrationInterface, QueryRunner } from 'typeorm';

/** isSpecial + specialImage روی هر سه سطح دسته */
export class CategoryIsSpecial1790000000053 implements MigrationInterface {
  name = 'CategoryIsSpecial1790000000053';

  private readonly tables = [
    'parent_categories',
    'categories',
    'sub_categories',
  ] as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of this.tables) {
      if (!(await queryRunner.hasTable(tableName))) continue;
      const table = await queryRunner.getTable(tableName);
      if (!table) continue;

      if (!table.findColumnByName('isSpecial')) {
        await queryRunner.query(`
          ALTER TABLE \`${tableName}\`
            ADD COLUMN \`isSpecial\` TINYINT NOT NULL DEFAULT 0 AFTER \`isActive\`
        `);
      }
      if (!table.findColumnByName('specialImage')) {
        await queryRunner.query(`
          ALTER TABLE \`${tableName}\`
            ADD COLUMN \`specialImage\` VARCHAR(2048) NULL AFTER \`isSpecial\`
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of this.tables) {
      if (!(await queryRunner.hasTable(tableName))) continue;
      const table = await queryRunner.getTable(tableName);
      if (!table) continue;

      if (table.findColumnByName('specialImage')) {
        await queryRunner.query(
          `ALTER TABLE \`${tableName}\` DROP COLUMN \`specialImage\``,
        );
      }
      if (table.findColumnByName('isSpecial')) {
        await queryRunner.query(
          `ALTER TABLE \`${tableName}\` DROP COLUMN \`isSpecial\``,
        );
      }
    }
  }
}
