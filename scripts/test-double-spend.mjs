#!/usr/bin/env node
/**
 * Order payment smoke tests (payment starts on POST /orders):
 * 1) Order create returns paymentUrl + pending deposit
 * 2) Concurrent order creates each get their own pending deposit
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { ulid } from 'ulid';

const BASE = `http://localhost:${process.env.PORT || 3000}`;
const OTP = process.env.OTP_STATIC_CODE || '123456';

function assert(cond, msg) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, code: json?.code };
}

async function signup() {
  const mobile = `09${String(Date.now()).slice(-9)}${Math.floor(Math.random() * 10)}`.slice(0, 11);
  let r = await api('POST', '/users/auth/login-or-signup', { body: { mobile } });
  assert(r.status < 400, `signup: ${JSON.stringify(r.json)}`);
  r = await api('POST', '/users/auth/verify-otp', { body: { mobile, code: OTP } });
  assert(r.status < 400, `otp: ${JSON.stringify(r.json)}`);
  return {
    mobile,
    token: r.json.data.accessToken,
    userId: r.json.data.user.id,
  };
}

async function openDb() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
}

async function createFixtures(conn, userId, mobile) {
  const offerId = ulid();
  const shippingId = ulid();
  const addressId = ulid();

  const [srcOffers] = await conn.query(
    `SELECT sellerId, productId, attributes, price, stock, stockStatus, isOnSale, taxStatus, taxClass
     FROM seller_offers WHERE approvalStatus='approved' AND stock>0 LIMIT 1`,
  );
  assert(srcOffers[0], 'need approved offer');
  const src = srcOffers[0];
  const [srcShip] = await conn.query(
    `SELECT name, price, isCod, sortOrder FROM shipping_methods WHERE isActive=1 LIMIT 1`,
  );

  await conn.execute(
    `INSERT INTO seller_offers
      (id, sellerId, productId, attributes, sku, price, stock, stockStatus, isOnSale, taxStatus, taxClass, isActive, approvalStatus, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'approved', NOW(6), NOW(6))`,
    [
      offerId,
      src.sellerId,
      src.productId,
      JSON.stringify(src.attributes ?? {}),
      `DS-${offerId.slice(-8)}`,
      src.price,
      Math.max(Number(src.stock), 100),
      'instock',
      src.isOnSale ? 1 : 0,
      src.taxStatus,
      src.taxClass,
    ],
  );
  // product_stocks is decremented on checkout — keep enough for race tests
  await conn.execute(
    `UPDATE product_stocks SET stock = GREATEST(COALESCE(stock,0), 100) WHERE productId = ?`,
    [src.productId],
  );
  await conn.execute(
    `INSERT INTO shipping_methods
      (id, name, slug, price, isCod, isActive, sortOrder, createdAt, updatedAt)
     VALUES (?, 'DS Ship', ?, ?, ?, 1, 0, NOW(6), NOW(6))`,
    [
      shippingId,
      `ds-${shippingId.slice(-8).toLowerCase()}`,
      srcShip[0].price,
      srcShip[0].isCod ? 1 : 0,
    ],
  );
  await conn.execute(
    `INSERT INTO user_addresses
      (id, userId, title, province, city, addressDetail, postalCode, recipientFullName, recipientPhone, isDefault, createdAt, updatedAt)
     VALUES (?, ?, 'Home', 'Tehran', 'Tehran', 'DS', '1234567890', 'DS', ?, 1, NOW(6), NOW(6))`,
    [addressId, userId, mobile],
  );

  return { offerId, shippingId, addressId };
}

async function checkout(token, offerId, addressId, shippingId, conn) {
  if (conn) {
    await conn.execute(
      `UPDATE seller_offers SET stock = GREATEST(stock, 10), stockStatus = 'instock' WHERE id = ?`,
      [offerId],
    );
    const [rows] = await conn.query(
      `SELECT productId FROM seller_offers WHERE id = ?`,
      [offerId],
    );
    if (rows[0]?.productId) {
      await conn.execute(
        `UPDATE product_stocks SET stock = GREATEST(COALESCE(stock,0), 10) WHERE productId = ?`,
        [rows[0].productId],
      );
    }
  }
  const r = await api('POST', '/orders', {
    token,
    body: {
      products: [{ offerId, quantity: 1 }],
      shippingMethodId: shippingId,
    },
  });
  assert(r.status < 400, `order: ${JSON.stringify(r.json)}`);
  return r.json.data;
}

async function main() {
  console.log('BASE', BASE);
  const { token, userId, mobile } = await signup();
  const conn = await openDb();
  const fx = await createFixtures(conn, userId, mobile);
  console.log('user', userId);

  console.log('\nA) Order create starts iBank payment');
  const orderA = await checkout(token, fx.offerId, fx.addressId, fx.shippingId, conn);
  assert(orderA.paymentUrl, 'order must return paymentUrl');
  const [depsA] = await conn.query(
    `SELECT id, trackId, status FROM deposits WHERE orderId = ?`,
    [orderA.id],
  );
  assert(depsA.length === 1, 'exactly one pending deposit per order');
  assert(depsA[0].status === 'pending', 'deposit pending');
  console.log('   deposit', depsA[0].trackId);

  console.log('\nB) Concurrent order creates each get their own deposit');
  const race = await Promise.all([
    checkout(token, fx.offerId, fx.addressId, fx.shippingId, conn),
    checkout(token, fx.offerId, fx.addressId, fx.shippingId, conn),
    checkout(token, fx.offerId, fx.addressId, fx.shippingId, conn),
  ]);
  assert(
    race.every((o) => o.paymentUrl),
    'each concurrent order must return paymentUrl',
  );
  const orderIds = race.map((o) => o.id);
  assert(new Set(orderIds).size === 3, 'three distinct orders');
  const [depsB] = await conn.query(
    `SELECT orderId, trackId FROM deposits WHERE orderId IN (?, ?, ?)`,
    orderIds,
  );
  assert(depsB.length === 3, `expected 3 deposits, got ${depsB.length}`);
  assert(
    new Set(depsB.map((d) => d.trackId)).size === 3,
    'each order must have its own trackId',
  );
  console.log('   deposits', depsB.map((d) => d.trackId));

  await conn.end();
  console.log('\n✅ Order payment checks passed');
}

main().catch((e) => {
  console.error('\n❌', e.message || e);
  process.exit(1);
});
