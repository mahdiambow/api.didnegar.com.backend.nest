import type { MigrationInterface, QueryRunner } from 'typeorm';

/** نظر محصول به پیشنهاد فروش (offer) هم لینک می‌شود */
export class AddReviewOfferId1790000000050 implements MigrationInterface {
  name = 'AddReviewOfferId1790000000050';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('reviews'))) return;
    const table = await queryRunner.getTable('reviews');
    if (table?.findColumnByName('offerId')) return;

    await queryRunner.query(`
      ALTER TABLE \`reviews\`
        ADD COLUMN \`offerId\` CHAR(26) NULL AFTER \`productId\`,
        ADD INDEX \`IDX_reviews_offerId\` (\`offerId\`)
    `);

    if (await queryRunner.hasTable('seller_offers')) {
      await queryRunner.query(`
        ALTER TABLE \`reviews\`
          ADD CONSTRAINT \`FK_reviews_offerId\`
          FOREIGN KEY (\`offerId\`) REFERENCES \`seller_offers\`(\`id\`)
          ON DELETE SET NULL ON UPDATE RESTRICT
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('reviews'))) return;
    const table = await queryRunner.getTable('reviews');
    if (!table?.findColumnByName('offerId')) return;

    const fk = table.foreignKeys.find((f) =>
      f.columnNames.includes('offerId'),
    );
    if (fk) {
      await queryRunner.query(
        `ALTER TABLE \`reviews\` DROP FOREIGN KEY \`${fk.name}\``,
      );
    }
    await queryRunner.query(`
      ALTER TABLE \`reviews\`
        DROP INDEX \`IDX_reviews_offerId\`,
        DROP COLUMN \`offerId\`
    `);
  }
}
