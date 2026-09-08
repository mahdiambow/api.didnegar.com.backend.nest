import { MigrationInterface, QueryRunner } from 'typeorm';
import { DEFAULT_ROLE_SLUGS } from '../../roles/permissions.js';

export class AddUserExtraRoleIds1788820000000 implements MigrationInterface {
  name = 'AddUserExtraRoleIds1788820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "extraRoleIds" uuid[] NOT NULL DEFAULT '{}'
    `);

    const hasSlugs = await queryRunner.query(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'extraRoleSlugs'
      LIMIT 1
    `);

    if (hasSlugs.length > 0) {
      await queryRunner.query(`
        UPDATE "users" u
        SET "extraRoleIds" = COALESCE((
          SELECT array_agg(r.id)
          FROM unnest(u."extraRoleSlugs") AS s(role_slug)
          JOIN "roles" r
            ON r.slug = s.role_slug
           AND r."sellerId" IS NULL
        ), '{}'::uuid[])
      `);
      await queryRunner.query(`
        ALTER TABLE "users"
        DROP COLUMN IF EXISTS "extraRoleSlugs"
      `);
    }

    await queryRunner.query(
      `
      UPDATE "users" u
      SET "extraRoleIds" = ARRAY[
        (SELECT r.id FROM "roles" r
         WHERE r.slug = $1 AND r."sellerId" IS NULL
         LIMIT 1)
      ]::uuid[]
      WHERE u.username = $2
        AND NOT EXISTS (
          SELECT 1
          FROM unnest(u."extraRoleIds") AS x(role_id)
          JOIN "roles" r ON r.id = x.role_id
          WHERE r.slug = $1
        )
        AND EXISTS (
          SELECT 1 FROM "roles" r
          WHERE r.slug = $1 AND r."sellerId" IS NULL
        )
    `,
      [DEFAULT_ROLE_SLUGS.SUPER_SELLER, '09363078987'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "extraRoleSlugs" character varying[] NOT NULL DEFAULT '{}'
    `);

    await queryRunner.query(`
      UPDATE "users" u
      SET "extraRoleSlugs" = COALESCE((
        SELECT array_agg(r.slug)
        FROM unnest(u."extraRoleIds") AS x(role_id)
        JOIN "roles" r ON r.id = x.role_id
      ), '{}'::varchar[])
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "extraRoleIds"
    `);
  }
}
