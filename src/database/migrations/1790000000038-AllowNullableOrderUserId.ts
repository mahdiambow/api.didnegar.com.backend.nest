import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Guest and legacy customers may not have a user account. */
export class AllowNullableOrderUserId1790000000038 implements MigrationInterface {
  name = 'AllowNullableOrderUserId1790000000038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const orders = await queryRunner.getTable('orders');
    const foreignKey = orders?.foreignKeys.find((key) =>
      key.columnNames.includes('userId'),
    );
    if (foreignKey)
      await queryRunner.query(
        `ALTER TABLE \`orders\` DROP FOREIGN KEY \`${foreignKey.name}\``,
      );
    await queryRunner.query(
      'ALTER TABLE `orders` MODIFY `userId` CHAR(26) NULL',
    );
    await queryRunner.query(
      'ALTER TABLE `orders` ADD CONSTRAINT `FK_orders_userId` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT',
    );
  }

  public async down(): Promise<void> {
    throw new Error(
      'Cannot safely make orders.userId required after guest orders are imported.',
    );
  }
}
