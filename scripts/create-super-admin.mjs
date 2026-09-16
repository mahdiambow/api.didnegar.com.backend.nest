#!/usr/bin/env node
/**
 * ساخت / ارتقای سوپرادمین روی سرور با شماره موبایل.
 *
 * Usage:
 *   npm run create:super-admin
 *   npm run create:super-admin -- 09123456789
 *   npm run create:super-admin -- 09123456789 --password='MyPass123'
 *   npm run create:super-admin -- --mobile=09123456789 --password=MyPass123 --name='Didnegar Admin'
 */
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import bcrypt from 'bcrypt';
import {
  newId,
  openTargetConnection,
  requiredEnv,
} from './migration-scripts/shared.mjs';

const MOBILE_RE = /^09\d{9}$/;
const BLOCKED_DB_HOSTS = new Set([
  'migration-mysql',
  'didnegar_migration_mysql',
]);

function assertAppMysqlTarget() {
  const host = (process.env.DB_HOST ?? '').trim().toLowerCase();
  const port = Number(process.env.DB_PORT);
  const database = (process.env.DB_DATABASE ?? '').trim().toLowerCase();

  if (BLOCKED_DB_HOSTS.has(host) || port === 3307) {
    throw new Error(
      `DB_HOST=${process.env.DB_HOST} به MySQL مهاجرت اشاره می‌کند و از روی host resolve نمی‌شود.\n` +
        `اسکریپت را داخل کانتینر API بزن:\n` +
        `  sudo docker exec -it didnegar_api npm run create:super-admin -- --mobile=09xxxxxxxxx --password='...' --name='Super Admin'\n` +
        `یا روی host فقط به MySQL اپ وصل شو (مثلاً DB_HOST=127.0.0.1 و پورت publish‌شده).`,
    );
  }

  if (database === 'didnegar_new') {
    throw new Error(
      `DB_DATABASE=didnegar_new دیتابیس legacy است. برای Nest از didnegar استفاده کن.`,
    );
  }
}

function printHelp() {
  console.log(`Usage:
  npm run create:super-admin
  npm run create:super-admin -- <mobile>
  npm run create:super-admin -- --mobile=09xxxxxxxxx [--password=...] [--name=...]

Creates (or upgrades) a user with role super-admin and links an admins row.
If --password is omitted, prompts interactively (min 8 chars).`);
}

function parseArgs(argv) {
  const args = {
    mobile: null,
    password: null,
    name: null,
    help: false,
  };

  for (const raw of argv) {
    if (raw === '--help' || raw === '-h') {
      args.help = true;
      continue;
    }
    if (raw.startsWith('--mobile=')) {
      args.mobile = raw.slice('--mobile='.length).trim();
      continue;
    }
    if (raw.startsWith('--password=')) {
      args.password = raw.slice('--password='.length);
      continue;
    }
    if (raw.startsWith('--name=')) {
      args.name = raw.slice('--name='.length).trim();
      continue;
    }
    if (!raw.startsWith('-') && !args.mobile && MOBILE_RE.test(raw)) {
      args.mobile = raw;
    }
  }

  return args;
}

async function ask(rl, question, { secret = false } = {}) {
  if (!secret) {
    return (await rl.question(question)).trim();
  }

  // readline can't hide input reliably across terminals; still prompt.
  return (await rl.question(question)).trim();
}

async function ensureRoleBySlug(conn, slug) {
  const [rows] = await conn.execute(
    `SELECT id, slug, audience FROM roles WHERE slug = ? AND sellerId IS NULL LIMIT 1`,
    [slug],
  );
  if (rows[0]) return rows[0];

  throw new Error(
    `نقش ${slug} یافت نشد. یک‌بار اپ را بالا بیاورید تا roles seed شود، بعد دوباره این اسکریپت را بزنید.`,
  );
}

async function ensureSuperAdminRole(conn) {
  return ensureRoleBySlug(conn, 'super-admin');
}

async function upsertAdmin(conn, { phone, name, email }) {
  const [existing] = await conn.execute(
    `SELECT id FROM admins WHERE phone = ? LIMIT 1`,
    [phone],
  );
  if (existing[0]) {
    await conn.execute(
      `UPDATE admins SET name = COALESCE(?, name), isActive = 1, updatedAt = NOW(6) WHERE id = ?`,
      [name, existing[0].id],
    );
    return existing[0].id;
  }

  const id = newId();
  await conn.execute(
    `INSERT INTO admins (id, name, email, phone, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, 1, NOW(6), NOW(6))`,
    [id, name, email, phone],
  );
  return id;
}

async function upsertSuperAdminUser(conn, {
  mobile,
  passwordHash,
  roleId,
  userRoleId,
  adminId,
  name,
}) {
  const extraRoleIds = userRoleId ? [userRoleId] : [];
  const [existing] = await conn.execute(
    `SELECT id, username, roleId, adminId FROM users WHERE username = ? LIMIT 1`,
    [mobile],
  );

  if (existing[0]) {
    await conn.execute(
      `UPDATE users
       SET roleId = ?,
           extraRoleIds = CAST(? AS JSON),
           adminId = ?,
           password = ?,
           displayName = COALESCE(NULLIF(?, ''), displayName),
           isActive = 1,
           otpCode = NULL,
           otpExpiresAt = NULL,
           updatedAt = NOW(6)
       WHERE id = ?`,
      [roleId, JSON.stringify(extraRoleIds), adminId, passwordHash, name, existing[0].id],
    );
    return { id: existing[0].id, created: false };
  }

  const id = newId();
  await conn.execute(
    `INSERT INTO users (
       id, legacyId, legacyTable, username, password, email, displayName,
       firstName, lastName, website, isActive, roleId, extraRoleIds,
       sellerId, adminId, otpCode, otpExpiresAt, createdAt, updatedAt
     ) VALUES (
       ?, NULL, NULL, ?, ?, NULL, ?,
       NULL, NULL, NULL, 1, ?, ?,
       NULL, ?, NULL, NULL, NOW(6), NOW(6)
     )`,
    [
      id,
      mobile,
      passwordHash,
      name,
      roleId,
      JSON.stringify(extraRoleIds),
      adminId,
    ],
  );
  return { id, created: true };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // Validate env early
  requiredEnv('DB_HOST');
  requiredEnv('DB_PORT');
  requiredEnv('DB_USERNAME');
  requiredEnv('DB_PASSWORD');
  requiredEnv('DB_DATABASE');
  assertAppMysqlTarget();

  const rl = createInterface({ input, output });
  try {
    let mobile = args.mobile;
    while (!mobile || !MOBILE_RE.test(mobile)) {
      mobile = await ask(rl, 'شماره موبایل سوپرادمین (09xxxxxxxxx): ');
      if (!MOBILE_RE.test(mobile)) {
        console.error('شماره نامعتبر است. مثال: 09123456789');
        mobile = null;
      }
    }

    let password = args.password;
    while (!password || password.length < 8) {
      password = await ask(rl, 'رمز عبور (حداقل ۸ کاراکتر): ', {
        secret: true,
      });
      if (!password || password.length < 8) {
        console.error('رمز عبور باید حداقل ۸ کاراکتر باشد.');
        password = null;
      }
    }

    const name =
      args.name ||
      (await ask(rl, 'نام نمایشی [Super Admin]: ')) ||
      'Super Admin';

    const passwordHash = await bcrypt.hash(password, 10);
    const conn = await openTargetConnection();

    try {
      await conn.beginTransaction();

      const role = await ensureSuperAdminRole(conn);
      const userRole = await ensureRoleBySlug(conn, 'user');
      const adminId = await upsertAdmin(conn, {
        phone: mobile,
        name,
        email: null,
      });
      const user = await upsertSuperAdminUser(conn, {
        mobile,
        passwordHash,
        roleId: role.id,
        userRoleId: userRole.id,
        adminId,
        name,
      });

      await conn.commit();

      const [verify] = await conn.execute(
        `SELECT u.id AS userId, u.username, r.slug AS roleSlug, u.adminId
         FROM users u
         INNER JOIN roles r ON r.id = u.roleId
         WHERE u.username = ?
         LIMIT 1`,
        [mobile],
      );

      console.log('\n✅ سوپرادمین آماده شد');
      console.log(`   mobile : ${mobile}`);
      console.log(`   userId : ${user.id}`);
      console.log(`   adminId: ${adminId}`);
      console.log(`   role   : ${verify[0]?.roleSlug ?? 'UNKNOWN'}`);
      console.log(
        `   status : ${user.created ? 'created' : 'upgraded existing user'}`,
      );
      if (verify[0]?.roleSlug !== 'super-admin') {
        throw new Error(
          `نقش بعد از آپدیت هنوز super-admin نیست (الان: ${verify[0]?.roleSlug}).`,
        );
      }
      console.log('\nورود از: POST /admin/auth/login-with-password');
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      await conn.end();
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error('\n❌ خطا:', error.message || error);
  process.exit(1);
});
