import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttributeValues1790000000014 implements MigrationInterface {
  name = 'CreateAttributeValues1790000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`attribute_values\` (
        \`id\` CHAR(26) NOT NULL,
        \`legacyId\` BIGINT NOT NULL,
        \`legacyTable\` VARCHAR(255) NOT NULL,
        \`attributeId\` CHAR(26) NOT NULL,
        \`value\` VARCHAR(200) NOT NULL,
        \`label\` VARCHAR(200) NOT NULL,
        \`sortOrder\` INT NOT NULL DEFAULT 0,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_attribute_values\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_attribute_values_attributeId\` (\`attributeId\`),
        UNIQUE INDEX \`IDX_attribute_values_attributeId_value\` (\`attributeId\`, \`value\`),
        UNIQUE INDEX \`IDX_attribute_values_legacyTable_legacyId\` (\`legacyTable\`, \`legacyId\`),
        CONSTRAINT \`FK_attribute_values_attributeId\` FOREIGN KEY (\`attributeId\`) REFERENCES \`attributes\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `attribute_values`');
  }
}
