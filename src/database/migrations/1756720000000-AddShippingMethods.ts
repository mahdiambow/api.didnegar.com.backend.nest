import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShippingMethods1756720000000 implements MigrationInterface {
  name = 'AddShippingMethods1756720000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shipping_methods" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(100) NOT NULL,
        "name" character varying(255) NOT NULL,
        "price" numeric(19,4) NOT NULL DEFAULT 0,
        "isCod" boolean NOT NULL DEFAULT true,
        "isActive" boolean NOT NULL DEFAULT true,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_shipping_methods_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shipping_methods_slug"
      ON "shipping_methods" ("slug")
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "shippingMethodId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "subtotal" numeric(19,4)
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "shippingAmount" numeric(19,4) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      UPDATE "orders"
      SET "subtotal" = "amount"
      WHERE "subtotal" IS NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_orders_shipping_method'
        ) THEN
          ALTER TABLE "orders"
          ADD CONSTRAINT "FK_orders_shipping_method"
          FOREIGN KEY ("shippingMethodId") REFERENCES "shipping_methods"("id")
          ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP CONSTRAINT IF EXISTS "FK_orders_shipping_method"
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "shippingMethodId"
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "subtotal"
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "shippingAmount"
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "shipping_methods"`);
  }
}
