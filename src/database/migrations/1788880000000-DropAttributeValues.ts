import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAttributeValues1788880000000 implements MigrationInterface {
  name = 'DropAttributeValues1788880000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "variant_attribute_values" CASCADE
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "product_variant_attributes" CASCADE
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "attribute_values" CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attribute_values" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "legacyId" bigint NOT NULL,
        "legacyTable" character varying(255) NOT NULL,
        "attributeId" uuid,
        "value" character varying(200) NOT NULL,
        "slug" character varying(200) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attribute_values_id" PRIMARY KEY ("id")
      )
    `);
  }
}
