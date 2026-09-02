import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSellerContracts1756657200000 implements MigrationInterface {
  name = 'AddSellerContracts1756657200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "seller_contracts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sellerId" uuid NOT NULL,
        "sellerName" character varying(150) NOT NULL,
        "adminId" uuid NOT NULL,
        "contractPartyName" character varying(150) NOT NULL,
        "description" text,
        "contractDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_seller_contracts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_seller_contracts_sellerId"
          FOREIGN KEY ("sellerId") REFERENCES "sellers"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_seller_contracts_adminId"
          FOREIGN KEY ("adminId") REFERENCES "users"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_seller_contracts_sellerId"
      ON "seller_contracts" ("sellerId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_seller_contracts_adminId"
      ON "seller_contracts" ("adminId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "seller_contracts"`);
  }
}
