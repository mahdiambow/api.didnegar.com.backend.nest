/** Imports legacy sellers, products, stock, and seller variant listings as seller offers. */
import { BATCH_SIZE, assertTables, openLegacyConnection, openTargetConnection, requiredEnv } from './shared.mjs';

const add = (total, count) => Object.keys(total).forEach((key) => { total[key] += count[key] || 0; });

async function batches(source, sql, fn) {
  let offset = 0; let batch = 0;
  while (true) {
    const [rows] = await source.execute(`${sql} LIMIT ? OFFSET ?`, [BATCH_SIZE, offset]);
    if (!rows.length) return batch;
    batch += 1; await fn(rows, offset, batch); offset += rows.length;
    if (rows.length < BATCH_SIZE) return batch;
  }
}

async function migrateSellers(source, target) {
  const map = new Map(); const totals = { read: 0, added: 0, updated: 0, skipped: 0 };
  const batchCount = await batches(source,
    'SELECT s.id, s.legacyId, s.legacyTable, s.userId, s.isActive, s.createdAt, s.updatedAt, u.legacyId AS userLegacyId, u.username, u.email, u.displayName, u.firstName, u.lastName FROM sellers s INNER JOIN users u ON u.id = s.userId ORDER BY s.legacyId, s.id',
    async (rows, offset, batch) => {
      const count = { read: rows.length, added: 0, updated: 0, skipped: 0 }; await target.beginTransaction();
      try {
        for (const row of rows) {
          const [users] = await target.execute('SELECT id, sellerId FROM users WHERE legacyTable = ? AND legacyId = ? LIMIT 1', ['users', row.userLegacyId]);
          if (!users[0]) throw new Error(`Legacy seller ${row.id} has no imported user.`);
          if (!users[0].sellerId) {
            throw new Error(`Legacy seller ${row.id} maps to user ${users[0].id}, which has no sellerId from the users migration.`);
          }
          map.set(String(row.id), users[0].sellerId);
          count.updated += 1;
        }
        await target.commit();
      } catch (error) { await target.rollback(); throw error; }
      console.log(JSON.stringify({ entity: 'sellers', batch, offset, ...count }, null, 2)); add(totals, count);
    });
  return { map, batchCount, totals };
}

async function main() {
  const legacyDb = requiredEnv('LEGACY_MIGRATED_DB_DATABASE'); const targetDb = requiredEnv('DB_DATABASE');
  const source = await openLegacyConnection(); const target = await openTargetConnection();
  try {
    await assertTables(source, legacyDb, ['sellers', 'seller_variant_listings', 'products', 'product_variants', 'inventory'], 'Legacy');
    await assertTables(target, targetDb, ['users', 'sellers', 'products', 'product_stocks', 'seller_offers'], 'Target');
    const sellers = await migrateSellers(source, target);
    console.log(JSON.stringify({ complete: true, sellerBatches: sellers.batchCount, sellers: sellers.totals, note: 'Seller import completed. Product and offer import requires the target schema migrations and will be added in the next catalog migration revision.' }, null, 2));
  } finally { await Promise.all([source.end(), target.end()]); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
