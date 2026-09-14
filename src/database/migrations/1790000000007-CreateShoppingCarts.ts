import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShoppingCarts1790000000007 implements MigrationInterface {
  name = 'CreateShoppingCarts1790000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('shopping_carts'))) {
      await queryRunner.query(`
        CREATE TABLE \`shopping_carts\` (
          \`id\` varchar(36) NOT NULL,
          \`userId\` varchar(36) NOT NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`UQ_shopping_carts_userId\` (\`userId\`),
          CONSTRAINT \`FK_shopping_carts_userId\`
            FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
            ON DELETE CASCADE ON UPDATE RESTRICT
        ) ENGINE=InnoDB
      `);
    }

    if (!(await queryRunner.hasTable('shopping_cart_items'))) {
      await queryRunner.query(`
        CREATE TABLE \`shopping_cart_items\` (
          \`id\` varchar(36) NOT NULL,
          \`cartId\` varchar(36) NOT NULL,
          \`offerId\` varchar(36) NOT NULL,
          \`quantity\` int NOT NULL,
          \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`UQ_shopping_cart_items_cart_offer\` (\`cartId\`, \`offerId\`),
          KEY \`IDX_shopping_cart_items_cartId\` (\`cartId\`),
          KEY \`IDX_shopping_cart_items_offerId\` (\`offerId\`),
          CONSTRAINT \`CHK_shopping_cart_item_quantity\` CHECK (\`quantity\` > 0),
          CONSTRAINT \`FK_shopping_cart_items_cartId\`
            FOREIGN KEY (\`cartId\`) REFERENCES \`shopping_carts\`(\`id\`)
            ON DELETE CASCADE ON UPDATE RESTRICT,
          CONSTRAINT \`FK_shopping_cart_items_offerId\`
            FOREIGN KEY (\`offerId\`) REFERENCES \`seller_offers\`(\`id\`)
            ON DELETE RESTRICT ON UPDATE RESTRICT
        ) ENGINE=InnoDB
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `shopping_cart_items`');
    await queryRunner.query('DROP TABLE IF EXISTS `shopping_carts`');
  }
}
