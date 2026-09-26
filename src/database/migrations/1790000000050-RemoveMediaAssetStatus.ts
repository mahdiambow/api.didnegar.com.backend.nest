import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Media approval is derived from the linked product, not stored per asset. */
export class RemoveMediaAssetStatus1790000000050 implements MigrationInterface {
  name = 'RemoveMediaAssetStatus1790000000050';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ Field: string }> = await queryRunner.query(
      'SHOW COLUMNS FROM `media_assets`',
    );
    const indexes: Array<{ Key_name: string }> = await queryRunner.query(
      "SHOW INDEX FROM `media_assets` WHERE Key_name = 'IDX_media_assets_status'",
    );

    if (indexes.length) {
      await queryRunner.query(
        'ALTER TABLE `media_assets` DROP INDEX `IDX_media_assets_status`',
      );
    }
    if (columns.some((column) => column.Field === 'status')) {
      await queryRunner.query(
        'ALTER TABLE `media_assets` DROP COLUMN `status`',
      );
    }
    if (columns.some((column) => column.Field === 'rejectionReason')) {
      await queryRunner.query(
        'ALTER TABLE `media_assets` DROP COLUMN `rejectionReason`',
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ Field: string }> = await queryRunner.query(
      'SHOW COLUMNS FROM `media_assets`',
    );
    if (!columns.some((column) => column.Field === 'status')) {
      await queryRunner.query(
        "ALTER TABLE `media_assets` ADD COLUMN `status` varchar(20) NOT NULL DEFAULT 'approved' AFTER `storageLocation`",
      );
      await queryRunner.query(
        'CREATE INDEX `IDX_media_assets_status` ON `media_assets` (`status`)',
      );
    }
    if (!columns.some((column) => column.Field === 'rejectionReason')) {
      await queryRunner.query(
        'ALTER TABLE `media_assets` ADD COLUMN `rejectionReason` varchar(1000) NULL AFTER `expiresAt`',
      );
    }
  }
}
