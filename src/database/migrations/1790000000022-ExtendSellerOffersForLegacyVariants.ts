import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Legacy variants are represented solely as seller offers. */
export class ExtendSellerOffersForLegacyVariants1790000000022 implements MigrationInterface {
  name = 'ExtendSellerOffersForLegacyVariants1790000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`seller_offers\`
        ADD COLUMN \`legacyId\` BIGINT NULL AFTER \`id\`,
        ADD COLUMN \`legacyTable\` VARCHAR(255) NULL AFTER \`legacyId\`,
        ADD COLUMN \`minPrice\` DECIMAL(19,4) NULL AFTER \`price\`,
        ADD COLUMN \`maxPrice\` DECIMAL(19,4) NULL AFTER \`minPrice\`,
        ADD COLUMN \`isVirtual\` TINYINT(1) NOT NULL DEFAULT 0,
        ADD COLUMN \`isDownloadable\` TINYINT(1) NOT NULL DEFAULT 0,
        ADD COLUMN \`description\` TEXT NULL,
        ADD COLUMN \`weight\` DECIMAL(10,2) NULL,
        ADD COLUMN \`length\` DECIMAL(10,2) NULL,
        ADD COLUMN \`width\` DECIMAL(10,2) NULL,
        ADD COLUMN \`height\` DECIMAL(10,2) NULL,
        ADD COLUMN \`image\` VARCHAR(2048) NULL,
        MODIFY \`sku\` VARCHAR(100) NULL,
        ADD UNIQUE INDEX \`IDX_seller_offers_legacyTable_legacyId\` (\`legacyTable\`, \`legacyId\`)
    `);
    const indexes: Array<{ Key_name: string }> = await queryRunner.query(
      "SHOW INDEX FROM `seller_offers` WHERE Key_name = 'IDX_seller_offers_sku'",
    );
    if (indexes.length)
      await queryRunner.query(
        'ALTER TABLE `seller_offers` DROP INDEX `IDX_seller_offers_sku`',
      );
  }

  public async down(): Promise<void> {
    throw new Error(
      'Irreversible: imported legacy variant data may use these columns.',
    );
  }
}
