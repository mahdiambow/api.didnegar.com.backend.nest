import { appendFile, writeFile } from 'node:fs/promises';
import {
  BATCH_SIZE,
  assertTables,
  newId,
  openLegacyConnection,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';
const reportPath =
  process.env.MIGRATION_USER_CARTS_REPORT_PATH ||
  'migration-user-carts-report.jsonl';
const key = (t, id) => `${t}\u0000${id}`;
async function report(x) {
  await appendFile(reportPath, `${JSON.stringify(x)}\n`, 'utf8');
}
async function each(s, sql, fn) {
  let o = 0,
    b = 0;
  while (1) {
    const [r] = await s.execute(`${sql} LIMIT ? OFFSET ?`, [BATCH_SIZE, o]);
    if (!r.length) return b;
    b++;
    await fn(r, b, o);
    o += r.length;
    if (r.length < BATCH_SIZE) return b;
  }
}
async function main() {
  const s = await openLegacyConnection(),
    t = await openTargetConnection();
  const totals = {
    carts: 0,
    items: 0,
    guestCartsIgnored: 0,
    unlinkedUsers: 0,
    missingOffers: 0,
  };
  try {
    await assertTables(
      s,
      requiredEnv('LEGACY_MIGRATED_DB_DATABASE'),
      ['shopping_carts', 'shopping_cart_items', 'users'],
      'Legacy',
    );
    await assertTables(
      t,
      requiredEnv('DB_DATABASE'),
      ['shopping_carts', 'shopping_cart_items', 'users', 'seller_offers'],
      'Target',
    );
    await writeFile(
      reportPath,
      `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`,
    );
    const [u] = await t.execute(
      'SELECT id,legacyId,legacyTable FROM users WHERE legacyId IS NOT NULL',
    );
    const users = new Map(u.map((x) => [key(x.legacyTable, x.legacyId), x.id]));
    const [offers] = await t.execute(
      'SELECT id,legacySourceId FROM seller_offers WHERE legacySourceId IS NOT NULL',
    );
    const offerMap = new Map(
      offers.map((x) => [String(x.legacySourceId), x.id]),
    );
    const carts = new Map();
    const b = await each(
      s,
      'SELECT c.id,c.userId,u.legacyId userLegacyId,u.legacyTable userLegacyTable FROM shopping_carts c LEFT JOIN users u ON u.id=c.userId ORDER BY c.id',
      async (rows) => {
        for (const r of rows) {
          if (!r.userId) {
            totals.guestCartsIgnored++;
            continue;
          }
          const userId =
            r.userLegacyId === null
              ? null
              : users.get(key(r.userLegacyTable, r.userLegacyId));
          if (!userId) {
            totals.unlinkedUsers++;
            await report({
              type: 'unlinked-user',
              legacyCartId: r.id,
              legacyUserId: r.userId,
            });
            continue;
          }
          const [e] = await t.execute(
            'SELECT id FROM shopping_carts WHERE userId=? LIMIT 1',
            [userId],
          );
          const id = e[0]?.id || newId();
          if (!e[0])
            await t.execute(
              'INSERT INTO shopping_carts (id,userId,createdAt,updatedAt) VALUES (?,?,NOW(),NOW())',
              [id, userId],
            );
          carts.set(String(r.id), id);
          totals.carts++;
        }
      },
    );
    await each(
      s,
      'SELECT * FROM shopping_cart_items ORDER BY id',
      async (rows) => {
        for (const r of rows) {
          const cartId = carts.get(String(r.cartId));
          if (!cartId) continue;
          const offerId = r.productVariantId
            ? offerMap.get(String(r.productVariantId))
            : null;
          if (!offerId) {
            totals.missingOffers++;
            await report({
              type: 'missing-offer',
              legacyCartItemId: r.id,
              legacyVariantId: r.productVariantId,
            });
            continue;
          }
          const quantity = Math.max(1, Math.round(Number(r.quantity || 0)));
          const [e] = await t.execute(
            'SELECT id FROM shopping_cart_items WHERE cartId=? AND offerId=? LIMIT 1',
            [cartId, offerId],
          );
          if (e[0])
            await t.execute(
              'UPDATE shopping_cart_items SET quantity=?,updatedAt=NOW() WHERE id=?',
              [quantity, e[0].id],
            );
          else
            await t.execute(
              'INSERT INTO shopping_cart_items (id,cartId,offerId,quantity,createdAt,updatedAt) VALUES (?,?,?,?,NOW(),NOW())',
              [newId(), cartId, offerId, quantity],
            );
          totals.items++;
        }
      },
    );
    const done = {
      type: 'run-complete',
      complete: true,
      batches: b,
      totals,
      reportPath,
    };
    await report(done);
    console.log(JSON.stringify(done, null, 2));
  } finally {
    await s.end();
    await t.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
