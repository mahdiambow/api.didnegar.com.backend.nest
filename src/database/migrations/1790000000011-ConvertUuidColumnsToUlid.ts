import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * UUID (36) → ULID (26).
 * داده‌های UUID قبلی truncate می‌شوند؛ بعداً seed/import بزن.
 */
export class ConvertUuidColumnsToUlid1790000000011 implements MigrationInterface {
  name = 'ConvertUuidColumnsToUlid1790000000011';

  private readonly tablesToTruncate = [
    'order_items',
    'payments',
    'orders',
    'seller_offers',
    'product_categories',
    'product_stocks',
    'product_variants',
    'products',
    'media_assets',
    'banners',
    'contact_messages',
    'sub_categories',
    'categories',
    'parent_categories',
    'brands',
    'attributes',
    'seller_contracts',
    'refresh_tokens',
    'user_addresses',
    'user_profiles',
    'users',
    'roles',
    'sellers',
    'shipping_methods',
    'cities',
    'states',
    'countries',
    'legacy_id_map',
  ];

  /** [table, column, mysql type incl. NULL/NOT NULL] */
  private readonly alters: Array<[string, string, string]> = [
    ['attributes', 'id', 'CHAR(26) NOT NULL'],
    ['banners', 'id', 'CHAR(26) NOT NULL'],
    ['banners', 'categoryId', 'CHAR(26) NULL'],
    ['brands', 'id', 'CHAR(26) NOT NULL'],
    ['categories', 'id', 'CHAR(26) NOT NULL'],
    ['categories', 'parentCategoryId', 'CHAR(26) NOT NULL'],
    ['cities', 'id', 'CHAR(26) NOT NULL'],
    ['cities', 'countryId', 'CHAR(26) NULL'],
    ['cities', 'stateId', 'CHAR(26) NULL'],
    ['contact_messages', 'id', 'CHAR(26) NOT NULL'],
    ['countries', 'id', 'CHAR(26) NOT NULL'],
    ['legacy_id_map', 'legacy_ulid', 'VARCHAR(26) NOT NULL'],
    ['legacy_id_map', 'nest_uuid', 'CHAR(26) NOT NULL'],
    ['media_assets', 'id', 'VARCHAR(26) NOT NULL'],
    ['media_assets', 'sellerId', 'VARCHAR(26) NOT NULL'],
    ['media_assets', 'uploadedByUserId', 'VARCHAR(26) NOT NULL'],
    ['media_assets', 'productId', 'VARCHAR(26) NULL'],
    ['order_items', 'id', 'CHAR(26) NOT NULL'],
    ['order_items', 'orderId', 'CHAR(26) NOT NULL'],
    ['order_items', 'productId', 'CHAR(26) NOT NULL'],
    ['order_items', 'offerId', 'CHAR(26) NULL'],
    ['order_items', 'sellerId', 'CHAR(26) NULL'],
    ['orders', 'id', 'CHAR(26) NOT NULL'],
    ['orders', 'userId', 'CHAR(26) NOT NULL'],
    ['orders', 'shippingMethodId', 'CHAR(26) NULL'],
    ['parent_categories', 'id', 'CHAR(26) NOT NULL'],
    ['payments', 'id', 'CHAR(26) NOT NULL'],
    ['payments', 'orderId', 'CHAR(26) NOT NULL'],
    ['product_categories', 'id', 'CHAR(26) NOT NULL'],
    ['product_categories', 'productId', 'CHAR(26) NOT NULL'],
    ['product_categories', 'categoryId', 'CHAR(26) NULL'],
    ['product_categories', 'subCategoryId', 'CHAR(26) NULL'],
    ['product_stocks', 'id', 'CHAR(26) NOT NULL'],
    ['product_stocks', 'productId', 'CHAR(26) NOT NULL'],
    ['product_variants', 'id', 'CHAR(26) NOT NULL'],
    ['product_variants', 'product_id', 'CHAR(26) NOT NULL'],
    ['products', 'id', 'CHAR(26) NOT NULL'],
    ['products', 'brandId', 'CHAR(26) NULL'],
    ['products', 'createdBySellerId', 'CHAR(26) NULL'],
    ['refresh_tokens', 'id', 'CHAR(26) NOT NULL'],
    ['refresh_tokens', 'userId', 'CHAR(26) NOT NULL'],
    ['roles', 'id', 'CHAR(26) NOT NULL'],
    ['roles', 'sellerId', 'CHAR(26) NULL'],
    ['seller_contracts', 'id', 'CHAR(26) NOT NULL'],
    ['seller_contracts', 'sellerId', 'CHAR(26) NULL'],
    ['seller_offers', 'id', 'CHAR(26) NOT NULL'],
    ['seller_offers', 'sellerId', 'CHAR(26) NOT NULL'],
    ['seller_offers', 'productId', 'CHAR(26) NOT NULL'],
    ['sellers', 'id', 'CHAR(26) NOT NULL'],
    ['shipping_methods', 'id', 'CHAR(26) NOT NULL'],
    ['states', 'id', 'CHAR(26) NOT NULL'],
    ['states', 'countryId', 'CHAR(26) NOT NULL'],
    ['sub_categories', 'id', 'CHAR(26) NOT NULL'],
    ['sub_categories', 'categoryId', 'CHAR(26) NOT NULL'],
    ['user_addresses', 'id', 'CHAR(26) NOT NULL'],
    ['user_addresses', 'userId', 'CHAR(26) NOT NULL'],
    ['user_profiles', 'id', 'CHAR(26) NOT NULL'],
    ['user_profiles', 'userId', 'CHAR(26) NOT NULL'],
    ['users', 'id', 'CHAR(26) NOT NULL'],
    ['users', 'roleId', 'CHAR(26) NOT NULL'],
    ['users', 'sellerId', 'CHAR(26) NULL'],
  ];

  private readonly recreateFks = [
    'ALTER TABLE `roles` ADD CONSTRAINT `FK_roles_sellerId` FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    'ALTER TABLE `users` ADD CONSTRAINT `FK_users_roleId` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    'ALTER TABLE `users` ADD CONSTRAINT `FK_users_sellerId` FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    'ALTER TABLE `refresh_tokens` ADD CONSTRAINT `FK_refresh_tokens_userId` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'ALTER TABLE `user_profiles` ADD CONSTRAINT `FK_user_profiles_userId` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'ALTER TABLE `user_addresses` ADD CONSTRAINT `FK_user_addresses_userId` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'ALTER TABLE `seller_contracts` ADD CONSTRAINT `FK_seller_contracts_sellerId` FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'ALTER TABLE `states` ADD CONSTRAINT `FK_states_countryId` FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'ALTER TABLE `cities` ADD CONSTRAINT `FK_cities_countryId` FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT',
    'ALTER TABLE `cities` ADD CONSTRAINT `FK_cities_stateId` FOREIGN KEY (`stateId`) REFERENCES `states`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT',
    'ALTER TABLE `categories` ADD CONSTRAINT `FK_categories_parentCategoryId` FOREIGN KEY (`parentCategoryId`) REFERENCES `parent_categories`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    'ALTER TABLE `sub_categories` ADD CONSTRAINT `FK_sub_categories_categoryId` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'ALTER TABLE `products` ADD CONSTRAINT `FK_products_brandId` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT',
    'ALTER TABLE `product_stocks` ADD CONSTRAINT `FK_product_stocks_productId` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'ALTER TABLE `product_variants` ADD CONSTRAINT `FK_product_variants_product_id` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'ALTER TABLE `product_categories` ADD CONSTRAINT `FK_product_categories_productId` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'ALTER TABLE `product_categories` ADD CONSTRAINT `FK_product_categories_categoryId` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'ALTER TABLE `product_categories` ADD CONSTRAINT `FK_product_categories_subCategoryId` FOREIGN KEY (`subCategoryId`) REFERENCES `sub_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'ALTER TABLE `seller_offers` ADD CONSTRAINT `FK_seller_offers_sellerId` FOREIGN KEY (`sellerId`) REFERENCES `sellers`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    'ALTER TABLE `seller_offers` ADD CONSTRAINT `FK_seller_offers_productId` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    'ALTER TABLE `orders` ADD CONSTRAINT `FK_orders_userId` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'ALTER TABLE `orders` ADD CONSTRAINT `FK_orders_shippingMethodId` FOREIGN KEY (`shippingMethodId`) REFERENCES `shipping_methods`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT',
    'ALTER TABLE `order_items` ADD CONSTRAINT `FK_order_items_orderId` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'ALTER TABLE `order_items` ADD CONSTRAINT `FK_order_items_productId` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    'ALTER TABLE `order_items` ADD CONSTRAINT `FK_order_items_offerId` FOREIGN KEY (`offerId`) REFERENCES `seller_offers`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT',
    'ALTER TABLE `payments` ADD CONSTRAINT `FK_payments_orderId` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'ALTER TABLE `banners` ADD CONSTRAINT `FK_banners_categoryId` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    const fks: Array<{ CONSTRAINT_NAME: string; TABLE_NAME: string }> =
      await queryRunner.query(`
        SELECT CONSTRAINT_NAME, TABLE_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      `);
    for (const fk of fks) {
      await queryRunner.query(
        `ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``,
      );
    }

    for (const table of this.tablesToTruncate) {
      if (await queryRunner.hasTable(table)) {
        await queryRunner.query(`TRUNCATE TABLE \`${table}\``);
      }
    }

    for (const [table, column, type] of this.alters) {
      // Init schema never had banners.categoryId (removed later in 0026);
      // skip any alter whose table/column is absent on this DB.
      if (!(await queryRunner.hasTable(table))) continue;
      if (!(await queryRunner.hasColumn(table, column))) continue;
      await queryRunner.query(
        `ALTER TABLE \`${table}\` MODIFY \`${column}\` ${type}`,
      );
    }

    for (const sql of this.recreateFks) {
      try {
        await queryRunner.query(sql);
      } catch {
        // FK may already exist or table missing in partial envs
      }
    }

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
    const fks: Array<{ CONSTRAINT_NAME: string; TABLE_NAME: string }> =
      await queryRunner.query(`
        SELECT CONSTRAINT_NAME, TABLE_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE()
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      `);
    for (const fk of fks) {
      await queryRunner.query(
        `ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``,
      );
    }
    for (const table of this.tablesToTruncate) {
      if (await queryRunner.hasTable(table)) {
        await queryRunner.query(`TRUNCATE TABLE \`${table}\``);
      }
    }
    for (const [table, column, type] of this.alters) {
      if (!(await queryRunner.hasTable(table))) continue;
      if (!(await queryRunner.hasColumn(table, column))) continue;
      await queryRunner.query(
        `ALTER TABLE \`${table}\` MODIFY \`${column}\` ${type.replace('(26)', '(36)')}`,
      );
    }
    for (const sql of this.recreateFks) {
      try {
        await queryRunner.query(sql);
      } catch {
        /* ignore */
      }
    }
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
  }
}
