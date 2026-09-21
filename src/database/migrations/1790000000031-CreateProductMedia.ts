import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Legacy product_variant_images adapted to the Nest model, which deliberately
 * has no product_variants table. Each row relates one product to one media row.
 */
export class CreateProductMedia1790000000031 implements MigrationInterface {
  name = 'CreateProductMedia1790000000031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`product_media\` (
        \`id\` CHAR(26) NOT NULL,
        \`productId\` CHAR(26) NOT NULL,
        \`mediaId\` CHAR(26) NOT NULL,
        \`sortOrder\` INT UNSIGNED NOT NULL DEFAULT 0,
        \`isPrimary\` TINYINT(1) NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME NOT NULL,
        \`updatedAt\` DATETIME NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_product_media_product_media\` (\`productId\`, \`mediaId\`),
        KEY \`idx_product_media_product_order\` (\`productId\`, \`sortOrder\`),
        KEY \`idx_product_media_media\` (\`mediaId\`),
        KEY \`idx_product_media_primary\` (\`productId\`, \`isPrimary\`),
        CONSTRAINT \`fk_product_media_product\`
          FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_product_media_media\`
          FOREIGN KEY (\`mediaId\`) REFERENCES \`media\`(\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `product_media`');
  }
}
