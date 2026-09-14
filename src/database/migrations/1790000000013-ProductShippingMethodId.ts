import type { MigrationInterface, QueryRunner } from 'typeorm';

function toCount(rows: Array<Record<string, unknown>> | undefined): number {
  const raw = rows?.[0]?.cnt ?? rows?.[0]?.CNT ?? 0;
  return Number(raw);
}

/** محصولات: JSON shippingMethod → FK shippingMethodId (idempotent for MySQL DDL) */
export class ProductShippingMethodId1790000000013 implements MigrationInterface {
  name = 'ProductShippingMethodId1790000000013';

  private async columnExists(
    queryRunner: QueryRunner,
    table: string,
    column: string,
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `
      SELECT COUNT(*) AS cnt
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
      [table, column],
    );
    return toCount(rows) > 0;
  }

  private async indexExists(
    queryRunner: QueryRunner,
    table: string,
    indexName: string,
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `
      SELECT COUNT(*) AS cnt
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
    `,
      [table, indexName],
    );
    return toCount(rows) > 0;
  }

  private async fkExists(
    queryRunner: QueryRunner,
    table: string,
    constraintName: string,
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `
      SELECT COUNT(*) AS cnt
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND CONSTRAINT_NAME = ?
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `,
      [table, constraintName],
    );
    return toCount(rows) > 0;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await this.columnExists(queryRunner, 'products', 'shippingMethodId'))) {
      await queryRunner.query(`
        ALTER TABLE \`products\`
        ADD COLUMN \`shippingMethodId\` CHAR(26) NULL AFTER \`price\`
      `);
    }

    if (
      !(await this.indexExists(
        queryRunner,
        'products',
        'IDX_products_shippingMethodId',
      ))
    ) {
      await queryRunner.query(`
        ALTER TABLE \`products\`
        ADD INDEX \`IDX_products_shippingMethodId\` (\`shippingMethodId\`)
      `);
    }

    if (await this.columnExists(queryRunner, 'products', 'shippingMethod')) {
      await queryRunner.query(`
        UPDATE \`products\` p
        INNER JOIN \`shipping_methods\` sm
          ON sm.slug = JSON_UNQUOTE(JSON_EXTRACT(p.shippingMethod, '$.slug'))
        SET p.shippingMethodId = sm.id
        WHERE p.shippingMethod IS NOT NULL
          AND p.shippingMethodId IS NULL
      `);

      // Re-check: MySQL DDL auto-commits; a prior half-run may already have dropped it
      if (await this.columnExists(queryRunner, 'products', 'shippingMethod')) {
        try {
          await queryRunner.query(`
            ALTER TABLE \`products\` DROP COLUMN \`shippingMethod\`
          `);
        } catch (error) {
          const err = error as { errno?: number; code?: string };
          // Already gone from a previous partial run
          if (err.errno !== 1091 && err.code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
            throw error;
          }
        }
      }
    }

    if (
      !(await this.fkExists(
        queryRunner,
        'products',
        'FK_products_shippingMethodId',
      ))
    ) {
      await queryRunner.query(`
        ALTER TABLE \`products\`
        ADD CONSTRAINT \`FK_products_shippingMethodId\`
        FOREIGN KEY (\`shippingMethodId\`) REFERENCES \`shipping_methods\`(\`id\`)
        ON DELETE SET NULL ON UPDATE RESTRICT
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (
      await this.fkExists(
        queryRunner,
        'products',
        'FK_products_shippingMethodId',
      )
    ) {
      await queryRunner.query(`
        ALTER TABLE \`products\` DROP FOREIGN KEY \`FK_products_shippingMethodId\`
      `);
    }

    if (!(await this.columnExists(queryRunner, 'products', 'shippingMethod'))) {
      await queryRunner.query(`
        ALTER TABLE \`products\`
        ADD COLUMN \`shippingMethod\` JSON NULL AFTER \`price\`
      `);
    }

    if (await this.columnExists(queryRunner, 'products', 'shippingMethodId')) {
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
    }

    if (
      await this.indexExists(
        queryRunner,
        'products',
        'IDX_products_shippingMethodId',
      )
    ) {
      await queryRunner.query(`
        ALTER TABLE \`products\` DROP INDEX \`IDX_products_shippingMethodId\`
      `);
    }

    if (await this.columnExists(queryRunner, 'products', 'shippingMethodId')) {
      await queryRunner.query(`
        ALTER TABLE \`products\` DROP COLUMN \`shippingMethodId\`
      `);
    }
  }
}
