import { MigrationInterface, QueryRunner } from 'typeorm';
import { DEFAULT_ROLE_SLUGS } from '../../roles/permissions.js';

export class AddUserExtraRoleSlugs1788810000000 implements MigrationInterface {
  name = 'AddUserExtraRoleSlugs1788810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "extraRoleSlugs" character varying[] NOT NULL DEFAULT '{}'
    `);

    await queryRunner.query(
      `
      UPDATE "users"
      SET "extraRoleSlugs" = ARRAY[$1]::varchar[]
      WHERE "username" = $2
        AND NOT ($1 = ANY("extraRoleSlugs"))
    `,
      [DEFAULT_ROLE_SLUGS.SUPER_SELLER, '09363078987'],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "extraRoleSlugs"
    `);
  }
}
