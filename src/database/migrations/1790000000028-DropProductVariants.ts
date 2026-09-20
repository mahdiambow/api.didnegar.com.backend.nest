import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DropProductVariants1790000000028 implements MigrationInterface {
  name = 'DropProductVariants1790000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`product_variants\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`product_variants\` (
        \`id\` VARCHAR(26) NOT NULL,
        \`product_id\` VARCHAR(26) NOT NULL,
        CONSTRAINT \`PK_product_variants\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_product_variants_product_id\` (\`product_id\`),
        CONSTRAINT \`FK_product_variants_product_id\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }
}
