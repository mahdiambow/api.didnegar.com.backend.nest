import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAboutUs1788830000000 implements MigrationInterface {
  name = 'AddAboutUs1788830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "about_us" (
        "id" smallint NOT NULL DEFAULT 1,
        "title" character varying(255) NOT NULL,
        "content" text NOT NULL,
        "faqs" jsonb NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_about_us_id" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_about_us_singleton" CHECK ("id" = 1)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "about_us"`);
  }
}
