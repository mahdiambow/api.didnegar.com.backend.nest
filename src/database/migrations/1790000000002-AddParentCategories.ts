import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentCategories1790000000002 implements MigrationInterface {
  name = 'AddParentCategories1790000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`parent_categories\` (
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
        CONSTRAINT \`PK_parent_categories\` PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_parent_categories_slug\` (\`slug\`)
      ) ENGINE=InnoDB
    `);

    const parents: Array<{ id: string }> = await queryRunner.query(`
      SELECT id FROM \`parent_categories\` WHERE \`slug\` = 'digital' LIMIT 1
    `);

    let parentId = parents[0]?.id;
    if (!parentId) {
      parentId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      await queryRunner.query(
        `
        INSERT INTO \`parent_categories\`
          (\`id\`, \`legacyId\`, \`legacyTable\`, \`name\`, \`nameEn\`, \`slug\`, \`sort\`, \`isActive\`)
        VALUES (?, 1, 'parent_categories', 'کالای دیجیتال', 'Digital', 'digital', 0, 1)
      `,
        [parentId],
      );
    }

    const categoryCols: Array<{ Field: string }> = await queryRunner.query(`
      SHOW COLUMNS FROM \`categories\` LIKE 'parentCategoryId'
    `);
    if (categoryCols.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`categories\`
        ADD COLUMN \`parentCategoryId\` CHAR(36) NULL AFTER \`id\`
      `);
    }

    await queryRunner.query(
      `
      UPDATE \`categories\`
      SET \`parentCategoryId\` = ?
      WHERE \`parentCategoryId\` IS NULL
    `,
      [parentId],
    );

    await queryRunner.query(`
      ALTER TABLE \`categories\`
      MODIFY \`parentCategoryId\` CHAR(36) NOT NULL
    `);

    const parentIndex: Array<{ Key_name: string }> = await queryRunner.query(`
      SHOW INDEX FROM \`categories\`
      WHERE Key_name = 'IDX_categories_parentCategoryId'
    `);
    if (parentIndex.length === 0) {
      await queryRunner.query(`
        CREATE INDEX \`IDX_categories_parentCategoryId\`
        ON \`categories\` (\`parentCategoryId\`)
      `);
    }

    const fkRows: Array<{ CONSTRAINT_NAME: string }> = await queryRunner.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'categories'
        AND CONSTRAINT_NAME = 'FK_categories_parentCategoryId'
    `);
    if (fkRows.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`categories\`
        ADD CONSTRAINT \`FK_categories_parentCategoryId\`
        FOREIGN KEY (\`parentCategoryId\`) REFERENCES \`parent_categories\`(\`id\`)
        ON DELETE RESTRICT ON UPDATE RESTRICT
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`categories\` DROP FOREIGN KEY \`FK_categories_parentCategoryId\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`categories\` DROP INDEX \`IDX_categories_parentCategoryId\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`categories\` DROP COLUMN \`parentCategoryId\`
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS \`parent_categories\``);
  }
}
