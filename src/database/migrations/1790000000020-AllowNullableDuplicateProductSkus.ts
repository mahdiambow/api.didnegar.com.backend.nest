import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Product SKUs are optional catalog metadata and need not be globally unique. */
export class AllowNullableDuplicateProductSkus1790000000020 implements MigrationInterface {
  name = 'AllowNullableDuplicateProductSkus1790000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const indexes: Array<{ Key_name: string }> = await queryRunner.query(
      "SHOW INDEX FROM `products` WHERE Key_name = 'IDX_products_sku'",
    );
    if (indexes.length > 0) {
      await queryRunner.query(
        'ALTER TABLE `products` DROP INDEX `IDX_products_sku`',
      );
    }
    await queryRunner.query(
      'ALTER TABLE `products` MODIFY `sku` VARCHAR(100) NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const invalid: Array<{ total: number }> = await queryRunner.query(
      `SELECT COUNT(*) AS total
       FROM (
         SELECT sku FROM products
         GROUP BY sku
         HAVING sku IS NULL OR COUNT(*) > 1
       ) invalid_skus`,
    );
    if (Number(invalid[0]?.total || 0) > 0) {
      throw new Error(
        'Cannot restore unique, non-null product SKUs while null or duplicate SKUs exist.',
      );
    }
    await queryRunner.query(
      'ALTER TABLE `products` MODIFY `sku` VARCHAR(100) NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX `IDX_products_sku` ON `products` (`sku`)',
    );
  }
}
