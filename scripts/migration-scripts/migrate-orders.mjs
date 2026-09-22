/** Imports legacy order headers, address snapshots, line items, and item options. */
import { appendFile, writeFile } from 'node:fs/promises';
import {
  BATCH_SIZE,
  asBoolean,
  assertColumns,
  assertTables,
  openLegacyConnection,
  openTargetConnection,
  requiredEnv,
} from './shared.mjs';

const reportPath =
  process.env.MIGRATION_ORDERS_REPORT_PATH || 'migration-orders-report.jsonl';
const text = (v, n) =>
  v === null || v === undefined ? null : String(v).trim().slice(0, n) || null;
const amount = (v) =>
  v === null || v === undefined || v === '' ? 0 : String(v);
const key = (table, id) => `${table}\u0000${String(id)}`;
const status = (value) => {
  const raw = String(value || '').toLowerCase();
  if (/(complete|processing|paid)/.test(raw)) return 'paid';
  if (/(fail|declin)/.test(raw)) return 'failed';
  if (/(cancel|refund)/.test(raw)) return 'cancelled';
  return 'pending';
};
async function report(event) {
  await appendFile(reportPath, `${JSON.stringify(event)}\n`, 'utf8');
}
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
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(
    'Usage: npm run db:migrate:orders\nRun after customers, catalog, and seller offers.',
  );
  process.exit(0);
}

async function main() {
  const source = await openLegacyConnection();
  const target = await openTargetConnection();
  const total = {
    ordersRead: 0,
    ordersAdded: 0,
    ordersUpdated: 0,
    ordersSkipped: 0,
    addresses: 0,
    items: 0,
    itemsSkipped: 0,
    options: 0,
  };
  try {
    const sourceDb = requiredEnv('LEGACY_MIGRATED_DB_DATABASE');
    const targetDb = requiredEnv('DB_DATABASE');
    await assertTables(
      source,
      sourceDb,
      [
        'orders',
        'order_addresses',
        'order_items',
        'order_item_options',
        'customers',
        'products',
      ],
      'Legacy',
    );
    await assertTables(
      target,
      targetDb,
      [
        'orders',
        'order_addresses',
        'order_items',
        'order_item_options',
        'customers',
        'users',
        'products',
        'seller_offers',
      ],
      'Target',
    );
    await assertColumns(
      target,
      targetDb,
      'orders',
      ['legacyId', 'legacyTable', 'customerId', 'legacyStatus'],
      'Target',
    );
    await writeFile(
      reportPath,
      `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`,
      'utf8',
    );
    const [customerRows] = await target.execute(
      'SELECT c.id, c.legacyId, c.legacyTable, c.userId FROM customers c',
    );
    const customers = new Map(
      customerRows.map((r) => [key(r.legacyTable, r.legacyId), r]),
    );
    const [existingRows] = await target.execute(
      "SELECT id, legacyId FROM orders WHERE legacyTable = 'wp_posts' AND legacyId IS NOT NULL",
    );
    const orders = new Map(
      existingRows.map((r) => [String(r.legacyId), String(r.id)]),
    );
    const [productRows] = await target.execute(
      'SELECT id, legacyId, legacyTable FROM products WHERE legacyId IS NOT NULL',
    );
    const products = new Map(
      // migrate-catalog normalizes target legacyTable to "products", while the
      // legacy product row keeps its original source label (usually wp_posts).
      // product legacyId is therefore the stable cross-database identity here.
      productRows.map((r) => [String(r.legacyId), String(r.id)]),
    );
    const [offerRows] = await target.execute(
      'SELECT id, legacySourceId, sellerId FROM seller_offers WHERE legacySourceId IS NOT NULL',
    );
    const offers = new Map(offerRows.map((r) => [String(r.legacySourceId), r]));
    const migrateHeaders = await batches(
      source,
      `SELECT o.*, c.legacyId customerLegacyId, c.legacyTable customerLegacyTable FROM orders o LEFT JOIN customers c ON c.id=o.customerId ORDER BY o.legacyId,o.id`,
      async (rows, offset, batch) => {
        const count = { read: rows.length, added: 0, updated: 0, skipped: 0 };
        await target.beginTransaction();
        try {
          for (const r of rows) {
            const customer =
              r.customerLegacyId === null
                ? null
                : customers.get(key(r.customerLegacyTable, r.customerLegacyId));
            if (r.customerId && !customer) {
              await report({
                type: 'missing-imported-customer',
                legacyOrderId: r.id,
                legacyOrderLegacyId: r.legacyId,
                legacyCustomerId: r.customerId,
              });
            }
            const values = [
              customer?.userId || null,
              customer?.id || null,
              null,
              null,
              amount(r.netTotal),
              amount(r.shippingTotal),
              amount(r.taxTotal),
              amount(r.total),
              status(r.status),
              text(r.status, 50),
              text(r.currency, 10),
              text(r.paymentMethod, 100),
              text(r.paymentMethodTitle, 255),
              text(r.transactionId, 255),
              r.customerNote,
              r.placedAt,
              r.paidAt,
              r.completedAt,
              r.createdAt,
              r.updatedAt,
            ];
            const id = String(r.id);
            if (orders.has(String(r.legacyId))) {
              await target.execute(
                'UPDATE orders SET userId=?,customerId=?,addressId=?,shippingMethodId=?,subtotal=?,shippingAmount=?,taxTotal=?,amount=?,status=?,legacyStatus=?,currency=?,paymentMethod=?,paymentMethodTitle=?,transactionId=?,customerNote=?,placedAt=?,paidAt=?,completedAt=?,createdAt=?,updatedAt=? WHERE id=?',
                [...values, orders.get(String(r.legacyId))],
              );
              count.updated++;
            } else {
              await target.execute(
                "INSERT INTO orders (id,legacyId,legacyTable,userId,customerId,addressId,shippingMethodId,subtotal,shippingAmount,taxTotal,amount,status,legacyStatus,currency,paymentMethod,paymentMethodTitle,transactionId,customerNote,placedAt,paidAt,completedAt,createdAt,updatedAt) VALUES (?,?,'wp_posts',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [id, r.legacyId, ...values],
              );
              orders.set(String(r.legacyId), id);
              count.added++;
            }
          }
          await target.commit();
        } catch (e) {
          await target.rollback();
          throw e;
        }
        total.ordersRead += count.read;
        total.ordersAdded += count.added;
        total.ordersUpdated += count.updated;
        total.ordersSkipped += count.skipped;
        console.log(
          JSON.stringify({ entity: 'orders', batch, offset, ...count }),
        );
      },
    );
    await batches(
      source,
      `SELECT * FROM order_addresses ORDER BY id`,
      async (rows) => {
        await target.beginTransaction();
        try {
          for (const r of rows) {
            const orderId = orders.get(
              String(
                (
                  await source.execute(
                    'SELECT legacyId FROM orders WHERE id=?',
                    [r.orderId],
                  )
                )[0][0]?.legacyId,
              ),
            );
            if (!orderId) continue;
            const [address] = await target.execute(
              'SELECT id FROM user_addresses WHERE id=?',
              [r.addressId],
            );
            await target.execute(
              'INSERT INTO order_addresses (id,orderId,addressId,type,firstName,lastName,company,address1,address2,city,state,postalCode,country,email,phone,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE orderId=VALUES(orderId),addressId=VALUES(addressId),type=VALUES(type),firstName=VALUES(firstName),lastName=VALUES(lastName),company=VALUES(company),address1=VALUES(address1),address2=VALUES(address2),city=VALUES(city),state=VALUES(state),postalCode=VALUES(postalCode),country=VALUES(country),email=VALUES(email),phone=VALUES(phone),createdAt=VALUES(createdAt),updatedAt=VALUES(updatedAt)',
              [
                r.id,
                orderId,
                address[0]?.id || null,
                r.type,
                r.firstName,
                r.lastName,
                r.company,
                r.address1,
                r.address2,
                r.city,
                r.state,
                r.postalCode,
                r.country,
                r.email,
                r.phone,
                r.createdAt,
                r.updatedAt,
              ],
            );
            total.addresses++;
          }
          await target.commit();
        } catch (e) {
          await target.rollback();
          throw e;
        }
      },
    );
    await batches(
      source,
      `SELECT i.*, o.legacyId orderLegacyId, p.legacyId productLegacyId, p.legacyTable productLegacyTable FROM order_items i JOIN orders o ON o.id=i.orderId LEFT JOIN products p ON p.id=i.productId ORDER BY i.legacyId,i.id`,
      async (rows) => {
        await target.beginTransaction();
        try {
          for (const r of rows) {
            const orderId = orders.get(String(r.orderLegacyId));
            const productId =
              r.productLegacyId === null
                ? null
                : products.get(String(r.productLegacyId));
            if (!orderId || !productId) {
              await report({
                type: 'missing-order-or-product',
                legacyOrderItemId: r.id,
              });
              total.itemsSkipped++;
              continue;
            }
            const offer = r.productVariantId
              ? offers.get(String(r.productVariantId))
              : null;
            await target.execute(
              "INSERT INTO order_items (id,legacyId,legacyTable,orderId,productId,offerId,attributes,sellerId,sku,quantity,unitPrice,name,type,subtotal,subtotalTax,total,totalTax,createdAt) VALUES (?,?,?, ?,?,?,CAST('{}' AS JSON),?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE orderId=VALUES(orderId),productId=VALUES(productId),offerId=VALUES(offerId),sellerId=VALUES(sellerId),sku=VALUES(sku),quantity=VALUES(quantity),unitPrice=VALUES(unitPrice),name=VALUES(name),type=VALUES(type),subtotal=VALUES(subtotal),subtotalTax=VALUES(subtotalTax),total=VALUES(total),totalTax=VALUES(totalTax),createdAt=VALUES(createdAt)",
              [
                r.id,
                r.legacyId,
                r.legacyTable,
                orderId,
                productId,
                offer?.id || null,
                offer?.sellerId || null,
                text(r.sku, 100),
                Math.round(Number(r.quantity || 0)),
                amount(r.total),
                r.name,
                text(r.type, 200),
                r.subtotal,
                r.subtotalTax,
                r.total,
                r.totalTax,
                r.createdAt,
              ],
            );
            total.items++;
          }
          await target.commit();
        } catch (e) {
          await target.rollback();
          throw e;
        }
      },
    );
    const complete = {
      type: 'run-complete',
      complete: true,
      batches: migrateHeaders,
      totals: total,
      reportPath,
    };
    await report(complete);
    console.log(JSON.stringify(complete, null, 2));
  } finally {
    await source.end();
    await target.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
