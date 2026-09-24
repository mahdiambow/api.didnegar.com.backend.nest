import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Enables direct SeaweedFS uploads for product images and admin-only banners. */
export class AddScopedSeaweedMedia1790000000043 implements MigrationInterface {
  name = 'AddScopedSeaweedMedia1790000000043';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ Field: string }> = await queryRunner.query(
      'SHOW COLUMNS FROM `media_assets`',
    );
    const hasScope = columns.some((column) => column.Field === 'scope');
    if (!hasScope) {
      await queryRunner.query(
        "ALTER TABLE `media_assets` ADD COLUMN `scope` varchar(20) NOT NULL DEFAULT 'legacy' AFTER `group`",
      );
      await queryRunner.query(
        'CREATE INDEX `IDX_media_assets_scope` ON `media_assets` (`scope`)',
      );
    }

    const sellerColumn = columns.find((column) => column.Field === 'sellerId');
    if (sellerColumn) {
      await queryRunner.query(
        'ALTER TABLE `media_assets` MODIFY COLUMN `sellerId` varchar(26) NULL',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const indexes: Array<{ Key_name: string }> = await queryRunner.query(
      "SHOW INDEX FROM `media_assets` WHERE Key_name = 'IDX_media_assets_scope'",
    );
    if (indexes.length) {
      await queryRunner.query('DROP INDEX `IDX_media_assets_scope` ON `media_assets`');
    }
    const columns: Array<{ Field: string }> = await queryRunner.query(
      'SHOW COLUMNS FROM `media_assets`',
    );
    if (columns.some((column) => column.Field === 'scope')) {
      await queryRunner.query('ALTER TABLE `media_assets` DROP COLUMN `scope`');
    }
    // sellerId cannot safely be made NOT NULL again while admin banner rows exist.
  }
}
