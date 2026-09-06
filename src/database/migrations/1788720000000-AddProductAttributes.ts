import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductAttributes1788720000000 implements MigrationInterface {
  name = 'AddProductAttributes1788720000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "attributes" jsonb NOT NULL DEFAULT '{}'::jsonb
    `);

    // Backfill from existing seller offers: collect distinct values per attribute key
    await queryRunner.query(`
      UPDATE "products" p
      SET "attributes" = COALESCE((
        SELECT jsonb_object_agg(key, values)
        FROM (
          SELECT
            attr.key,
            jsonb_agg(DISTINCT attr.value ORDER BY attr.value) AS values
          FROM "seller_offers" o
          CROSS JOIN LATERAL jsonb_each_text(o.attributes) AS attr(key, value)
          WHERE o."productId" = p.id
            AND o.attributes <> '{}'::jsonb
          GROUP BY attr.key
        ) AS grouped
      ), '{}'::jsonb)
      WHERE p."attributes" = '{}'::jsonb
        AND EXISTS (
          SELECT 1 FROM "seller_offers" o
          WHERE o."productId" = p.id
            AND o.attributes <> '{}'::jsonb
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "attributes"
    `);
  }
}
