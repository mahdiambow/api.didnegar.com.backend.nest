#!/usr/bin/env node
/**
 * Double-spending tests:
 * 1) Replay verify on same authority → no second IN/OUT
 * 2) Concurrent verify race → only one settlement
 * 3) Second payment on already-paid order → rejected
 * 4) Concurrent credit pays on same order → at most one success
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
  let r = await api('POST', '/shopping-cart/items', {
    token,
    body: { offerId, quantity: 1 },
  });
  assert(r.status < 400, `cart: ${JSON.stringify(r.json)}`);
  r = await api('POST', '/shopping-cart/checkout', {
    token,
    body: { addressId, shippingMethodIds: [shippingId] },
  });
  assert(r.status < 400, `checkout: ${JSON.stringify(r.json)}`);
  return r.json.data;
}

async function countLogs(conn, userId, sourceId) {
  const [rows] = await conn.query(
    `SELECT sourceType, COUNT(*) c FROM credit_logs
     WHERE userId = ? AND sourceId = ?
     GROUP BY sourceType`,
    [userId, sourceId],
  );
  const map = Object.fromEntries(rows.map((x) => [x.sourceType, Number(x.c)]));
  return { in: map.in ?? 0, out: map.out ?? 0, rows };
}

async function main() {
  console.log('BASE', BASE);
  const { token, userId, mobile } = await signup();
  const conn = await openDb();
  const fx = await createFixtures(conn, userId, mobile);
  console.log('user', userId);

  // --- A) Replay verify (sequential) ---
  console.log('\nA) Sequential double verify');
  const orderA = await checkout(token, fx.offerId, fx.addressId, fx.shippingId, conn);
  let r = await api('POST', '/deposits/request', {
    token,
    body: { orderId: orderA.id, method: 'iBank' },
  });
  assert(r.status < 400, `payA: ${JSON.stringify(r.json)}`);
  const trackIdA = r.json.data.trackId;
  const paymentIdA = r.json.data.depositId ?? r.json.data.paymentId;

  const v1 = await api(
    'GET',
    `/deposits/iBank/verify?trackId=${encodeURIComponent(trackIdA)}&success=1&status=2`,
  );
  assert(v1.status < 400 && v1.json.data?.status === 'success', 'first verify must succeed');

  const v2 = await api(
    'GET',
    `/deposits/iBank/verify?trackId=${encodeURIComponent(trackIdA)}&success=1&status=2`,
  );
  assert(v2.status < 400 && v2.json.data?.status === 'success', 'replay verify should be idempotent OK');
  assert(
    String(v2.json.data?.gatewayMessage || '').includes('قبلاً') ||
      v2.json.data?.creditBalance === undefined ||
      Number(v2.json.data?.creditBalance) === 0,
    'replay should not re-settle wallet oddly',
  );

  let counts = await countLogs(conn, userId, paymentIdA);
  console.log('   logs for payment', paymentIdA, counts);
  assert(counts.in === 1 && counts.out === 1, 'replay must not create second in/out');

  // pay again on same order
  r = await api('POST', '/deposits/request', {
    token,
    body: { orderId: orderA.id, method: 'iBank' },
  });
  console.log('   second request on paid order', r.status, r.code);
  assert(r.status >= 400, 'second payment request on paid order must fail');
  assert(
    ['ORDER_ALREADY_PAID', 'ORDER_NOT_PAYABLE'].includes(
      r.code || r.json?.code,
    ),
    `expect ORDER_ALREADY_PAID or ORDER_NOT_PAYABLE, got ${r.code || r.json?.code}`,
  );

  r = await api('POST', '/deposits/request', {
    token,
    body: { orderId: orderA.id, method: 'credit' },
  });
  console.log('   credit on paid order', r.status, r.code || r.json?.code);
  assert(r.status >= 400, 'credit on paid order must fail');
  assert(
    ['ORDER_ALREADY_PAID', 'ORDER_NOT_PAYABLE', 'INSUFFICIENT_CREDIT'].includes(
      r.code || r.json?.code,
    ),
    'credit on paid order must be rejected',
  );

  // --- B) Concurrent verify race ---
  console.log('\nB) Concurrent double verify race');
  const orderB = await checkout(token, fx.offerId, fx.addressId, fx.shippingId, conn);
  r = await api('POST', '/deposits/request', {
    token,
    body: { orderId: orderB.id, method: 'iBank' },
  });
  assert(r.status < 400, `payB: ${JSON.stringify(r.json)}`);
  const trackIdB = r.json.data.trackId;
  const paymentIdB = r.json.data.depositId ?? r.json.data.paymentId;

  const race = await Promise.all([
    api(
      'GET',
      `/deposits/iBank/verify?trackId=${encodeURIComponent(trackIdB)}&success=1&status=2`,
    ),
    api(
      'GET',
      `/deposits/iBank/verify?trackId=${encodeURIComponent(trackIdB)}&success=1&status=2`,
    ),
    api(
      'GET',
      `/deposits/iBank/verify?trackId=${encodeURIComponent(trackIdB)}&success=1&status=2`,
    ),
  ]);
  const ok = race.filter((x) => x.status < 400 && x.json.data?.status === 'success');
  console.log(
    '   race results',
    race.map((x) => ({ status: x.status, code: x.code, msg: x.json?.data?.gatewayMessage || x.json?.message })),
  );
  assert(ok.length >= 1, 'at least one verify must succeed');

  counts = await countLogs(conn, userId, paymentIdB);
  console.log('   logs for payment', paymentIdB, counts);
  assert(counts.in === 1 && counts.out === 1, 'race must settle credit exactly once (1 in + 1 out)');

  const [balRows] = await conn.query(
    `SELECT amount, lockedAmount FROM user_credits WHERE userId = ?`,
    [userId],
  );
  console.log('   wallet', balRows[0]);
  assert(Number(balRows[0]?.amount ?? 0) === 0, 'wallet amount must stay 0');

  // --- C) Concurrent credit spends (fund wallet first via SQL) ---
  console.log('\nC) Concurrent credit payments on same order');
  const orderC = await checkout(token, fx.offerId, fx.addressId, fx.shippingId, conn);
  const amount = Number(orderC.amount);

  // ensure wallet has enough for one payment only
  await conn.execute(
    `INSERT INTO user_credits (id, userId, amount, lockedAmount, createdAt, updatedAt)
     VALUES (?, ?, ?, 0, NOW(6), NOW(6))
     ON DUPLICATE KEY UPDATE amount = ?`,
    [ulid(), userId, amount, amount],
  );

  const creditRace = await Promise.all([
    api('POST', '/deposits/request', {
      token,
      body: { orderId: orderC.id, method: 'credit' },
    }),
    api('POST', '/deposits/request', {
      token,
      body: { orderId: orderC.id, method: 'credit' },
    }),
    api('POST', '/deposits/request', {
      token,
      body: { orderId: orderC.id, method: 'credit' },
    }),
  ]);
  const creditOk = creditRace.filter((x) => x.status < 400);
  const creditFail = creditRace.filter((x) => x.status >= 400);
  console.log(
    '   credit race',
    creditRace.map((x) => ({ status: x.status, code: x.code || x.json?.code })),
  );
  assert(creditOk.length === 1, `exactly one credit pay should succeed, got ${creditOk.length}`);
  assert(creditFail.length === 2, 'other credit pays must fail');
  for (const fail of creditFail) {
    assert(fail.status < 500, `loser must not be 500, got ${fail.status} ${fail.code || fail.json?.code}`);
    assert(
      ['ORDER_ALREADY_PAID', 'ORDER_NOT_PAYABLE', 'INSUFFICIENT_CREDIT'].includes(
        fail.code || fail.json?.code,
      ),
      `unexpected fail code ${fail.code || fail.json?.code}`,
    );
  }

  const [balAfter] = await conn.query(
    `SELECT amount FROM user_credits WHERE userId = ?`,
    [userId],
  );
  console.log('   wallet after credit race', balAfter[0]);
  assert(Number(balAfter[0].amount) === 0, 'wallet should be fully spent once');

  const [orderRow] = await conn.query(`SELECT status FROM orders WHERE id = ?`, [
    orderC.id,
  ]);
  assert(orderRow[0].status === 'paid', 'order C must be paid once');

  // total outs for this user should equal successful settlements (A + B + C = 3 outs from gateway A,B and credit C)
  // A and B each have in+out; C has out only (no depositFromGateway)
  const [allLogs] = await conn.query(
    `SELECT sourceType, COUNT(*) c FROM credit_logs WHERE userId = ? GROUP BY sourceType`,
    [userId],
  );
  console.log('\nTotal credit_logs', allLogs);

  await conn.end();
  console.log('\n✅ Double-spending checks passed');
}

main().catch((e) => {
  console.error('\n❌', e.message || e);
  process.exit(1);
});
