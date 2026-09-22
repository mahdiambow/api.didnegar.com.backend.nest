import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Creates the Nest review table; legacy review data is imported separately. */
export class CreateReviews1790000000040 implements MigrationInterface {
  name = 'CreateReviews1790000000040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`reviews\` (
        \`id\` CHAR(26) NOT NULL,
        \`legacyId\` BIGINT NOT NULL,
        \`legacyTable\` VARCHAR(255) NOT NULL,
        \`productId\` CHAR(26) NOT NULL,
        \`userId\` CHAR(26) NULL,
        \`authorName\` VARCHAR(255) NULL,
        \`authorEmail\` VARCHAR(320) NULL,
        \`authorUrl\` VARCHAR(2048) NULL,
        \`authorIp\` VARCHAR(100) NULL,
        \`content\` LONGTEXT NOT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'pending',
        \`parentId\` CHAR(26) NULL,
        \`rating\` TINYINT UNSIGNED NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`UQ_reviews_legacy_source\` (\`legacyTable\`, \`legacyId\`),
        INDEX \`IDX_reviews_productId\` (\`productId\`),
        INDEX \`IDX_reviews_userId\` (\`userId\`),
        INDEX \`IDX_reviews_status\` (\`status\`),
        INDEX \`IDX_reviews_parentId\` (\`parentId\`),
        CONSTRAINT \`FK_reviews_productId\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT \`FK_reviews_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT,
        CONSTRAINT \`FK_reviews_parentId\` FOREIGN KEY (\`parentId\`) REFERENCES \`reviews\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `reviews`');
  }
}
