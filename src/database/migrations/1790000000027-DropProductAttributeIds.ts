import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProductAttributeIds1790000000027 implements MigrationInterface {
  name = 'DropProductAttributeIds1790000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ COLUMN_NAME: string }> = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME = 'attributeIds'
    `);
    if (columns.length) {
      await queryRunner.query(
        `ALTER TABLE \`products\` DROP COLUMN \`attributeIds\``,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ COLUMN_NAME: string }> = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME = 'attributeIds'
    `);
    if (!columns.length) {
      await queryRunner.query(
        `ALTER TABLE \`products\` ADD \`attributeIds\` JSON NOT NULL DEFAULT ('[]')`,
      );
    }
  }
}
