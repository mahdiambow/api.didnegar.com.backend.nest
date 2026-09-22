import type { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateWishlists1790000000041 implements MigrationInterface {
  name = 'CreateWishlists1790000000041';
  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE IF NOT EXISTS \`wishlists\` (\`id\` CHAR(26) NOT NULL,\`legacyId\` BIGINT NOT NULL,\`legacyTable\` VARCHAR(255) NOT NULL,\`userId\` CHAR(26) NULL,\`name\` VARCHAR(255) NULL,\`createdAt\` DATETIME NULL,\`updatedAt\` DATETIME NULL,PRIMARY KEY (\`id\`),UNIQUE KEY \`UQ_wishlists_legacy\` (\`legacyTable\`,\`legacyId\`),KEY \`IDX_wishlists_user\` (\`userId\`),CONSTRAINT \`FK_wishlists_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
    await q.query(
      `CREATE TABLE IF NOT EXISTS \`wishlist_items\` (\`id\` CHAR(26) NOT NULL,\`legacyId\` BIGINT NOT NULL,\`legacyTable\` VARCHAR(255) NOT NULL,\`wishlistId\` CHAR(26) NOT NULL,\`productId\` CHAR(26) NULL,\`addedAt\` DATETIME NULL,\`wasOnSale\` TINYINT(1) NOT NULL DEFAULT 0,PRIMARY KEY (\`id\`),UNIQUE KEY \`UQ_wishlist_items_legacy\` (\`legacyTable\`,\`legacyId\`),KEY \`IDX_wishlist_items_wishlist\` (\`wishlistId\`),KEY \`IDX_wishlist_items_product\` (\`productId\`),CONSTRAINT \`FK_wishlist_items_wishlist\` FOREIGN KEY (\`wishlistId\`) REFERENCES \`wishlists\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT,CONSTRAINT \`FK_wishlist_items_product\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    );
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE IF EXISTS `wishlist_items`');
    await q.query('DROP TABLE IF EXISTS `wishlists`');
  }
}
