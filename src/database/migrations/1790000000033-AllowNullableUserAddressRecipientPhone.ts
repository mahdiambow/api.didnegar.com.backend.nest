import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Legacy addresses do not reliably provide a recipient phone number. */
export class AllowNullableUserAddressRecipientPhone1790000000033 implements MigrationInterface {
  name = 'AllowNullableUserAddressRecipientPhone1790000000033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `user_addresses` MODIFY `recipientPhone` VARCHAR(20) NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE `user_addresses` SET `recipientPhone` = '' WHERE `recipientPhone` IS NULL",
    );
    await queryRunner.query(
      'ALTER TABLE `user_addresses` MODIFY `recipientPhone` VARCHAR(20) NOT NULL',
    );
  }
}
