import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepositGatewayLifecycle1790000000045 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE deposits
      ADD COLUMN paymentRequestCreatedAt DATETIME NULL,
      ADD COLUMN paymentRequestPaidAt DATETIME NULL,
      ADD COLUMN paymentRequestVerifiedAt DATETIME NULL,
      ADD COLUMN rejectionReason VARCHAR(255) NULL`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE deposits
      DROP COLUMN rejectionReason,
      DROP COLUMN paymentRequestVerifiedAt,
      DROP COLUMN paymentRequestPaidAt,
      DROP COLUMN paymentRequestCreatedAt`);
  }
}
