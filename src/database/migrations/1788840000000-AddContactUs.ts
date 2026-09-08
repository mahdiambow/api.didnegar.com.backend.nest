import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactUs1788840000000 implements MigrationInterface {
  name = 'AddContactUs1788840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contact_settings" (
        "id" smallint NOT NULL DEFAULT 1,
        "address" text NOT NULL,
        "latitude" numeric(10,7),
        "longitude" numeric(10,7),
        "phoneNumber" character varying(50) NOT NULL,
        "workingHours" character varying(500) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contact_settings_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_contact_settings_singleton" CHECK ("id" = 1)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contact_messages" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(150) NOT NULL,
        "email" character varying(254),
        "phoneNumber" character varying(50),
        "subject" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "internalNote" text,
        "reply" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_contact_messages_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contact_messages_isRead"
      ON "contact_messages" ("isRead")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contact_settings"`);
  }
}
