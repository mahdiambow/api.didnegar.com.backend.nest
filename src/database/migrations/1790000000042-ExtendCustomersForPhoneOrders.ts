import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phone-order customers (super-seller): phone + seller ownership.
 * Legacy import fields become nullable for manual creates.
 */
export class ExtendCustomersForPhoneOrders1790000000042
  implements MigrationInterface
{
  name = 'ExtendCustomersForPhoneOrders1790000000042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`customers\`
        MODIFY \`legacyId\` BIGINT NULL,
        MODIFY \`legacyTable\` VARCHAR(255) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`customers\`
        ADD COLUMN \`phone\` VARCHAR(20) NULL AFTER \`email\`,
        ADD COLUMN \`sellerId\` CHAR(26) NULL AFTER \`userId\`,
        ADD COLUMN \`createdByUserId\` CHAR(26) NULL AFTER \`sellerId\`,
        ADD INDEX \`IDX_customers_phone\` (\`phone\`),
        ADD INDEX \`IDX_customers_sellerId\` (\`sellerId\`),
        ADD INDEX \`IDX_customers_createdByUserId\` (\`createdByUserId\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`customers\`
        ADD CONSTRAINT \`FK_customers_sellerId\`
          FOREIGN KEY (\`sellerId\`) REFERENCES \`sellers\`(\`id\`)
          ON DELETE SET NULL ON UPDATE RESTRICT,
        ADD CONSTRAINT \`FK_customers_createdByUserId\`
          FOREIGN KEY (\`createdByUserId\`) REFERENCES \`users\`(\`id\`)
          ON DELETE SET NULL ON UPDATE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`customers\`
        DROP FOREIGN KEY \`FK_customers_sellerId\`,
        DROP FOREIGN KEY \`FK_customers_createdByUserId\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`customers\`
        DROP INDEX \`IDX_customers_phone\`,
        DROP INDEX \`IDX_customers_sellerId\`,
        DROP INDEX \`IDX_customers_createdByUserId\`,
        DROP COLUMN \`phone\`,
        DROP COLUMN \`sellerId\`,
        DROP COLUMN \`createdByUserId\`
    `);
    await queryRunner.query(`
      UPDATE \`customers\`
      SET \`legacyId\` = 0, \`legacyTable\` = 'unknown'
      WHERE \`legacyId\` IS NULL OR \`legacyTable\` IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`customers\`
        MODIFY \`legacyId\` BIGINT NOT NULL,
        MODIFY \`legacyTable\` VARCHAR(255) NOT NULL
    `);
  }
}
