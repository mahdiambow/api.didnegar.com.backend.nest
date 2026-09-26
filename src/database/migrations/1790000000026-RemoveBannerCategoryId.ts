import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveBannerCategoryId1790000000026 implements MigrationInterface {
  name = 'RemoveBannerCategoryId1790000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Init schema never added banners.categoryId — nothing to remove.
    if (!(await queryRunner.hasColumn('banners', 'categoryId'))) {
      return;
    }

    try {
      await queryRunner.query(
        `ALTER TABLE \`banners\` DROP FOREIGN KEY \`FK_banners_categoryId\``,
      );
    } catch {
      /* FK may not exist */
    }
    await queryRunner.query(
      `ALTER TABLE \`banners\` DROP CHECK \`CHK_banners_placement\``,
    );
    await queryRunner.query(
      `DROP INDEX \`UQ_banners_category_section\` ON \`banners\``,
    );
    // Keep one category_sidebar banner per section before unique index tightens
    await queryRunner.query(`
      DELETE b1 FROM \`banners\` b1
      INNER JOIN \`banners\` b2
        ON b1.\`page\` = 'category_sidebar'
        AND b2.\`page\` = 'category_sidebar'
        AND b1.\`section\` = b2.\`section\`
        AND b1.\`id\` > b2.\`id\`
    `);
    await queryRunner.query(
      `ALTER TABLE \`banners\` DROP COLUMN \`categoryId\``,
    );
    await queryRunner.query(`
      ALTER TABLE \`banners\` ADD CONSTRAINT \`CHK_banners_placement\` CHECK (
        (\`page\` = 'home' AND \`section\` IN ('main_slider', 'three_images', 'narrow_banner', 'video', 'two_images', 'single_banner'))
        OR (\`page\` = 'category_sidebar' AND \`section\` = 'sidebar')
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`UQ_banners_category_section\` ON \`banners\` ((CASE WHEN \`page\` = 'category_sidebar' THEN \`section\` ELSE NULL END))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX \`UQ_banners_category_section\` ON \`banners\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`banners\` DROP CHECK \`CHK_banners_placement\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`banners\` ADD \`categoryId\` CHAR(26) NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE \`banners\` ADD CONSTRAINT \`CHK_banners_placement\` CHECK (
        (\`page\` = 'home' AND \`categoryId\` IS NULL AND \`section\` IN ('main_slider', 'three_images', 'narrow_banner', 'video', 'two_images', 'single_banner'))
        OR (\`page\` = 'category_sidebar' AND \`categoryId\` IS NOT NULL AND \`section\` = 'sidebar')
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`UQ_banners_category_section\` ON \`banners\` ((CASE WHEN \`page\` = 'category_sidebar' THEN CONCAT(\`categoryId\`, ':', \`section\`) ELSE NULL END))
    `);
    await queryRunner.query(`
      ALTER TABLE \`banners\` ADD CONSTRAINT \`FK_banners_categoryId\` FOREIGN KEY (\`categoryId\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT
    `);
  }
}
