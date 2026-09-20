#!/usr/bin/env node
/**
 * HTTP purchase-flow test against running API.
 * Bank/loan verify must: credit IN then OUT (net wallet ~0).
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
  return { status: res.status, json };
}

async function main() {
  const mobile = `09${String(Date.now()).slice(-9)}`;
  console.log('BASE', BASE);
  console.log('1) Signup', mobile);

  let r = await api('POST', '/users/auth/login-or-signup', {
    body: { mobile },
  });
  assert(r.status < 400, `login-or-signup failed: ${JSON.stringify(r.json)}`);

  r = await api('POST', '/users/auth/verify-otp', {
    body: { mobile, code: OTP },
  });
  assert(r.status < 400, `verify-otp failed: ${JSON.stringify(r.json)}`);
  const token = r.json.data.accessToken;
  const user = r.json.data.user;
  const userId = user.id;
  console.log('   userId', userId, 'role', user.role?.slug ?? user.roles);

  r = await api('GET', '/credit/balance', { token });
  assert(r.status < 400, `credit balance failed: ${JSON.stringify(r.json)}`);
  const bal0 = r.json.data;
  console.log('2) Credit after signup', bal0);
  assert(Number(bal0.amount) === 0, 'amount must be 0 at signup');
  assert(Number(bal0.lockedAmount) === 0, 'lockedAmount must be 0');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  const offerId = ulid();
  const shippingId = ulid();
  const addressId = ulid();

  const [srcOffers] = await conn.query(
    `SELECT sellerId, productId, attributes, price, stock, stockStatus, isOnSale, taxStatus, taxClass
     FROM seller_offers WHERE approvalStatus='approved' AND stock>0 LIMIT 1`,
  );
  assert(srcOffers[0], 'need approved offer in DB');
  const src = srcOffers[0];

  const [srcShip] = await conn.query(
    `SELECT name, price, isCod, sortOrder FROM shipping_methods WHERE isActive=1 LIMIT 1`,
  );
  assert(srcShip[0], 'need shipping method');

  await conn.execute(
    `INSERT INTO seller_offers
      (id, sellerId, productId, attributes, sku, price, stock, stockStatus, isOnSale, taxStatus, taxClass, isActive, approvalStatus, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'approved', NOW(6), NOW(6))`,
    [
      offerId,
      src.sellerId,
      src.productId,
      JSON.stringify(src.attributes ?? {}),
      `TEST-${offerId.slice(-8)}`,
      src.price,
      Math.max(Number(src.stock), 5),
      src.stockStatus || 'instock',
      src.isOnSale ? 1 : 0,
      src.taxStatus,
      src.taxClass,
    ],
  );

  await conn.execute(
    `INSERT INTO shipping_methods
      (id, name, slug, price, isCod, isActive, sortOrder, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 1, ?, NOW(6), NOW(6))`,
    [
      shippingId,
      'Test Shipping',
      `test-${shippingId.slice(-8).toLowerCase()}`,
      srcShip[0].price,
      srcShip[0].isCod ? 1 : 0,
      Number(srcShip[0].sortOrder ?? 0),
    ],
  );

  await conn.execute(
    `INSERT INTO user_addresses
      (id, userId, title, province, city, addressDetail, postalCode, recipientFullName, recipientPhone, isDefault, createdAt, updatedAt)
     VALUES (?, ?, 'Home', 'Tehran', 'Tehran', 'Test st', '1234567890', 'Test User', ?, 1, NOW(6), NOW(6))`,
    [addressId, userId, mobile],
  );

  console.log('3) Fixtures', { offerId, shippingId, addressId });

  r = await api('POST', '/shopping-cart/items', {
    token,
    body: { offerId, quantity: 1 },
  });
  assert(r.status < 400, `add cart failed: ${JSON.stringify(r.json)}`);
  console.log('4) Cart item added');

  r = await api('POST', '/orders', {
    token,
    body: {
      products: [{ offerId, quantity: 1 }],
      shippingMethodId: shippingId,
    },
  });
  assert(r.status < 400, `order failed: ${JSON.stringify(r.json)}`);
  const order = r.json.data;
  console.log('5) Order', { id: order.id, amount: order.amount, status: order.status });
  assert(order.status === 'pending', 'order pending');
  assert(order.paymentUrl, 'order must return paymentUrl');
  console.log('6) Order paymentUrl', order.paymentUrl);

  const [deps] = await conn.query(
    `SELECT id, trackId, gateway, status FROM deposits WHERE orderId = ?`,
    [order.id],
  );
  assert(deps[0], 'order create must create pending deposit');
  assert(deps[0].gateway === 'iBank', 'deposit gateway must be iBank');
  assert(deps[0].status === 'pending', 'deposit must be pending');
  console.log('7) Pending deposit', deps[0]);

  r = await api('POST', '/deposits', {
    token,
    body: { amount: 50000, method: 'iBank' },
  });
  assert(r.status < 400, `top-up failed: ${JSON.stringify(r.json)}`);
  assert(r.json.data?.paymentUrl, 'top-up must return paymentUrl');
  console.log('8) Wallet top-up', {
    depositId: r.json.data.depositId,
    paymentUrl: r.json.data.paymentUrl,
  });

  r = await api('POST', '/orders', {
    token,
    body: {
      products: [{ offerId, quantity: 1 }],
      shippingMethodId: shippingId,
    },
  });
  assert(r.status < 400, `2nd order failed: ${JSON.stringify(r.json)}`);
  const order2 = r.json.data;
  assert(order2.paymentUrl, '2nd order must return paymentUrl');
  console.log('9) Second order', { id: order2.id, paymentUrl: order2.paymentUrl });

  await conn.execute(
    `DELETE FROM shipping_methods WHERE id = ? AND id NOT IN (SELECT shippingMethodId FROM orders WHERE shippingMethodId IS NOT NULL)`,
    [shippingId],
  ).catch(() => undefined);
  await conn.end();

  console.log('\n✅ Purchase flow OK');
  console.log('   - order create returns paymentUrl (iBank)');
  console.log('   - pending deposit row created');
  console.log('   - POST /deposits top-up returns paymentUrl');
}

main().catch((e) => {
  console.error('\n❌', e.message || e);
  process.exit(1);
});
