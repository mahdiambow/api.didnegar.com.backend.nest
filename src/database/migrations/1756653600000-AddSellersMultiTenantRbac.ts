import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLE_SLUGS,
} from '../../roles/permissions.js';

const SYSTEM_ROLE_NAMES: Record<string, string> = {
  [DEFAULT_ROLE_SLUGS.USER]: 'کاربر',
  [DEFAULT_ROLE_SLUGS.SELLER]: 'فروشنده',
  [DEFAULT_ROLE_SLUGS.ADMIN]: 'ادمین',
  [DEFAULT_ROLE_SLUGS.SUPER_ADMIN]: 'Didnegar',
};

export class AddSellersMultiTenantRbac1756653600000
  implements MigrationInterface
{
  name = 'AddSellersMultiTenantRbac1756653600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sellers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(150) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "businessName" character varying(200) NOT NULL,
        "businessType" character varying(50) NOT NULL DEFAULT 'other',
        "email" character varying(150) NOT NULL,
        "phone" character varying(20) NOT NULL,
        "nationalId" character varying(20),
        "registrationNumber" character varying(50),
        "address" character varying(500),
        "city" character varying(100),
        "postalCode" character varying(20),
        "status" character varying(20) NOT NULL DEFAULT 'active',
        "settings" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sellers_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_sellers_slug"
      ON "sellers" ("slug")
    `);

    const usersTableExists = await queryRunner.hasTable('users');
    if (usersTableExists) {
      const hasUserSellerId = await queryRunner.hasColumn('users', 'sellerId');
      if (!hasUserSellerId) {
        await queryRunner.query(`
          ALTER TABLE "users" ADD COLUMN "sellerId" uuid
        `);
        await queryRunner.query(`
          ALTER TABLE "users"
          ADD CONSTRAINT "FK_users_sellerId"
          FOREIGN KEY ("sellerId") REFERENCES "sellers"("id")
          ON DELETE SET NULL ON UPDATE CASCADE
        `);
      }
    }

    const rolesTableExists = await queryRunner.hasTable('roles');
    if (rolesTableExists) {
      const hasRoleSellerId = await queryRunner.hasColumn('roles', 'sellerId');
      if (!hasRoleSellerId) {
        await queryRunner.query(`
          ALTER TABLE "roles" ADD COLUMN "sellerId" uuid
        `);
        await queryRunner.query(`
          ALTER TABLE "roles"
          ADD CONSTRAINT "FK_roles_sellerId"
          FOREIGN KEY ("sellerId") REFERENCES "sellers"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
        `);
      }

      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_roles_slug"
      `);

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "IDX_roles_slug_sellerId"
        ON "roles" ("slug", "sellerId")
      `);
    }

    for (const slug of Object.values(DEFAULT_ROLE_SLUGS)) {
      const permissions =
        slug === DEFAULT_ROLE_SLUGS.SUPER_ADMIN
          ? [...ALL_PERMISSIONS]
          : [...DEFAULT_ROLE_PERMISSIONS[
              slug as keyof typeof DEFAULT_ROLE_PERMISSIONS
            ]];

      await queryRunner.query(
        `
        INSERT INTO "roles" ("slug", "name", "permissions", "isSystem", "sellerId")
        SELECT $1::varchar, $2::varchar, $3::text[], true, NULL
        WHERE NOT EXISTS (
          SELECT 1 FROM "roles"
          WHERE "slug" = $1::varchar AND "sellerId" IS NULL
        )
      `,
        [slug, SYSTEM_ROLE_NAMES[slug], permissions],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('users')) {
      await queryRunner.query(`
        ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_sellerId"
      `);
      await queryRunner.query(`
        ALTER TABLE "users" DROP COLUMN IF EXISTS "sellerId"
      `);
    }

    if (await queryRunner.hasTable('roles')) {
      await queryRunner.query(`
        DELETE FROM "roles"
        WHERE "slug" IN ('seller', 'super-admin')
          AND "sellerId" IS NULL
      `);

      await queryRunner.query(`
        ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "FK_roles_sellerId"
      `);
      await queryRunner.query(`
        ALTER TABLE "roles" DROP COLUMN IF EXISTS "sellerId"
      `);

      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_roles_slug_sellerId"
      `);

      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS "IDX_roles_slug"
        ON "roles" ("slug")
      `);
    }

    await queryRunner.query(`DROP TABLE IF EXISTS "sellers"`);
  }
}
