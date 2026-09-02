import 'dotenv/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLE_SLUGS,
} from '../../roles/permissions.js';

const SUPER_ADMIN_USERNAME = '09363078987';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

async function run() {
  await dataSource.initialize();
  const qr = dataSource.createQueryRunner();

  await qr.connect();
  await qr.startTransaction();

  try {
    console.log('Resetting platform data...');

    await qr.query(`DELETE FROM refresh_tokens`);

    await qr.query(`DELETE FROM seller_contracts`);
    await qr.query(`DELETE FROM sellers`);

    for (const slug of Object.values(DEFAULT_ROLE_SLUGS)) {
      const permissions = [...DEFAULT_ROLE_PERMISSIONS[slug]];
      await qr.query(
        `
        UPDATE roles
        SET
          permissions = $1::text[],
          "isSystem" = true,
          "sellerId" = NULL,
          name = CASE
            WHEN slug = 'super-admin' THEN 'Didnegar'
            WHEN slug = 'user' THEN 'کاربر'
            WHEN slug = 'seller' THEN 'فروشنده'
            WHEN slug = 'admin' THEN 'ادمین'
            ELSE name
          END
        WHERE slug = $2::varchar AND "sellerId" IS NULL
      `,
        [permissions, slug],
      );
    }

    await qr.query(
      `
      UPDATE users
      SET "roleId" = (SELECT id FROM roles WHERE slug = $1 AND "sellerId" IS NULL LIMIT 1),
          "sellerId" = NULL
      WHERE username = $2
    `,
      [DEFAULT_ROLE_SLUGS.SUPER_ADMIN, SUPER_ADMIN_USERNAME],
    );

    await qr.query(
      `
      UPDATE users
      SET "roleId" = (SELECT id FROM roles WHERE slug = $1 AND "sellerId" IS NULL LIMIT 1),
          "sellerId" = NULL
      WHERE "roleId" IN (SELECT id FROM roles WHERE slug = 'didnegar')
    `,
      [DEFAULT_ROLE_SLUGS.SUPER_ADMIN],
    );

    await qr.query(`DELETE FROM users WHERE username <> $1`, [
      SUPER_ADMIN_USERNAME,
    ]);

    await qr.query(`DELETE FROM roles WHERE slug = 'didnegar'`);

    await qr.query(
      `
      DELETE FROM roles
      WHERE "isSystem" = false
         OR ("sellerId" IS NOT NULL)
    `,
    );

    await qr.query(
      `
      DELETE FROM roles r
      WHERE r."sellerId" IS NULL
        AND r.slug NOT IN ('user', 'seller', 'admin', 'super-admin')
    `,
    );

    const [{ count: userCount }] = await qr.query(
      `SELECT COUNT(*)::int AS count FROM users`,
    );
    const [{ count: roleCount }] = await qr.query(
      `SELECT COUNT(*)::int AS count FROM roles`,
    );
    const [superAdminUser] = await qr.query(
      `
      SELECT u.username, r.slug AS role, array_length(r.permissions, 1) AS perm_count
      FROM users u
      JOIN roles r ON r.id = u."roleId"
      WHERE u.username = $1
    `,
      [SUPER_ADMIN_USERNAME],
    );

    await qr.commitTransaction();

    console.log('Done.');
    console.log(`Users: ${userCount}, Roles: ${roleCount}`);
    console.log(`Super admin: ${JSON.stringify(superAdminUser)}`);
    console.log(`Total permissions: ${ALL_PERMISSIONS.length}`);
  } catch (error) {
    await qr.rollbackTransaction();
    throw error;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
