import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFooterSettings1788610000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "footer_settings" (
      "id" smallint PRIMARY KEY DEFAULT 1 CONSTRAINT "CHK_footer_settings_singleton" CHECK ("id" = 1),
      "address" text NOT NULL,
      "phoneNumber" varchar(50) NOT NULL,
      "email" varchar(254) NOT NULL,
      "workingHours" varchar(500) NOT NULL,
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
    await queryRunner.query('DROP TABLE "footer_settings"');
  }
}
