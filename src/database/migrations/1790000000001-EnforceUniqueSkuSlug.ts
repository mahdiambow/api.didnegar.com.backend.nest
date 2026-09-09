import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceUniqueSkuSlug1790000000001 implements MigrationInterface {
  name = 'EnforceUniqueSkuSlug1790000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`products\`
      SET \`sku\` = CONCAT('SKU-', REPLACE(\`id\`, '-', ''))
      WHERE \`sku\` IS NULL OR TRIM(\`sku\`) = ''
    `);

    await queryRunner.query(`
      ALTER TABLE \`products\`
      MODIFY \`sku\` VARCHAR(100) NOT NULL
    `);

    const sellerIdIndex: Array<{ Key_name: string }> = await queryRunner.query(`
      SHOW INDEX FROM \`seller_offers\`
      WHERE Key_name = 'IDX_seller_offers_sellerId'
    `);
    if (sellerIdIndex.length === 0) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_seller_offers_sellerId\` ON \`seller_offers\` (\`sellerId\`)
      `);
    }

    const skuIndex: Array<{ Key_name: string }> = await queryRunner.query(`
      SHOW INDEX FROM \`seller_offers\`
      WHERE Key_name = 'IDX_seller_offers_sku'
    `);
    if (skuIndex.length === 0) {
      await queryRunner.query(`
        CREATE UNIQUE INDEX \`IDX_seller_offers_sku\` ON \`seller_offers\` (\`sku\`)
      `);
    }

    const compositeIndex: Array<{ Key_name: string }> = await queryRunner.query(`
      SHOW INDEX FROM \`seller_offers\`
      WHERE Key_name = 'IDX_seller_offers_sellerId_sku'
    `);
    if (compositeIndex.length > 0) {
      await queryRunner.query(`
        ALTER TABLE \`seller_offers\`
        DROP INDEX \`IDX_seller_offers_sellerId_sku\`
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`IDX_seller_offers_sellerId_sku\`
      ON \`seller_offers\` (\`sellerId\`, \`sku\`)
    `);
    await queryRunner.query(`
      ALTER TABLE \`seller_offers\` DROP INDEX \`IDX_seller_offers_sku\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`seller_offers\` DROP INDEX \`IDX_seller_offers_sellerId\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`products\`
      MODIFY \`sku\` VARCHAR(100) NULL
    `);
  }
}
