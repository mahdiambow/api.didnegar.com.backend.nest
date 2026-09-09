import 'dotenv/config';
import { DataSource } from 'typeorm';
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_ROLE_SLUGS,
} from '../../roles/permissions.js';

const SUPER_ADMIN_USERNAME = '09363078987';

const dataSource = new DataSource({
  type: 'mysql',
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
      const permissions = JSON.stringify([...DEFAULT_ROLE_PERMISSIONS[slug]]);
      await qr.query(
        `
        UPDATE roles
        SET
          permissions = CAST(? AS JSON),
          isSystem = true,
          sellerId = NULL,
          name = CASE
            WHEN slug = 'super-admin' THEN 'Didnegar'
            WHEN slug = 'user' THEN 'کاربر'
            WHEN slug = 'seller' THEN 'فروشنده'
            WHEN slug = 'super-seller' THEN 'سوپر فروشنده'
            WHEN slug = 'admin' THEN 'ادمین'
            ELSE name
          END
        WHERE slug = ? AND sellerId IS NULL
      `,
        [permissions, slug],
      );
    }

    await qr.query(
      `
      UPDATE users
      SET roleId = (SELECT id FROM roles WHERE slug = ? AND sellerId IS NULL LIMIT 1),
          sellerId = NULL,
          extraRoleIds = JSON_ARRAY((
            SELECT id FROM roles WHERE slug = ? AND sellerId IS NULL LIMIT 1
          ))
      WHERE username = ?
    `,
      [
        DEFAULT_ROLE_SLUGS.SUPER_ADMIN,
        DEFAULT_ROLE_SLUGS.SUPER_SELLER,
        SUPER_ADMIN_USERNAME,
      ],
    );

    await qr.query(
      `
      UPDATE users
      SET roleId = (SELECT id FROM roles WHERE slug = ? AND sellerId IS NULL LIMIT 1),
          sellerId = NULL
      WHERE roleId IN (SELECT id FROM roles WHERE slug = 'didnegar')
    `,
      [DEFAULT_ROLE_SLUGS.SUPER_ADMIN],
    );

    await qr.query(`DELETE FROM users WHERE username <> ?`, [
      SUPER_ADMIN_USERNAME,
    ]);

    await qr.query(`DELETE FROM roles WHERE slug = 'didnegar'`);

    await qr.query(`
      DELETE FROM roles
      WHERE isSystem = false
         OR sellerId IS NOT NULL
    `);

    await qr.query(`
      DELETE FROM roles
      WHERE sellerId IS NULL
        AND slug NOT IN ('user', 'seller', 'super-seller', 'admin', 'super-admin')
    `);

    const [{ count: userCount }] = await qr.query(
      `SELECT COUNT(*) AS count FROM users`,
    );
    const [{ count: roleCount }] = await qr.query(
      `SELECT COUNT(*) AS count FROM roles`,
    );
    const [superAdminUser] = await qr.query(
      `
      SELECT u.username, r.slug AS role, JSON_LENGTH(r.permissions) AS perm_count
      FROM users u
      JOIN roles r ON r.id = u.roleId
      WHERE u.username = ?
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
