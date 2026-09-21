import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Additive migration: legacy media metadata belongs in the primary Nest DB.
 * This intentionally runs after already-deployed catalog migrations.
 */
export class CreateLegacyMedia1790000000030 implements MigrationInterface {
  name = 'CreateLegacyMedia1790000000030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`media\` (
        \`id\` CHAR(26) NOT NULL,
        \`legacyId\` BIGINT UNSIGNED NOT NULL,
        \`legacyTable\` VARCHAR(255) NOT NULL,
        \`filename\` VARCHAR(500) NOT NULL,
        \`mimeType\` VARCHAR(100) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`altText\` VARCHAR(255) NULL,
        \`url\` VARCHAR(1000) NOT NULL,
        \`createdAt\` DATETIME NOT NULL,
        \`updatedAt\` DATETIME NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_media_legacy\` (\`legacyTable\`, \`legacyId\`),
        UNIQUE KEY \`uq_media_filename\` (\`filename\`),
        KEY \`idx_media_mimeType\` (\`mimeType\`),
        KEY \`idx_media_title\` (\`title\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `media`');
  }
}
