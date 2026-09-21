import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Retain legacy address postal-code text without format validation or truncation. */
export class AllowNullableLongUserAddressPostalCode1790000000034 implements MigrationInterface {
  name = 'AllowNullableLongUserAddressPostalCode1790000000034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `user_addresses` MODIFY `postalCode` VARCHAR(20) NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      "UPDATE `user_addresses` SET `postalCode` = '' WHERE `postalCode` IS NULL",
    );
    await queryRunner.query(
      'ALTER TABLE `user_addresses` MODIFY `postalCode` VARCHAR(10) NOT NULL',
    );
  }
}
