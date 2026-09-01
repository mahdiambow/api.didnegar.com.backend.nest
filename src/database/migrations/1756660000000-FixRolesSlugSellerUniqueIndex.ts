import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRolesSlugSellerUniqueIndex1756660000000
  implements MigrationInterface
{
  name = 'FixRolesSlugSellerUniqueIndex1756660000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_881f72bac969d9a00a1a29e107"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_roles_slug"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_roles_slug_sellerId"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_roles_slug_global"
      ON "roles" ("slug")
      WHERE "sellerId" IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_roles_slug_sellerId"
      ON "roles" ("slug", "sellerId")
      WHERE "sellerId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_roles_slug_sellerId"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_roles_slug_global"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_roles_slug"
      ON "roles" ("slug")
    `);
  }
}
