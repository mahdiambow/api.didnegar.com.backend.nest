import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes the artificial parent «دسته‌های مهاجرت‌شده» (legacy-import / 01M2DDJ0SAM1DG2GYWMZCYDZDV).
 *
 * Before: parent(legacy-import) → category → sub_category
 * After:  parent(former category) → category(former sub) [+ catch-all category = former mid id]
 */
export class RemoveLegacyImportParent1790000000015
  implements MigrationInterface
{
  name = 'RemoveLegacyImportParent1790000000015';

  private readonly legacyParentId = '01M2DDJ0SAM1DG2GYWMZCYDZDV';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const parents: Array<{ id: string }> = await queryRunner.query(
      `
      SELECT id FROM \`parent_categories\`
      WHERE id = ? OR slug = 'legacy-import'
      LIMIT 1
    `,
      [this.legacyParentId],
    );

    const legacyParentId = parents[0]?.id;
    if (!legacyParentId) {
      return;
    }

    const legacyCategoryIds: Array<{ id: string }> = await queryRunner.query(
      `
      SELECT id FROM \`categories\` WHERE \`parentCategoryId\` = ?
    `,
      [legacyParentId],
    );

    if (legacyCategoryIds.length === 0) {
      await queryRunner.query(
        `DELETE FROM \`parent_categories\` WHERE \`id\` = ?`,
        [legacyParentId],
      );
      return;
    }

    const legacyCatIdList = legacyCategoryIds.map((row) => row.id);
    const legacyCatPlaceholders = legacyCatIdList.map(() => '?').join(', ');

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

    try {
      await queryRunner.query(
        `
        INSERT INTO \`parent_categories\`
          (\`id\`, \`legacyId\`, \`legacyTable\`, \`name\`, \`nameEn\`, \`slug\`,
           \`icon\`, \`image\`, \`sort\`, \`isActive\`, \`createdAt\`, \`updatedAt\`)
        SELECT
          c.\`id\`, c.\`legacyId\`, c.\`legacyTable\`, c.\`name\`, c.\`nameEn\`, c.\`slug\`,
          c.\`icon\`, c.\`image\`, c.\`sort\`, c.\`isActive\`, c.\`createdAt\`, c.\`updatedAt\`
        FROM \`categories\` c
        WHERE c.\`id\` IN (${legacyCatPlaceholders})
          AND NOT EXISTS (SELECT 1 FROM \`parent_categories\` p WHERE p.\`id\` = c.\`id\`)
          AND NOT EXISTS (SELECT 1 FROM \`parent_categories\` p WHERE p.\`slug\` = c.\`slug\`)
      `,
        legacyCatIdList,
      );

      await queryRunner.query(
        `
        INSERT INTO \`categories\`
          (\`id\`, \`parentCategoryId\`, \`legacyId\`, \`legacyTable\`, \`name\`, \`nameEn\`,
           \`slug\`, \`icon\`, \`image\`, \`sort\`, \`isActive\`, \`createdAt\`, \`updatedAt\`)
        SELECT
          s.\`id\`,
          s.\`categoryId\`,
          s.\`legacyId\`,
          s.\`legacyTable\`,
          s.\`name\`,
          s.\`nameEn\`,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM \`categories\` existing WHERE existing.\`slug\` = s.\`slug\`
            ) THEN CONCAT(LEFT(s.\`slug\`, 180), '-', RIGHT(s.\`id\`, 6))
            ELSE s.\`slug\`
          END,
          s.\`icon\`,
          s.\`image\`,
          s.\`sort\`,
          s.\`isActive\`,
          s.\`createdAt\`,
          s.\`updatedAt\`
        FROM \`sub_categories\` s
        WHERE s.\`categoryId\` IN (${legacyCatPlaceholders})
          AND NOT EXISTS (SELECT 1 FROM \`categories\` existing WHERE existing.\`id\` = s.\`id\`)
      `,
        legacyCatIdList,
      );

      await queryRunner.query(
        `
        UPDATE \`product_categories\` pc
        INNER JOIN \`sub_categories\` s ON s.\`id\` = pc.\`subCategoryId\`
        SET
          pc.\`categoryId\` = pc.\`subCategoryId\`,
          pc.\`subCategoryId\` = NULL
        WHERE s.\`categoryId\` IN (${legacyCatPlaceholders})
      `,
        legacyCatIdList,
      );

      await queryRunner.query(
        `
        UPDATE \`categories\`
        SET \`parentCategoryId\` = \`id\`
        WHERE \`id\` IN (${legacyCatPlaceholders})
      `,
        legacyCatIdList,
      );

      await queryRunner.query(
        `
        DELETE s FROM \`sub_categories\` s
        INNER JOIN \`categories\` c ON c.\`id\` = s.\`id\`
        WHERE s.\`categoryId\` IN (${legacyCatPlaceholders})
      `,
        legacyCatIdList,
      );

      await queryRunner.query(
        `DELETE FROM \`parent_categories\` WHERE \`id\` = ?`,
        [legacyParentId],
      );
    } finally {
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  }

  public async down(): Promise<void> {
    // Irreversible data reshape
  }
}
