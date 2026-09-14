import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNewsletterSubscriptions1790000000016
  implements MigrationInterface
{
  name = 'CreateNewsletterSubscriptions1790000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`newsletter_subscriptions\` (
        \`id\` CHAR(26) NOT NULL,
        \`userId\` CHAR(26) NOT NULL,
        \`email\` VARCHAR(150) NOT NULL,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_newsletter_subscriptions\` PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_newsletter_subscriptions_userId\` (\`userId\`),
        INDEX \`IDX_newsletter_subscriptions_email\` (\`email\`),
        CONSTRAINT \`FK_newsletter_subscriptions_userId\`
          FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`)
          ON DELETE CASCADE ON UPDATE RESTRICT
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `newsletter_subscriptions`');
  }
}
