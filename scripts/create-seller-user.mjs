#!/usr/bin/env node
/**
 * ساخت / ارتقای فروشنده روی سرور با شماره موبایل.
 *
 * Usage:
 *   npm run create:seller
 *   npm run create:seller -- 09123456789
 *   npm run create:seller -- --mobile=09123456789 --password='MyPass123' --name='Shop'
 *   npm run create:seller -- --mobile=09123456789 --super   # نقش super-seller
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
      `DB_HOST=${process.env.DB_HOST} به MySQL مهاجرت اشاره می‌کند.\n` +
        `اسکریپت را داخل کانتینر API بزن:\n` +
        `  sudo docker exec -it didnegar_api npm run create:seller -- --mobile=09xxxxxxxxx --password='...'\n`,
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
  npm run create:seller -- --mobile=09xxxxxxxxx [--password=...] [--name=...] [--slug=...] [--super]

Creates (or upgrades) a user with seller/super-seller role and a sellers row.`);
}

function parseArgs(argv) {
  const args = {
    mobile: null,
    password: null,
    name: null,
    slug: null,
    superSeller: false,
    help: false,
  };

  for (const raw of argv) {
    if (raw === '--help' || raw === '-h') {
      args.help = true;
      continue;
    }
    if (raw === '--super') {
      args.superSeller = true;
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
    if (raw.startsWith('--slug=')) {
      args.slug = raw.slice('--slug='.length).trim();
      continue;
    }
    if (!raw.startsWith('-') && !args.mobile && MOBILE_RE.test(raw)) {
      args.mobile = raw;
    }
  }

  return args;
}

async function ask(rl, question) {
  return (await rl.question(question)).trim();
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || `seller-${Date.now()}`;
}

async function ensureSellerRole(conn, slug) {
  const [rows] = await conn.execute(
    `SELECT id, slug FROM roles WHERE slug = ? AND sellerId IS NULL LIMIT 1`,
    [slug],
  );
  if (rows[0]) return rows[0];
  throw new Error(
    `نقش ${slug} یافت نشد. یک‌بار اپ را بالا بیاورید تا roles seed شود.`,
  );
}

async function upsertSeller(conn, { phone, name, slug }) {
  const [byPhone] = await conn.execute(
    `SELECT id, slug FROM sellers WHERE phone = ? LIMIT 1`,
    [phone],
  );
  if (byPhone[0]) {
    await conn.execute(
      `UPDATE sellers
       SET name = COALESCE(NULLIF(?, ''), name),
           status = 'active',
           updatedAt = NOW(6)
       WHERE id = ?`,
      [name, byPhone[0].id],
    );
    return byPhone[0].id;
  }

  let finalSlug = slug;
  const [slugTaken] = await conn.execute(
    `SELECT id FROM sellers WHERE slug = ? LIMIT 1`,
    [finalSlug],
  );
  if (slugTaken[0]) {
    finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
  }

  const id = newId();
  await conn.execute(
    `INSERT INTO sellers (
       id, name, slug, businessName, businessType, email, phone,
       nationalId, registrationNumber, address, city, postalCode,
       status, settings, createdAt, updatedAt
     ) VALUES (
       ?, ?, ?, ?, 'other', ?, ?,
       NULL, NULL, NULL, NULL, NULL,
       'active', CAST('{}' AS JSON), NOW(6), NOW(6)
     )`,
    [id, name, finalSlug, name, `${phone}@seller.local`, phone],
  );
  return id;
}

async function upsertSellerUser(conn, {
  mobile,
  passwordHash,
  roleId,
  sellerId,
  name,
}) {
  const [existing] = await conn.execute(
    `SELECT id FROM users WHERE username = ? LIMIT 1`,
    [mobile],
  );

  if (existing[0]) {
    await conn.execute(
      `UPDATE users
       SET roleId = ?,
           extraRoleIds = CAST('[]' AS JSON),
           sellerId = ?,
           adminId = NULL,
           password = ?,
           displayName = COALESCE(NULLIF(?, ''), displayName),
           isActive = 1,
           otpCode = NULL,
           otpExpiresAt = NULL,
           updatedAt = NOW(6)
       WHERE id = ?`,
      [roleId, sellerId, passwordHash, name, existing[0].id],
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
       NULL, NULL, NULL, 1, ?, CAST('[]' AS JSON),
       ?, NULL, NULL, NULL, NOW(6), NOW(6)
     )`,
    [id, mobile, passwordHash, name, roleId, sellerId],
  );
  return { id, created: true };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  requiredEnv('DB_HOST');
  requiredEnv('DB_PORT');
  requiredEnv('DB_USERNAME');
  requiredEnv('DB_PASSWORD');
  requiredEnv('DB_DATABASE');
  assertAppMysqlTarget();

  const roleSlug = args.superSeller ? 'super-seller' : 'seller';
  const rl = createInterface({ input, output });

  try {
    let mobile = args.mobile;
    while (!mobile || !MOBILE_RE.test(mobile)) {
      mobile = await ask(rl, 'شماره موبایل فروشنده (09xxxxxxxxx): ');
      if (!MOBILE_RE.test(mobile)) {
        console.error('شماره نامعتبر است.');
        mobile = null;
      }
    }

    let password = args.password;
    while (!password || password.length < 8) {
      password = await ask(rl, 'رمز عبور (حداقل ۸ کاراکتر): ');
      if (!password || password.length < 8) {
        console.error('رمز عبور باید حداقل ۸ کاراکتر باشد.');
        password = null;
      }
    }

    const name =
      args.name ||
      (await ask(rl, 'نام فروشگاه [Seller Shop]: ')) ||
      'Seller Shop';
    const slug = args.slug || slugify(`shop-${mobile.slice(-4)}`);

    const passwordHash = await bcrypt.hash(password, 10);
    const conn = await openTargetConnection();

    try {
      await conn.beginTransaction();

      const role = await ensureSellerRole(conn, roleSlug);
      const sellerId = await upsertSeller(conn, { phone: mobile, name, slug });
      const user = await upsertSellerUser(conn, {
        mobile,
        passwordHash,
        roleId: role.id,
        sellerId,
        name,
      });

      await conn.commit();

      const [verify] = await conn.execute(
        `SELECT u.id AS userId, u.username, r.slug AS roleSlug, u.sellerId
         FROM users u
         INNER JOIN roles r ON r.id = u.roleId
         WHERE u.username = ?
         LIMIT 1`,
        [mobile],
      );

      console.log('\n✅ فروشنده آماده شد');
      console.log(`   mobile  : ${mobile}`);
      console.log(`   userId  : ${user.id}`);
      console.log(`   sellerId: ${sellerId}`);
      console.log(`   role    : ${verify[0]?.roleSlug ?? 'UNKNOWN'}`);
      console.log(
        `   status  : ${user.created ? 'created' : 'upgraded existing user'}`,
      );
      if (verify[0]?.roleSlug !== roleSlug) {
        throw new Error(
          `نقش بعد از آپدیت ${roleSlug} نیست (الان: ${verify[0]?.roleSlug}).`,
        );
      }
      console.log('\nورود از: POST /sellers/auth/login-with-password');
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
