import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserRelatedTables1756641000000 implements MigrationInterface {
  name = 'CreateUserRelatedTables1756641000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "nationalCode" character varying(10),
        "birthDate" date,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_profiles_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_profiles_userId"
          FOREIGN KEY ("userId") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_profiles_nationalCode"
      ON "user_profiles" ("nationalCode")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_profiles_userId"
      ON "user_profiles" ("userId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_addresses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "title" character varying(100) NOT NULL,
        "province" character varying(100) NOT NULL,
        "city" character varying(100) NOT NULL,
        "addressDetail" text NOT NULL,
        "postalCode" character varying(10) NOT NULL,
        "plaque" character varying(20),
        "unit" character varying(20),
        "description" text,
        "lat" decimal(10,7),
        "long" decimal(10,7),
        "recipientFullName" character varying(150) NOT NULL,
        "recipientPhone" character varying(20) NOT NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_addresses_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_addresses_userId"
          FOREIGN KEY ("userId") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "revoked" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_userId"
          FOREIGN KEY ("userId") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_addresses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles"`);
  }
}
