import { appendFile, writeFile } from 'node:fs/promises';
import {
  BATCH_SIZE,
  asBoolean,
  assertTables,
  openLegacyConnection,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';
const reportPath =
  process.env.MIGRATION_WISHLISTS_REPORT_PATH ||
  'migration-wishlists-report.jsonl';
const key = (t, id) => `${t}\u0000${id}`;
async function report(e) {
  await appendFile(reportPath, `${JSON.stringify(e)}\n`, 'utf8');
}
async function each(db, sql, fn) {
  let o = 0,
    b = 0;
  while (1) {
    const [r] = await db.execute(`${sql} LIMIT ? OFFSET ?`, [BATCH_SIZE, o]);
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
  const total = {
    wishlists: 0,
    items: 0,
    unlinkedUsers: 0,
    missingProducts: 0,
  };
  try {
    await assertTables(
      s,
      requiredEnv('LEGACY_MIGRATED_DB_DATABASE'),
      ['wishlists', 'wishlist_items', 'users', 'products'],
      'Legacy',
    );
    await assertTables(
      t,
      requiredEnv('DB_DATABASE'),
      ['wishlists', 'wishlist_items', 'users', 'products'],
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
    const [p] = await t.execute(
      "SELECT id,legacyId FROM products WHERE legacyTable='products' AND legacyId IS NOT NULL",
    );
    const products = new Map(p.map((x) => [String(x.legacyId), x.id]));
    const [w] = await s.execute(
      'SELECT w.*,u.legacyId userLegacyId,u.legacyTable userLegacyTable FROM wishlists w LEFT JOIN users u ON u.id=w.userId ORDER BY w.legacyId,w.id',
    );
    for (const r of w) {
      const userId =
        r.userLegacyId === null
          ? null
          : users.get(key(r.userLegacyTable, r.userLegacyId)) || null;
      if (r.userId && !userId) {
        total.unlinkedUsers++;
        await report({
          type: 'unlinked-user',
          legacyWishlistId: r.id,
          legacyUserId: r.userId,
        });
      }
      await t.execute(
        'INSERT INTO wishlists (id,legacyId,legacyTable,userId,name,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE userId=VALUES(userId),name=VALUES(name),createdAt=VALUES(createdAt),updatedAt=VALUES(updatedAt)',
        [
          r.id,
          r.legacyId,
          r.legacyTable,
          userId,
          r.name,
          r.createdAt,
          r.updatedAt,
        ],
      );
      total.wishlists++;
    }
    const batches = await each(
      s,
      'SELECT i.*,w.legacyId wishlistLegacyId,p.legacyId productLegacyId FROM wishlist_items i JOIN wishlists w ON w.id=i.wishlistId LEFT JOIN products p ON p.id=i.productId ORDER BY i.legacyId,i.id',
      async (rows) => {
        for (const r of rows) {
          const productId =
            r.productLegacyId === null
              ? null
              : products.get(String(r.productLegacyId)) || null;
          if (r.productId && !productId) {
            total.missingProducts++;
            await report({
              type: 'missing-product',
              legacyWishlistItemId: r.id,
              legacyProductId: r.productId,
            });
          }
          await t.execute(
            'INSERT INTO wishlist_items (id,legacyId,legacyTable,wishlistId,productId,addedAt,wasOnSale) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE wishlistId=VALUES(wishlistId),productId=VALUES(productId),addedAt=VALUES(addedAt),wasOnSale=VALUES(wasOnSale)',
            [
              r.id,
              r.legacyId,
              r.legacyTable,
              r.wishlistId,
              productId,
              r.addedAt,
              asBoolean(r.wasOnSale) ? 1 : 0,
            ],
          );
          total.items++;
        }
      },
    );
    const done = {
      type: 'run-complete',
      complete: true,
      batches,
      totals: total,
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
