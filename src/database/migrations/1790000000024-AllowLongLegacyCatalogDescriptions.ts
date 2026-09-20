import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Legacy catalog HTML can exceed MySQL TEXT's 65,535-byte limit.  Catalog
 * migration also copies the product description to the seller offer, so all
 * three destination fields need the same capacity.
 */
export class AllowLongLegacyCatalogDescriptions1790000000024 implements MigrationInterface {
  name = 'AllowLongLegacyCatalogDescriptions1790000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`products\`
        MODIFY \`description\` LONGTEXT NULL,
        MODIFY \`shortDescription\` LONGTEXT NULL
    `);
    await queryRunner.query(
      'ALTER TABLE `seller_offers` MODIFY `description` LONGTEXT NULL',
    );
  }

  public async down(): Promise<void> {
    throw new Error(
      'Irreversible: migrated descriptions may exceed the TEXT limit.',
    );
  }
}
