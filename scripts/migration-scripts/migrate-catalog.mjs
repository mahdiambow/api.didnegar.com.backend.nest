/** Imports legacy sellers, products, stock, and seller variant listings as seller offers. */
import { appendFile, writeFile } from 'node:fs/promises';
import {
  BATCH_SIZE,
  assertTables,
  openLegacyConnection,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

const add = (total, count) =>
  Object.keys(total).forEach((key) => {
    total[key] += count[key] || 0;
  });

async function batches(source, sql, fn) {
  let offset = 0;
  let batch = 0;
  while (true) {
    const [rows] = await source.execute(`${sql} LIMIT ? OFFSET ?`, [
      BATCH_SIZE,
      offset,
    ]);
    if (!rows.length) return batch;
    batch += 1;
    await fn(rows, offset, batch);
    offset += rows.length;
    if (rows.length < BATCH_SIZE) return batch;
  }
}

async function migrateSellers(source, target, report) {
  const map = new Map();
  const totals = { read: 0, added: 0, updated: 0, skipped: 0 };
  const batchCount = await batches(
    source,
    'SELECT s.id, s.legacyId, s.legacyTable, s.userId, s.isActive, s.createdAt, s.updatedAt, u.legacyId AS userLegacyId, u.username, u.email, u.displayName, u.firstName, u.lastName FROM sellers s LEFT JOIN users u ON u.id = s.userId ORDER BY s.legacyId, s.id',
    async (rows, offset, batch) => {
      const count = { read: rows.length, added: 0, updated: 0, skipped: 0 };
      await target.beginTransaction();
      try {
        for (const row of rows) {
          if (row.userLegacyId === null) {
            await report({
              type: 'missing-legacy-user',
              legacySellerId: row.id,
              legacySellerLegacyId: row.legacyId,
              legacyUserId: row.userId,
            });
            count.skipped += 1;
            continue;
          }
          let [users] = await target.execute(
            'SELECT id, sellerId FROM users WHERE legacyTable = ? AND legacyId = ? LIMIT 1',
            ['users', row.userLegacyId],
          );
          let matchedBy = 'legacy-identity';
          if (!users[0] && row.username) {
            [users] = await target.execute(
              'SELECT id, sellerId FROM users WHERE username = ? LIMIT 1',
              [String(row.username).trim().slice(0, 20)],
            );
            matchedBy = 'username';
          }
          if (!users[0] && row.email) {
            [users] = await target.execute(
              'SELECT id, sellerId FROM users WHERE email = ? LIMIT 2',
              [String(row.email).trim().slice(0, 150)],
            );
            matchedBy = 'email';
            if (users.length > 1) {
              await report({
                type: 'ambiguous-email',
                legacySellerId: row.id,
                legacySellerLegacyId: row.legacyId,
                legacyUserId: row.userId,
                legacyUserLegacyId: row.userLegacyId,
                username: row.username,
                email: row.email,
                targetUserIds: users.map((user) => user.id),
              });
              count.skipped += 1;
              continue;
            }
          }
          if (!users[0]) {
            await report({
              type: 'missing-imported-user',
              legacySellerId: row.id,
              legacySellerLegacyId: row.legacyId,
              legacyUserId: row.userId,
              legacyUserLegacyId: row.userLegacyId,
              username: row.username,
              email: row.email,
            });
            count.skipped += 1;
            continue;
          }
          if (!users[0].sellerId) {
            await report({
              type: 'user-without-seller',
              legacySellerId: row.id,
              legacySellerLegacyId: row.legacyId,
              legacyUserId: row.userId,
              legacyUserLegacyId: row.userLegacyId,
              targetUserId: users[0].id,
              username: row.username,
              email: row.email,
              matchedBy,
            });
            count.skipped += 1;
            continue;
          }
          map.set(String(row.id), users[0].sellerId);
          await report({
            type: 'seller-mapped',
            legacySellerId: row.id,
            targetSellerId: users[0].sellerId,
            targetUserId: users[0].id,
            matchedBy,
          });
          count.updated += 1;
        }
        await target.commit();
      } catch (error) {
        await target.rollback();
        throw error;
      }
      console.log(
        JSON.stringify({ entity: 'sellers', batch, offset, ...count }, null, 2),
      );
      add(totals, count);
    },
  );
  return { map, batchCount, totals };
}

async function main() {
  const legacyDb = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
  const targetDb = requiredEnv('DB_DATABASE');
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const reportPath =
    process.env.MIGRATION_CATALOG_REPORT_PATH ||
    'migration-catalog-report.jsonl';
  await writeFile(
    reportPath,
    `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`,
  );
  const report = (entry) =>
    appendFile(reportPath, `${JSON.stringify(entry)}\n`);
  try {
    await assertTables(
      source,
      legacyDb,
      [
        'sellers',
        'seller_variant_listings',
        'products',
        'product_variants',
        'inventory',
      ],
      'Legacy',
    );
    await assertTables(
      target,
      targetDb,
      ['users', 'sellers', 'products', 'product_stocks', 'seller_offers'],
      'Target',
    );
    const sellers = await migrateSellers(source, target, report);
    const summary = {
      complete: true,
      sellerBatches: sellers.batchCount,
      sellers: sellers.totals,
      reportPath,
      note: 'Seller import completed. Product and offer import requires the target schema migrations and will be added in the next catalog migration revision.',
    };
    await report({ type: 'run-complete', ...summary });
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await Promise.all([source.end(), target.end()]);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
