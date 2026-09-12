import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaAssetAlt1790000000005 implements MigrationInterface {
  name = 'AddMediaAssetAlt1790000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`media_assets\` LIKE 'alt'`,
    );
    if (columns.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`media_assets\`
        ADD \`alt\` varchar(500) NULL AFTER \`originalName\`
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`media_assets\` LIKE 'alt'`,
    );
    if (columns.length > 0) {
      await queryRunner.query(
        `ALTER TABLE \`media_assets\` DROP COLUMN \`alt\``,
      );
    }
  }
}
