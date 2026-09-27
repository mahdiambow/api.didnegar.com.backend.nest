import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepositRedirectUrl1790000000054 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `deposits` ADD COLUMN `redirectUrl` VARCHAR(500) NULL AFTER `callbackUrl`',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `deposits` DROP COLUMN `redirectUrl`');
  }
}
