import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1756640000000 implements MigrationInterface {
  name = 'CreateUsersTable1756640000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const usersTableExists = await queryRunner.hasTable('users');
    if (usersTableExists) return;

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "legacyId" bigint,
        "legacyTable" character varying(100),
        "username" character varying(20) NOT NULL,
        "password" character varying,
        "email" character varying(150),
        "displayName" character varying(150),
        "firstName" character varying(100),
        "lastName" character varying(100),
        "website" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "roleId" uuid,
        "sellerId" uuid,
        "otpCode" character varying(72),
        "otpExpiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_username" ON "users" ("username")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
