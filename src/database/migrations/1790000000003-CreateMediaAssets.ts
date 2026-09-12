import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMediaAssets1790000000003 implements MigrationInterface {
  name = 'CreateMediaAssets1790000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`media_assets\` (
        \`id\` varchar(36) NOT NULL,
        \`group\` varchar(20) NOT NULL DEFAULT 'other',
        \`sellerId\` varchar(36) NOT NULL,
        \`uploadedByUserId\` varchar(36) NOT NULL,
        \`productId\` varchar(36) NULL,
        \`originalName\` varchar(255) NOT NULL,
        \`alt\` varchar(500) NULL,
        \`mimeType\` varchar(100) NOT NULL,
        \`sizeBytes\` int NOT NULL,
        \`relativePath\` varchar(500) NOT NULL,
        \`storageLocation\` varchar(20) NOT NULL DEFAULT 'staging',
        \`status\` varchar(20) NOT NULL DEFAULT 'pending',
        \`isUsed\` tinyint NOT NULL DEFAULT 0,
        \`expiresAt\` datetime NULL,
        \`rejectionReason\` varchar(1000) NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_media_assets_group\` (\`group\`),
        INDEX \`IDX_media_assets_sellerId\` (\`sellerId\`),
        INDEX \`IDX_media_assets_productId\` (\`productId\`),
        INDEX \`IDX_media_assets_status\` (\`status\`),
        INDEX \`IDX_media_assets_isUsed\` (\`isUsed\`),
        INDEX \`IDX_media_assets_expiresAt\` (\`expiresAt\`),
        CONSTRAINT \`FK_media_assets_sellerId\`
          FOREIGN KEY (\`sellerId\`) REFERENCES \`sellers\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_media_assets_uploadedByUserId\`
          FOREIGN KEY (\`uploadedByUserId\`) REFERENCES \`users\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_media_assets_productId\`
          FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`)
          ON DELETE SET NULL ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`media_assets\``);
  }
}
