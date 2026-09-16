import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * users and brands already have these source-tracking columns in the baseline.
 * This migration adds the same nullable source identity to derived seller/admin records.
 */
export class AddLegacySourceToSellersAndAdmins1790000000019
  implements MigrationInterface
{
  name = 'AddLegacySourceToSellersAndAdmins1790000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['sellers', 'admins']) {
      if (!(await queryRunner.hasColumn(table, 'legacyId'))) {
        await queryRunner.query(
          `ALTER TABLE \`${table}\` ADD COLUMN \`legacyId\` BIGINT NULL AFTER \`id\``,
        );
      }
      if (!(await queryRunner.hasColumn(table, 'legacyTable'))) {
        await queryRunner.query(
          `ALTER TABLE \`${table}\` ADD COLUMN \`legacyTable\` VARCHAR(255) NULL AFTER \`legacyId\``,
        );
      }
      const indexName = `IDX_${table}_legacyTable_legacyId`;
      const tableSchema = await queryRunner.getTable(table);
      if (!tableSchema?.indices.some((index) => index.name === indexName)) {
        await queryRunner.query(
          `CREATE UNIQUE INDEX \`${indexName}\` ON \`${table}\` (\`legacyTable\`, \`legacyId\`)`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['admins', 'sellers']) {
      const indexName = `IDX_${table}_legacyTable_legacyId`;
      const tableSchema = await queryRunner.getTable(table);
      if (tableSchema?.indices.some((index) => index.name === indexName)) {
        await queryRunner.query(`DROP INDEX \`${indexName}\` ON \`${table}\``);
      }
      if (await queryRunner.hasColumn(table, 'legacyTable')) {
        await queryRunner.query(`ALTER TABLE \`${table}\` DROP COLUMN \`legacyTable\``);
      }
      if (await queryRunner.hasColumn(table, 'legacyId')) {
        await queryRunner.query(`ALTER TABLE \`${table}\` DROP COLUMN \`legacyId\``);
      }
    }
  }
}
