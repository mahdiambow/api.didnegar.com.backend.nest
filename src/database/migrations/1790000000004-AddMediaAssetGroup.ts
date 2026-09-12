import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMediaAssetGroup1790000000004 implements MigrationInterface {
  name = 'AddMediaAssetGroup1790000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const groupCol: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`media_assets\` LIKE 'group'`,
    );
    if (groupCol.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`media_assets\`
        ADD \`group\` varchar(20) NOT NULL DEFAULT 'other' AFTER \`id\`
      `);
    }

    const indexes: Array<{ Key_name: string }> = await queryRunner.query(`
      SHOW INDEX FROM \`media_assets\`
      WHERE Key_name = 'IDX_media_assets_group'
    `);
    if (indexes.length === 0) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_media_assets_group\` ON \`media_assets\` (\`group\`)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const indexes: Array<{ Key_name: string }> = await queryRunner.query(`
      SHOW INDEX FROM \`media_assets\`
      WHERE Key_name = 'IDX_media_assets_group'
    `);
    if (indexes.length > 0) {
      await queryRunner.query(
        `ALTER TABLE \`media_assets\` DROP INDEX \`IDX_media_assets_group\``,
      );
    }
    const groupCol: Array<{ Field: string }> = await queryRunner.query(
      `SHOW COLUMNS FROM \`media_assets\` LIKE 'group'`,
    );
    if (groupCol.length > 0) {
      await queryRunner.query(
        `ALTER TABLE \`media_assets\` DROP COLUMN \`group\``,
      );
    }
  }
}
