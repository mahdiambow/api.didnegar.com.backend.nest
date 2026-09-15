import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdmins1790000000017 implements MigrationInterface {
  name = 'CreateAdmins1790000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`admins\` (
        \`id\` CHAR(26) NOT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`email\` VARCHAR(150) NULL,
        \`phone\` VARCHAR(20) NOT NULL,
        \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
        \`createdAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT \`PK_admins\` PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_admins_email\` (\`email\`),
        UNIQUE INDEX \`IDX_admins_phone\` (\`phone\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`users\`
        ADD COLUMN \`adminId\` CHAR(26) NULL AFTER \`sellerId\`
    `);

    await queryRunner.query(`
      ALTER TABLE \`users\`
        ADD CONSTRAINT \`FK_users_adminId\`
          FOREIGN KEY (\`adminId\`) REFERENCES \`admins\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE RESTRICT
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_users_adminId\` ON \`users\` (\`adminId\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `users` DROP FOREIGN KEY `FK_users_adminId`',
    );
    await queryRunner.query('DROP INDEX `IDX_users_adminId` ON `users`');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `adminId`');
    await queryRunner.query('DROP TABLE IF EXISTS `admins`');
  }
}
