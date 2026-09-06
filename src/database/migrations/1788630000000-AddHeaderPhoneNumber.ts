import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHeaderPhoneNumber1788630000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "header_settings" ADD COLUMN "phoneNumber" varchar(50)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "header_settings" DROP COLUMN "phoneNumber"',
    );
  }
}
