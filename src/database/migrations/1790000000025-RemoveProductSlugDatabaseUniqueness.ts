import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Legacy catalog rows can contain duplicate or empty slugs. Product writes
 * through the API enforce slug/SKU uniqueness in ProductsService instead.
 */
export class RemoveProductSlugDatabaseUniqueness1790000000025 implements MigrationInterface {
  name = 'RemoveProductSlugDatabaseUniqueness1790000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const indexes: Array<{ Key_name: string }> = await queryRunner.query(
      "SHOW INDEX FROM `products` WHERE Key_name = 'IDX_products_slug'",
    );
    if (indexes.length > 0) {
      await queryRunner.query(
        'ALTER TABLE `products` DROP INDEX `IDX_products_slug`',
      );
    }
    await queryRunner.query(
      'CREATE INDEX `IDX_products_slug` ON `products` (`slug`)',
    );
  }

  public async down(): Promise<void> {
    throw new Error(
      'Irreversible: imported products may contain duplicate slugs.',
    );
  }
}
