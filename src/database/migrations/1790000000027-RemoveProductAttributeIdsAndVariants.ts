import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveProductAttributeIdsAndVariants1790000000027
  implements MigrationInterface
{
  name = 'RemoveProductAttributeIdsAndVariants1790000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`products\` DROP COLUMN \`attributeIds\``,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS \`product_variants\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`product_variants\` (
        \`id\` CHAR(26) NOT NULL,
        \`product_id\` CHAR(26) NOT NULL,
        CONSTRAINT \`PK_product_variants\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_product_variants_product_id\` (\`product_id\`),
        CONSTRAINT \`FK_product_variants_product_id\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(
      `ALTER TABLE \`products\` ADD \`attributeIds\` JSON NOT NULL DEFAULT ('[]')`,
    );
  }
}
