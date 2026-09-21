import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Covering-ish index for approved offer list ordered by price,id
 * and cheap COUNT WHERE approvalStatus = 'approved'.
 */
export class IndexSellerOffersListQuery1790000000032
  implements MigrationInterface
{
  name = 'IndexSellerOffersListQuery1790000000032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX \`IDX_seller_offers_approval_price_id\`
      ON \`seller_offers\` (\`approvalStatus\`, \`price\`, \`id\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX `IDX_seller_offers_approval_price_id` ON `seller_offers`',
    );
  }
}
