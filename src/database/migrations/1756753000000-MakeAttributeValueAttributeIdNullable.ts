import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeAttributeValueAttributeIdNullable1756753000000
  implements MigrationInterface
{
  name = 'MakeAttributeValueAttributeIdNullable1756753000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "attribute_values"
      ALTER COLUMN "attributeId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "attribute_values"
      SET "attributeId" = sub."id"
      FROM (
        SELECT "id" FROM "attributes" ORDER BY "createdAt" ASC LIMIT 1
      ) sub
      WHERE "attributeId" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "attribute_values"
      ALTER COLUMN "attributeId" SET NOT NULL
    `);
  }
}
