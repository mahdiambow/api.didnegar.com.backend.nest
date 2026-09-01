import { MigrationInterface, QueryRunner } from 'typeorm';
import { ALL_PERMISSIONS } from '../../roles/permissions.js';

export class MigrateUserRoleToRoleId1756646400000
  implements MigrationInterface
{
  name = 'MigrateUserRoleToRoleId1756646400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        "permissions" text array NOT NULL DEFAULT '{}',
        "isSystem" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_roles_slug"
      ON "roles" ("slug")
    `);

    await queryRunner.query(
      `
      INSERT INTO "roles" ("slug", "name", "permissions", "isSystem")
      SELECT 'user', 'کاربر', '{}', false
      WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "slug" = 'user')
    `,
    );

    await queryRunner.query(
      `
      INSERT INTO "roles" ("slug", "name", "permissions", "isSystem")
      SELECT 'admin', 'مدیر', $1::text[], true
      WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "slug" = 'admin')
    `,
      [ALL_PERMISSIONS],
    );

    const usersTableExists = await queryRunner.hasTable('users');
    if (!usersTableExists) {
      return;
    }

    const hasRoleId = await queryRunner.hasColumn('users', 'roleId');
    if (!hasRoleId) {
      await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "roleId" uuid`);
    }

    const hasLegacyRole = await queryRunner.hasColumn('users', 'role');
    if (hasLegacyRole) {
      await queryRunner.query(`
        UPDATE "users" u
        SET "roleId" = r.id
        FROM "roles" r
        WHERE u."roleId" IS NULL
          AND r.slug = u.role::text
      `);
    }

    await queryRunner.query(`
      UPDATE "users" u
      SET "roleId" = r.id
      FROM "roles" r
      WHERE u."roleId" IS NULL
        AND r.slug = 'user'
    `);

    const [{ count }] = await queryRunner.query(`
      SELECT COUNT(*)::int AS count FROM "users" WHERE "roleId" IS NULL
    `);

    if (count === 0) {
      await queryRunner.query(`
        ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL
      `);
    }

    const fkExists = await queryRunner.query(`
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_name = 'FK_users_roleId'
        AND table_name = 'users'
      LIMIT 1
    `);

    if (!fkExists.length) {
      await queryRunner.query(`
        ALTER TABLE "users"
        ADD CONSTRAINT "FK_users_roleId"
        FOREIGN KEY ("roleId") REFERENCES "roles"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
      `);
    }

    if (hasLegacyRole) {
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
      await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const usersTableExists = await queryRunner.hasTable('users');
    if (!usersTableExists || !(await queryRunner.hasColumn('users', 'roleId'))) {
      return;
    }

    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('user', 'admin')
    `);

    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "role" "users_role_enum" NOT NULL DEFAULT 'user'
    `);

    await queryRunner.query(`
      UPDATE "users" u
      SET "role" = r.slug::"users_role_enum"
      FROM "roles" r
      WHERE u."roleId" = r.id
    `);

    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_roleId"
    `);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roleId"`);
  }
}
