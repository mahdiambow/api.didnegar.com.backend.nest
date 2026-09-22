/** Imports legacy product reviews after the reviews schema migration is applied. */
import { appendFile, writeFile } from 'node:fs/promises';
import {
  BATCH_SIZE,
  assertColumns,
  assertTables,
  openLegacyConnection,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

const reportPath =
  process.env.MIGRATION_REVIEWS_REPORT_PATH || 'migration-reviews-report.jsonl';
const key = (table, id) => `${table}\u0000${String(id)}`;
const text = (value, length) =>
  value === null || value === undefined
    ? null
    : String(value).trim().slice(0, length) || null;
const status = (value) =>
  ['approved', 'pending', 'spam'].includes(String(value))
    ? String(value)
    : 'pending';
async function report(event) {
  await appendFile(reportPath, `${JSON.stringify(event)}\n`, 'utf8');
}
async function batches(source, sql, fn) {
  let offset = 0,
    batch = 0;
  while (true) {
    const [rows] = await source.execute(`${sql} LIMIT ? OFFSET ?`, [
      BATCH_SIZE,
      offset,
    ]);
    if (!rows.length) return batch;
    batch++;
    await fn(rows, offset, batch);
    offset += rows.length;
    if (rows.length < BATCH_SIZE) return batch;
  }
}
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(
    'Usage: npm run db:migrate:reviews\nRun after the reviews schema migration and catalog migration.',
  );
  process.exit(0);
}

async function main() {
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const totals = {
    read: 0,
    added: 0,
    updated: 0,
    skipped: 0,
    missingProducts: 0,
    unlinkedUsers: 0,
    parentLinked: 0,
    missingParents: 0,
  };
  try {
    const sourceDb = requiredEnv('LEGACY_MIGRATED_DB_DATABASE'),
      targetDb = requiredEnv('DB_DATABASE');
    await assertTables(
      source,
      sourceDb,
      ['reviews', 'products', 'users'],
      'Legacy',
    );
    await assertTables(
      target,
      targetDb,
      ['reviews', 'products', 'users'],
      'Target',
    );
    await assertColumns(
      source,
      sourceDb,
      'reviews',
      [
        'id',
        'legacyId',
        'legacyTable',
        'productId',
        'userId',
        'authorName',
        'authorEmail',
        'authorUrl',
        'authorIp',
        'content',
        'status',
        'parentId',
        'rating',
        'createdAt',
        'updatedAt',
      ],
      'Legacy',
    );
    await assertColumns(
      target,
      targetDb,
      'reviews',
      [
        'id',
        'legacyId',
        'legacyTable',
        'productId',
        'userId',
        'authorName',
        'authorEmail',
        'authorUrl',
        'authorIp',
        'content',
        'status',
        'parentId',
        'rating',
        'createdAt',
        'updatedAt',
      ],
      'Target',
    );
    await writeFile(
      reportPath,
      `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`,
      'utf8',
    );
    const [productRows] = await target.execute(
      "SELECT id,legacyId FROM products WHERE legacyTable = 'products' AND legacyId IS NOT NULL",
    );
    const products = new Map(
      productRows.map((r) => [String(r.legacyId), String(r.id)]),
    );
    const [userRows] = await target.execute(
      'SELECT id,legacyId,legacyTable FROM users WHERE legacyId IS NOT NULL AND legacyTable IS NOT NULL',
    );
    const users = new Map(
      userRows.map((r) => [key(r.legacyTable, r.legacyId), String(r.id)]),
    );
    const imported = new Set();
    const batchCount = await batches(
      source,
      `SELECT r.*, p.legacyId productLegacyId, u.legacyId userLegacyId, u.legacyTable userLegacyTable FROM reviews r LEFT JOIN products p ON p.id=r.productId LEFT JOIN users u ON u.id=r.userId ORDER BY r.legacyId,r.id`,
      async (rows, offset, batch) => {
        const count = {
          read: rows.length,
          added: 0,
          updated: 0,
          skipped: 0,
          missingProducts: 0,
          unlinkedUsers: 0,
        };
        await target.beginTransaction();
        try {
          for (const r of rows) {
            const productId =
              r.productLegacyId === null
                ? null
                : products.get(String(r.productLegacyId));
            if (!productId) {
              await report({
                type: 'missing-product',
                legacyReviewId: r.id,
                legacyProductId: r.productId,
                productLegacyId: r.productLegacyId,
              });
              count.skipped++;
              count.missingProducts++;
              continue;
            }
            const userId =
              r.userLegacyId === null
                ? null
                : users.get(key(r.userLegacyTable, r.userLegacyId)) || null;
            if (r.userId && !userId) {
              await report({
                type: 'unlinked-user',
                legacyReviewId: r.id,
                legacyUserId: r.userId,
              });
              count.unlinkedUsers++;
            }
            const rating =
              r.rating === null
                ? null
                : Math.max(0, Math.min(255, Math.round(Number(r.rating))));
            const values = [
              r.legacyId,
              r.legacyTable,
              productId,
              userId,
              text(r.authorName, 255),
              text(r.authorEmail, 320),
              text(r.authorUrl, 2048),
              text(r.authorIp, 100),
              r.content,
              status(r.status),
              null,
              rating,
              r.createdAt,
              r.updatedAt,
            ];
            const [existing] = await target.execute(
              'SELECT id FROM reviews WHERE legacyTable=? AND legacyId=? LIMIT 1',
              [r.legacyTable, r.legacyId],
            );
            if (existing[0]) {
              await target.execute(
                'UPDATE reviews SET productId=?,userId=?,authorName=?,authorEmail=?,authorUrl=?,authorIp=?,content=?,status=?,parentId=?,rating=?,createdAt=?,updatedAt=? WHERE id=?',
                [...values.slice(2), existing[0].id],
              );
              count.updated++;
              imported.add(String(existing[0].id));
            } else {
              await target.execute(
                'INSERT INTO reviews (id,legacyId,legacyTable,productId,userId,authorName,authorEmail,authorUrl,authorIp,content,status,parentId,rating,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                [r.id, ...values],
              );
              count.added++;
              imported.add(String(r.id));
            }
          }
          await target.commit();
        } catch (e) {
          await target.rollback();
          throw e;
        }
        Object.keys(totals).forEach((k) => {
          if (k in count) totals[k] += count[k];
        });
        console.log(
          JSON.stringify({ entity: 'reviews', batch, offset, ...count }),
        );
      },
    );
    const [parentRows] = await source.execute(
      'SELECT id,parentId FROM reviews WHERE parentId IS NOT NULL',
    );
    for (const r of parentRows) {
      if (!imported.has(String(r.id))) continue;
      if (!imported.has(String(r.parentId))) {
        await report({
          type: 'missing-parent-review',
          legacyReviewId: r.id,
          legacyParentId: r.parentId,
        });
        totals.missingParents++;
        continue;
      }
      await target.execute('UPDATE reviews SET parentId=? WHERE id=?', [
        r.parentId,
        r.id,
      ]);
      totals.parentLinked++;
    }
    const complete = {
      type: 'run-complete',
      complete: true,
      batches: batchCount,
      totals,
      reportPath,
    };
    await report(complete);
    console.log(JSON.stringify(complete, null, 2));
  } finally {
    await source.end();
    await target.end();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
