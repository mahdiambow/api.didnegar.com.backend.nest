import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSellerOfferLegacySourceId1790000000023 implements MigrationInterface {
  name = 'AddSellerOfferLegacySourceId1790000000023';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `seller_offers` ADD COLUMN `legacySourceId` CHAR(26) NULL AFTER `legacyTable`, ADD UNIQUE INDEX `IDX_seller_offers_legacySourceId` (`legacySourceId`)',
    );
  }
  public async down(): Promise<void> {
    throw new Error('Irreversible imported source identity.');
  }
}
