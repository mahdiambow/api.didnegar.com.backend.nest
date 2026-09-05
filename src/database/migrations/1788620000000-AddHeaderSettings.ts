import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHeaderSettings1788620000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "header_settings" (
      "id" smallint PRIMARY KEY DEFAULT 1 CONSTRAINT "CHK_header_settings_singleton" CHECK ("id" = 1),
      "text" text NOT NULL,
      "instagram" varchar(2048),
      "whatsapp" varchar(2048),
      "telegram" varchar(2048),
      "bale" varchar(2048),
      "rubika" varchar(2048),
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    )`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "header_settings"');
  }
}
