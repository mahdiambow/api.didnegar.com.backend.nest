import type { MigrationInterface, QueryRunner } from 'typeorm';

/** محصولات: JSON shippingMethod → FK shippingMethodId */
export class ProductShippingMethodId1790000000013 implements MigrationInterface {
  name = 'ProductShippingMethodId1790000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasShippingMethodId = await queryRunner.query(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME = 'shippingMethodId'
    `);

    if (Number(hasShippingMethodId?.[0]?.cnt ?? 0) === 0) {
      await queryRunner.query(`
        ALTER TABLE \`products\`
        ADD COLUMN \`shippingMethodId\` CHAR(26) NULL AFTER \`price\`,
        ADD INDEX \`IDX_products_shippingMethodId\` (\`shippingMethodId\`)
      `);
    }

    const hasShippingMethodJson = await queryRunner.query(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME = 'shippingMethod'
    `);

    if (Number(hasShippingMethodJson?.[0]?.cnt ?? 0) > 0) {
      await queryRunner.query(`
        UPDATE \`products\` p
        INNER JOIN \`shipping_methods\` sm
          ON sm.slug = JSON_UNQUOTE(JSON_EXTRACT(p.shippingMethod, '$.slug'))
        SET p.shippingMethodId = sm.id
        WHERE p.shippingMethod IS NOT NULL
          AND p.shippingMethodId IS NULL
      `);

      await queryRunner.query(`
        ALTER TABLE \`products\` DROP COLUMN \`shippingMethod\`
      `);
    }

    const hasFk = await queryRunner.query(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND CONSTRAINT_NAME = 'FK_products_shippingMethodId'
    `);

    if (Number(hasFk?.[0]?.cnt ?? 0) === 0) {
      await queryRunner.query(`
        ALTER TABLE \`products\`
        ADD CONSTRAINT \`FK_products_shippingMethodId\`
        FOREIGN KEY (\`shippingMethodId\`) REFERENCES \`shipping_methods\`(\`id\`)
        ON DELETE SET NULL ON UPDATE RESTRICT
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_products_shippingMethodId\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`products\`
      ADD COLUMN \`shippingMethod\` JSON NULL AFTER \`price\`
    `);
    await queryRunner.query(`
      UPDATE \`products\` p
      INNER JOIN \`shipping_methods\` sm ON sm.id = p.shippingMethodId
      SET p.shippingMethod = JSON_OBJECT(
        'slug', sm.slug,
        'name', sm.name,
        'price', sm.price,
        'isCod', sm.isCod,
        'isActive', sm.isActive,
        'sortOrder', sm.sortOrder
      )
      WHERE p.shippingMethodId IS NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`products\`
      DROP INDEX \`IDX_products_shippingMethodId\`,
      DROP COLUMN \`shippingMethodId\`
    `);
  }
}
