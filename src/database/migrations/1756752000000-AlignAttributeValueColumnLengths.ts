import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignAttributeValueColumnLengths1756752000000
  implements MigrationInterface
{
  name = 'AlignAttributeValueColumnLengths1756752000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "attribute_values"
      ALTER COLUMN "value" TYPE character varying(200)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "attribute_values"
      ALTER COLUMN "value" TYPE character varying(255)
    `);
  }
}
