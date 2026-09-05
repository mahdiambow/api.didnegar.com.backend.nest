import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderItems1788600000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
        "quantity" integer NOT NULL CHECK ("quantity" > 0),
        "unitPrice" numeric(19,4) NOT NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_order_items_orderId" ON "order_items" ("orderId")`,
    );
    await queryRunner.query(`
      INSERT INTO "order_items" ("orderId", "productId", "quantity", "unitPrice")
      SELECT "id", "productId", "quantity", "subtotal" / "quantity" FROM "orders"
    `);
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "productId", DROP COLUMN "quantity"`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const incompatible = await queryRunner.query(`
      SELECT o."id" FROM "orders" o LEFT JOIN "order_items" i ON i."orderId" = o."id"
      GROUP BY o."id" HAVING COUNT(i."id") <> 1 LIMIT 1
    `);
    if (incompatible.length) {
      throw new Error(
        'Cannot revert order items: every order must contain exactly one product.',
      );
    }
    await queryRunner.query(
      `ALTER TABLE "orders" ADD COLUMN "productId" uuid, ADD COLUMN "quantity" integer NOT NULL DEFAULT 1`,
    );
    await queryRunner.query(`
      UPDATE "orders" o SET "productId" = i."productId", "quantity" = i."quantity"
      FROM "order_items" i WHERE i."orderId" = o."id"
    `);
    await queryRunner.query(`ALTER TABLE "orders" ALTER COLUMN "productId" SET NOT NULL,
      ADD CONSTRAINT "FK_orders_product" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE`);
    await queryRunner.query(`DROP TABLE "order_items"`);
  }
}
