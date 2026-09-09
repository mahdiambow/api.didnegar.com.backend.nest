import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * MariaDB baseline schema matching current entity definitions.
 * Requires a fresh MariaDB database (do not run against existing PostgreSQL data).
 */
export class InitMariaDbSchema1790000000000 implements MigrationInterface {
  name = 'InitMariaDbSchema1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- sellers ---
    await queryRunner.query(`
      CREATE TABLE \`sellers\` (
        \`id\` CHAR(36) NOT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`slug\` VARCHAR(100) NOT NULL,
        \`businessName\` VARCHAR(200) NOT NULL,
        \`businessType\` VARCHAR(50) NOT NULL DEFAULT 'other',
        \`email\` VARCHAR(150) NOT NULL,
        \`phone\` VARCHAR(20) NOT NULL,
        \`nationalId\` VARCHAR(20) NULL,
        \`registrationNumber\` VARCHAR(50) NULL,
        \`address\` VARCHAR(500) NULL,
        \`city\` VARCHAR(100) NULL,
        \`postalCode\` VARCHAR(20) NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'active',
        \`settings\` JSON NOT NULL DEFAULT ('{}'),
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_sellers\` PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_sellers_slug\` (\`slug\`)
      ) ENGINE=InnoDB
    `);

    // --- roles ---
    await queryRunner.query(`
      CREATE TABLE \`roles\` (
        \`id\` CHAR(36) NOT NULL,
        \`slug\` VARCHAR(50) NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`permissions\` JSON NOT NULL DEFAULT ('[]'),
        \`isSystem\` TINYINT(1) NOT NULL DEFAULT 0,
        \`sellerId\` CHAR(36) NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_roles\` PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_roles_sellerId\` FOREIGN KEY (\`sellerId\`) REFERENCES \`sellers\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- users ---
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` CHAR(36) NOT NULL,
        \`legacyId\` BIGINT NULL,
        \`legacyTable\` VARCHAR(100) NULL,
        \`username\` VARCHAR(20) NOT NULL,
        \`password\` VARCHAR(255) NULL,
        \`email\` VARCHAR(150) NULL,
        \`displayName\` VARCHAR(150) NULL,
        \`firstName\` VARCHAR(100) NULL,
        \`lastName\` VARCHAR(100) NULL,
        \`website\` VARCHAR(255) NULL,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`roleId\` CHAR(36) NOT NULL,
        \`extraRoleIds\` JSON NOT NULL DEFAULT ('[]'),
        \`sellerId\` CHAR(36) NULL,
        \`otpCode\` VARCHAR(72) NULL,
        \`otpExpiresAt\` DATETIME(6) NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_users\` PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_users_username\` (\`username\`),
        CONSTRAINT \`FK_users_roleId\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_users_sellerId\` FOREIGN KEY (\`sellerId\`) REFERENCES \`sellers\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- refresh_tokens ---
    await queryRunner.query(`
      CREATE TABLE \`refresh_tokens\` (
        \`id\` CHAR(36) NOT NULL,
        \`userId\` CHAR(36) NOT NULL,
        \`tokenHash\` VARCHAR(255) NOT NULL,
        \`expiresAt\` DATETIME(6) NOT NULL,
        \`revoked\` TINYINT(1) NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_refresh_tokens\` PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_refresh_tokens_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- user_profiles ---
    await queryRunner.query(`
      CREATE TABLE \`user_profiles\` (
        \`id\` CHAR(36) NOT NULL,
        \`userId\` CHAR(36) NOT NULL,
        \`nationalCode\` VARCHAR(10) NULL,
        \`birthDate\` DATE NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_user_profiles\` PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_user_profiles_userId\` (\`userId\`),
        UNIQUE INDEX \`IDX_user_profiles_nationalCode\` (\`nationalCode\`),
        CONSTRAINT \`FK_user_profiles_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- user_addresses ---
    await queryRunner.query(`
      CREATE TABLE \`user_addresses\` (
        \`id\` CHAR(36) NOT NULL,
        \`userId\` CHAR(36) NOT NULL,
        \`title\` VARCHAR(100) NOT NULL,
        \`province\` VARCHAR(100) NOT NULL,
        \`city\` VARCHAR(100) NOT NULL,
        \`addressDetail\` TEXT NOT NULL,
        \`postalCode\` VARCHAR(10) NOT NULL,
        \`plaque\` VARCHAR(20) NULL,
        \`unit\` VARCHAR(20) NULL,
        \`description\` TEXT NULL,
        \`lat\` DECIMAL(10,7) NULL,
        \`long\` DECIMAL(10,7) NULL,
        \`recipientFullName\` VARCHAR(150) NOT NULL,
        \`recipientPhone\` VARCHAR(20) NOT NULL,
        \`isDefault\` TINYINT(1) NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_user_addresses\` PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_user_addresses_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- seller_contracts ---
    await queryRunner.query(`
      CREATE TABLE \`seller_contracts\` (
        \`id\` CHAR(36) NOT NULL,
        \`sellerId\` CHAR(36) NULL,
        \`sellerName\` VARCHAR(150) NOT NULL,
        \`userIds\` JSON NOT NULL DEFAULT ('[]'),
        \`contractPartyName\` VARCHAR(150) NOT NULL,
        \`description\` TEXT NULL,
        \`contractDate\` DATETIME(6) NOT NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_seller_contracts\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_seller_contracts_sellerId\` (\`sellerId\`),
        CONSTRAINT \`FK_seller_contracts_sellerId\` FOREIGN KEY (\`sellerId\`) REFERENCES \`sellers\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- countries ---
    await queryRunner.query(`
      CREATE TABLE \`countries\` (
        \`id\` CHAR(36) NOT NULL,
        \`code\` VARCHAR(100) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_countries\` PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_countries_code\` (\`code\`)
      ) ENGINE=InnoDB
    `);

    // --- states ---
    await queryRunner.query(`
      CREATE TABLE \`states\` (
        \`id\` CHAR(36) NOT NULL,
        \`countryId\` CHAR(36) NOT NULL,
        \`code\` VARCHAR(255) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_states\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_states_countryId\` (\`countryId\`),
        UNIQUE INDEX \`IDX_states_countryId_code\` (\`countryId\`, \`code\`),
        CONSTRAINT \`FK_states_countryId\` FOREIGN KEY (\`countryId\`) REFERENCES \`countries\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- cities ---
    await queryRunner.query(`
      CREATE TABLE \`cities\` (
        \`id\` CHAR(36) NOT NULL,
        \`countryId\` CHAR(36) NULL,
        \`stateId\` CHAR(36) NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_cities\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_cities_countryId\` (\`countryId\`),
        INDEX \`IDX_cities_stateId\` (\`stateId\`),
        INDEX \`IDX_cities_name\` (\`name\`),
        CONSTRAINT \`FK_cities_countryId\` FOREIGN KEY (\`countryId\`) REFERENCES \`countries\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT,
        CONSTRAINT \`FK_cities_stateId\` FOREIGN KEY (\`stateId\`) REFERENCES \`states\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- brands ---
    await queryRunner.query(`
      CREATE TABLE \`brands\` (
        \`id\` CHAR(36) NOT NULL,
        \`legacyId\` BIGINT NOT NULL,
        \`legacyTable\` VARCHAR(255) NOT NULL,
        \`name\` VARCHAR(200) NOT NULL,
        \`slug\` VARCHAR(200) NOT NULL,
        \`description\` TEXT NULL,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_brands\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_brands_name\` (\`name\`),
        UNIQUE INDEX \`IDX_brands_slug\` (\`slug\`),
        UNIQUE INDEX \`IDX_brands_legacyTable_legacyId\` (\`legacyTable\`, \`legacyId\`)
      ) ENGINE=InnoDB
    `);

    // --- categories ---
    await queryRunner.query(`
      CREATE TABLE \`categories\` (
        \`id\` CHAR(36) NOT NULL,
        \`legacyId\` BIGINT NULL,
        \`legacyTable\` VARCHAR(255) NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`nameEn\` VARCHAR(255) NULL,
        \`slug\` VARCHAR(200) NOT NULL,
        \`sort\` INT NOT NULL DEFAULT 0,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_categories\` PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_categories_slug\` (\`slug\`)
      ) ENGINE=InnoDB
    `);

    // --- sub_categories ---
    await queryRunner.query(`
      CREATE TABLE \`sub_categories\` (
        \`id\` CHAR(36) NOT NULL,
        \`categoryId\` CHAR(36) NOT NULL,
        \`legacyId\` BIGINT NULL,
        \`legacyTable\` VARCHAR(255) NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`nameEn\` VARCHAR(255) NULL,
        \`slug\` VARCHAR(200) NOT NULL,
        \`sort\` INT NOT NULL DEFAULT 0,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_sub_categories\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_sub_categories_categoryId\` (\`categoryId\`),
        UNIQUE INDEX \`IDX_sub_categories_categoryId_slug\` (\`categoryId\`, \`slug\`),
        CONSTRAINT \`FK_sub_categories_categoryId\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- attributes ---
    await queryRunner.query(`
      CREATE TABLE \`attributes\` (
        \`id\` CHAR(36) NOT NULL,
        \`legacyId\` BIGINT NOT NULL,
        \`legacyTable\` VARCHAR(255) NOT NULL,
        \`name\` VARCHAR(200) NOT NULL,
        \`label\` VARCHAR(200) NOT NULL,
        \`isPublic\` TINYINT(1) NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_attributes\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_attributes_name\` (\`name\`),
        UNIQUE INDEX \`IDX_attributes_legacyTable_legacyId\` (\`legacyTable\`, \`legacyId\`)
      ) ENGINE=InnoDB
    `);

    // --- shipping_methods ---
    await queryRunner.query(`
      CREATE TABLE \`shipping_methods\` (
        \`id\` CHAR(36) NOT NULL,
        \`slug\` VARCHAR(100) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`price\` DECIMAL(19,4) NOT NULL DEFAULT 0,
        \`isCod\` TINYINT(1) NOT NULL DEFAULT 1,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`sortOrder\` INT NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_shipping_methods\` PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_shipping_methods_slug\` (\`slug\`)
      ) ENGINE=InnoDB
    `);

    // --- products ---
    await queryRunner.query(`
      CREATE TABLE \`products\` (
        \`id\` CHAR(36) NOT NULL,
        \`legacyId\` BIGINT NOT NULL,
        \`legacyTable\` VARCHAR(255) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`subtitle\` VARCHAR(255) NULL,
        \`excerpt\` TEXT NULL,
        \`slug\` VARCHAR(200) NOT NULL,
        \`description\` TEXT NULL,
        \`shortDescription\` TEXT NULL,
        \`sku\` VARCHAR(100) NULL,
        \`status\` VARCHAR(50) NOT NULL DEFAULT 'publish',
        \`approvalStatus\` VARCHAR(20) NOT NULL DEFAULT 'pending',
        \`rejectionReason\` TEXT NULL,
        \`brandId\` CHAR(36) NULL,
        \`isVirtual\` TINYINT(1) NOT NULL DEFAULT 0,
        \`isDownloadable\` TINYINT(1) NOT NULL DEFAULT 0,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`isFeatured\` TINYINT(1) NOT NULL DEFAULT 0,
        \`seo\` JSON NOT NULL DEFAULT ('[]'),
        \`image\` JSON NOT NULL DEFAULT ('{"featuredImg":null,"gallery":[]}'),
        \`price\` JSON NULL,
        \`shippingMethod\` JSON NULL,
        \`tableInfo\` JSON NOT NULL DEFAULT ('[]'),
        \`ratingCount\` INT NOT NULL DEFAULT 0,
        \`averageRating\` DECIMAL(3,2) NOT NULL DEFAULT 0,
        \`totalSales\` INT NOT NULL DEFAULT 0,
        \`taxStatus\` VARCHAR(50) NULL,
        \`taxClass\` VARCHAR(100) NULL,
        \`globalUniqueId\` VARCHAR(100) NULL,
        \`weight\` DECIMAL(10,2) NULL,
        \`length\` DECIMAL(10,2) NULL,
        \`width\` DECIMAL(10,2) NULL,
        \`height\` DECIMAL(10,2) NULL,
        \`attributeIds\` JSON NOT NULL DEFAULT ('[]'),
        \`sellerIds\` JSON NOT NULL DEFAULT ('[]'),
        \`createdBySellerId\` CHAR(36) NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_products\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_products_name\` (\`name\`),
        UNIQUE INDEX \`IDX_products_slug\` (\`slug\`),
        UNIQUE INDEX \`IDX_products_sku\` (\`sku\`),
        INDEX \`IDX_products_status\` (\`status\`),
        INDEX \`IDX_products_approvalStatus\` (\`approvalStatus\`),
        INDEX \`IDX_products_brandId\` (\`brandId\`),
        UNIQUE INDEX \`IDX_products_legacyTable_legacyId\` (\`legacyTable\`, \`legacyId\`),
        CONSTRAINT \`FK_products_brandId\` FOREIGN KEY (\`brandId\`) REFERENCES \`brands\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- product_stocks ---
    await queryRunner.query(`
      CREATE TABLE \`product_stocks\` (
        \`id\` CHAR(36) NOT NULL,
        \`productId\` CHAR(36) NOT NULL,
        \`stock\` INT NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_product_stocks\` PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_product_stocks_productId\` (\`productId\`),
        CONSTRAINT \`CHK_product_stock\` CHECK (\`stock\` >= 0),
        CONSTRAINT \`FK_product_stocks_productId\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- product_variants ---
    await queryRunner.query(`
      CREATE TABLE \`product_variants\` (
        \`id\` CHAR(36) NOT NULL,
        \`product_id\` CHAR(36) NOT NULL,
        CONSTRAINT \`PK_product_variants\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_product_variants_product_id\` (\`product_id\`),
        CONSTRAINT \`FK_product_variants_product_id\` FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- product_categories ---
    await queryRunner.query(`
      CREATE TABLE \`product_categories\` (
        \`id\` CHAR(36) NOT NULL,
        \`productId\` CHAR(36) NOT NULL,
        \`categoryId\` CHAR(36) NULL,
        \`subCategoryId\` CHAR(36) NULL,
        \`isPrimary\` TINYINT(1) NOT NULL DEFAULT 0,
        \`position\` INT NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_product_categories\` PRIMARY KEY (\`id\`),
        INDEX \`idx_product_categories_productId\` (\`productId\`),
        INDEX \`idx_product_categories_categoryId\` (\`categoryId\`),
        INDEX \`idx_product_categories_subCategoryId\` (\`subCategoryId\`),
        UNIQUE INDEX \`uq_product_category\` (\`productId\`, \`categoryId\`, \`subCategoryId\`),
        CONSTRAINT \`FK_product_categories_productId\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_product_categories_categoryId\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_product_categories_subCategoryId\` FOREIGN KEY (\`subCategoryId\`) REFERENCES \`sub_categories\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    // --- seller_offers ---
    await queryRunner.query(`
      CREATE TABLE \`seller_offers\` (
        \`id\` CHAR(36) NOT NULL,
        \`sellerId\` CHAR(36) NOT NULL,
        \`productId\` CHAR(36) NOT NULL,
        \`attributes\` JSON NOT NULL DEFAULT ('{}'),
        \`sku\` VARCHAR(100) NOT NULL,
        \`price\` DECIMAL(19,4) NOT NULL,
        \`stock\` INT NOT NULL DEFAULT 0,
        \`stockStatus\` VARCHAR(50) NOT NULL DEFAULT 'outofstock',
        \`isOnSale\` TINYINT(1) NOT NULL DEFAULT 0,
        \`taxStatus\` VARCHAR(50) NULL,
        \`taxClass\` VARCHAR(100) NULL,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`approvalStatus\` VARCHAR(20) NOT NULL DEFAULT 'approved',
        \`rejectionReason\` TEXT NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_seller_offers\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_seller_offers_productId\` (\`productId\`),
        INDEX \`IDX_seller_offers_approvalStatus\` (\`approvalStatus\`),
        UNIQUE INDEX \`IDX_seller_offers_sellerId_sku\` (\`sellerId\`, \`sku\`),
        CONSTRAINT \`CHK_offer_price\` CHECK (\`price\` >= 0),
        CONSTRAINT \`CHK_offer_stock\` CHECK (\`stock\` >= 0),
        CONSTRAINT \`FK_seller_offers_sellerId\` FOREIGN KEY (\`sellerId\`) REFERENCES \`sellers\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_seller_offers_productId\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- offer_products ---
    await queryRunner.query(`
      CREATE TABLE \`offer_products\` (
        \`id\` CHAR(36) NOT NULL,
        \`sellerId\` CHAR(36) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`slug\` VARCHAR(200) NOT NULL,
        \`description\` TEXT NULL,
        \`shortDescription\` TEXT NULL,
        \`brandId\` CHAR(36) NULL,
        \`categoryIds\` JSON NOT NULL DEFAULT ('[]'),
        \`attributes\` JSON NOT NULL DEFAULT ('{}'),
        \`isVirtual\` TINYINT(1) NOT NULL DEFAULT 0,
        \`isDownloadable\` TINYINT(1) NOT NULL DEFAULT 0,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`taxStatus\` VARCHAR(50) NULL,
        \`taxClass\` VARCHAR(100) NULL,
        \`weight\` DECIMAL(10,2) NULL,
        \`length\` DECIMAL(10,2) NULL,
        \`width\` DECIMAL(10,2) NULL,
        \`height\` DECIMAL(10,2) NULL,
        \`sku\` VARCHAR(100) NOT NULL,
        \`price\` DECIMAL(19,4) NOT NULL,
        \`stock\` INT NOT NULL DEFAULT 0,
        \`stockStatus\` VARCHAR(50) NOT NULL DEFAULT 'outofstock',
        \`isOnSale\` TINYINT(1) NOT NULL DEFAULT 0,
        \`approvalStatus\` VARCHAR(20) NOT NULL DEFAULT 'pending',
        \`rejectionReason\` TEXT NULL,
        \`productId\` CHAR(36) NULL,
        \`offerId\` CHAR(36) NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_offer_products\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_offer_products_sellerId\` (\`sellerId\`),
        INDEX \`IDX_offer_products_approvalStatus\` (\`approvalStatus\`),
        UNIQUE INDEX \`IDX_offer_products_slug\` (\`slug\`),
        CONSTRAINT \`CHK_offer_product_price\` CHECK (\`price\` >= 0),
        CONSTRAINT \`CHK_offer_product_stock\` CHECK (\`stock\` >= 0),
        CONSTRAINT \`FK_offer_products_sellerId\` FOREIGN KEY (\`sellerId\`) REFERENCES \`sellers\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_offer_products_productId\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT,
        CONSTRAINT \`FK_offer_products_offerId\` FOREIGN KEY (\`offerId\`) REFERENCES \`seller_offers\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- orders ---
    await queryRunner.query(`
      CREATE TABLE \`orders\` (
        \`id\` CHAR(36) NOT NULL,
        \`userId\` CHAR(36) NOT NULL,
        \`shippingMethodId\` CHAR(36) NULL,
        \`subtotal\` DECIMAL(19,4) NOT NULL,
        \`shippingAmount\` DECIMAL(19,4) NOT NULL DEFAULT 0,
        \`amount\` DECIMAL(19,4) NOT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'pending',
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_orders\` PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_orders_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT \`FK_orders_shippingMethodId\` FOREIGN KEY (\`shippingMethodId\`) REFERENCES \`shipping_methods\`(\`id\`) ON DELETE SET NULL ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- order_items ---
    await queryRunner.query(`
      CREATE TABLE \`order_items\` (
        \`id\` CHAR(36) NOT NULL,
        \`orderId\` CHAR(36) NOT NULL,
        \`productId\` CHAR(36) NOT NULL,
        \`offerId\` CHAR(36) NULL,
        \`attributes\` JSON NOT NULL DEFAULT ('{}'),
        \`sellerId\` CHAR(36) NULL,
        \`sku\` VARCHAR(100) NULL,
        \`quantity\` INT NOT NULL,
        \`unitPrice\` DECIMAL(19,4) NOT NULL,
        CONSTRAINT \`PK_order_items\` PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_order_items_orderId\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT,
        CONSTRAINT \`FK_order_items_productId\` FOREIGN KEY (\`productId\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT \`FK_order_items_offerId\` FOREIGN KEY (\`offerId\`) REFERENCES \`seller_offers\`(\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- payments ---
    await queryRunner.query(`
      CREATE TABLE \`payments\` (
        \`id\` CHAR(36) NOT NULL,
        \`orderId\` CHAR(36) NOT NULL,
        \`gateway\` VARCHAR(20) NOT NULL DEFAULT 'zarinpal',
        \`authority\` VARCHAR(100) NOT NULL,
        \`refId\` VARCHAR(100) NULL,
        \`amount\` DECIMAL(19,4) NOT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'pending',
        \`callbackUrl\` VARCHAR(500) NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_payments\` PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_payments_orderId\` (\`orderId\`),
        UNIQUE INDEX \`IDX_payments_authority\` (\`authority\`),
        CONSTRAINT \`FK_payments_orderId\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);

    // --- header_settings ---
    await queryRunner.query(`
      CREATE TABLE \`header_settings\` (
        \`id\` SMALLINT NOT NULL DEFAULT 1,
        \`text\` TEXT NOT NULL,
        \`phoneNumber\` VARCHAR(50) NULL,
        \`instagram\` VARCHAR(2048) NULL,
        \`whatsapp\` VARCHAR(2048) NULL,
        \`telegram\` VARCHAR(2048) NULL,
        \`bale\` VARCHAR(2048) NULL,
        \`rubika\` VARCHAR(2048) NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_header_settings\` PRIMARY KEY (\`id\`),
        CONSTRAINT \`CHK_header_settings_singleton\` CHECK (\`id\` = 1)
      ) ENGINE=InnoDB
    `);

    // --- footer_settings ---
    await queryRunner.query(`
      CREATE TABLE \`footer_settings\` (
        \`id\` SMALLINT NOT NULL DEFAULT 1,
        \`address\` TEXT NOT NULL,
        \`phoneNumber\` VARCHAR(50) NOT NULL,
        \`email\` VARCHAR(254) NOT NULL,
        \`workingHours\` VARCHAR(500) NOT NULL,
        \`instagram\` VARCHAR(2048) NULL,
        \`whatsapp\` VARCHAR(2048) NULL,
        \`telegram\` VARCHAR(2048) NULL,
        \`bale\` VARCHAR(2048) NULL,
        \`rubika\` VARCHAR(2048) NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_footer_settings\` PRIMARY KEY (\`id\`),
        CONSTRAINT \`CHK_footer_settings_singleton\` CHECK (\`id\` = 1)
      ) ENGINE=InnoDB
    `);

    // --- banners ---
    // Partial unique indexes (PG WHERE) approximated with functional unique indexes (MariaDB).
    await queryRunner.query(`
      CREATE TABLE \`banners\` (
        \`id\` CHAR(36) NOT NULL,
        \`page\` VARCHAR(30) NOT NULL,
        \`section\` VARCHAR(30) NOT NULL,
        \`categoryId\` CHAR(36) NULL,
        \`items\` JSON NOT NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_banners\` PRIMARY KEY (\`id\`),
        CONSTRAINT \`CHK_banners_placement\` CHECK (
          (\`page\` = 'home' AND \`categoryId\` IS NULL AND \`section\` IN ('main_slider', 'three_images', 'narrow_banner', 'video', 'two_images', 'single_banner'))
          OR (\`page\` = 'category_sidebar' AND \`categoryId\` IS NOT NULL AND \`section\` = 'sidebar')
        ),
        CONSTRAINT \`FK_banners_categoryId\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`UQ_banners_home_section\` ON \`banners\` ((CASE WHEN \`page\` = 'home' THEN \`section\` ELSE NULL END))
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`UQ_banners_category_section\` ON \`banners\` ((CASE WHEN \`page\` = 'category_sidebar' THEN CONCAT(\`categoryId\`, ':', \`section\`) ELSE NULL END))
    `);

    // --- about_us ---
    await queryRunner.query(`
      CREATE TABLE \`about_us\` (
        \`id\` SMALLINT NOT NULL DEFAULT 1,
        \`title\` VARCHAR(255) NOT NULL,
        \`content\` TEXT NOT NULL,
        \`faqs\` JSON NOT NULL DEFAULT ('[]'),
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_about_us\` PRIMARY KEY (\`id\`),
        CONSTRAINT \`CHK_about_us_singleton\` CHECK (\`id\` = 1)
      ) ENGINE=InnoDB
    `);

    // --- contact_settings ---
    await queryRunner.query(`
      CREATE TABLE \`contact_settings\` (
        \`id\` SMALLINT NOT NULL DEFAULT 1,
        \`address\` TEXT NOT NULL,
        \`latitude\` DECIMAL(10,7) NULL,
        \`longitude\` DECIMAL(10,7) NULL,
        \`phoneNumber\` VARCHAR(50) NOT NULL,
        \`workingHours\` VARCHAR(500) NOT NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_contact_settings\` PRIMARY KEY (\`id\`),
        CONSTRAINT \`CHK_contact_settings_singleton\` CHECK (\`id\` = 1)
      ) ENGINE=InnoDB
    `);

    // --- contact_messages ---
    await queryRunner.query(`
      CREATE TABLE \`contact_messages\` (
        \`id\` CHAR(36) NOT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`email\` VARCHAR(254) NULL,
        \`phoneNumber\` VARCHAR(50) NULL,
        \`subject\` VARCHAR(255) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`isRead\` TINYINT(1) NOT NULL DEFAULT 0,
        \`internalNote\` TEXT NULL,
        \`reply\` TEXT NULL,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_contact_messages\` PRIMARY KEY (\`id\`),
        INDEX \`IDX_contact_messages_isRead\` (\`isRead\`)
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`contact_messages\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`contact_settings\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`about_us\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`banners\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`footer_settings\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`header_settings\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`payments\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`order_items\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`orders\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`offer_products\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`seller_offers\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`product_categories\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`product_variants\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`product_stocks\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`products\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`shipping_methods\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`attributes\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`sub_categories\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`categories\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`brands\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`cities\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`states\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`countries\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`seller_contracts\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`user_addresses\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`user_profiles\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`refresh_tokens\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`users\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`roles\``);
    await queryRunner.query(`DROP TABLE IF EXISTS \`sellers\``);
  }
}
