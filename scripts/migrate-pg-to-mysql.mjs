/**
 * One-off: copy application data from local PostgreSQL → MySQL/MariaDB.
 * Usage: node scripts/migrate-pg-to-mysql.mjs
 */
import 'dotenv/config';
import pg from 'pg';
import mysql from 'mysql2/promise';

const PG = {
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT || 5432),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
  database: process.env.PG_DATABASE || 'didnegar',
};

const MY = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USERNAME || 'didnegar',
  password: process.env.DB_PASSWORD || 'didnegar',
  database: process.env.DB_DATABASE || 'didnegar',
  multipleStatements: true,
};

/** Insert order respecting FKs (skip migrations + PG-only archives) */
const TABLES = [
  'sellers',
  'roles',
  'users',
  'refresh_tokens',
  'user_profiles',
  'user_addresses',
  'countries',
  'states',
  'cities',
  'brands',
  'attributes',
  'categories',
  'sub_categories',
  'products',
  'product_stocks',
  'product_variants',
  'product_categories',
  'shipping_methods',
  'seller_offers',
  'offer_products',
  'orders',
  'order_items',
  'payments',
  'seller_contracts',
  'header_settings',
  'footer_settings',
  'about_us',
  'contact_settings',
  'contact_messages',
  'banners',
];

function toMysqlValue(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

function mapRow(table, row, mysqlCols) {
  const out = {};
  for (const col of mysqlCols) {
    if (!(col in row)) {
      // products.attributeIds missing in PG — default empty
      if (table === 'products' && col === 'attributeIds') {
        out[col] = '[]';
        continue;
      }
      continue;
    }
    let val = row[col];
    // PG still has products.attributes; MySQL does not — ignore
    if (table === 'products' && col === 'attributes') continue;

    // Normalize empty PG array / object defaults
    if (Array.isArray(val) || (val && typeof val === 'object' && !(val instanceof Date))) {
      out[col] = JSON.stringify(val);
    } else {
      out[col] = toMysqlValue(val);
    }
  }
  return out;
}

async function getMysqlColumns(conn, table) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
     ORDER BY ORDINAL_POSITION`,
    [MY.database, table],
  );
  return rows.map((r) => r.name);
}

async function main() {
  const pgClient = new pg.Client(PG);
  await pgClient.connect();
  const myConn = await mysql.createConnection(MY);

  console.log('Connected PG + MySQL');

  await myConn.query('SET FOREIGN_KEY_CHECKS = 0');
  await myConn.query('SET UNIQUE_CHECKS = 0');

  // Clear MySQL target tables (keep migrations)
  for (const table of [...TABLES].reverse()) {
    await myConn.query(`DELETE FROM \`${table}\``);
  }
  console.log('Cleared MySQL tables');

  let total = 0;
  for (const table of TABLES) {
    const exists = await pgClient.query(
      `SELECT to_regclass('public.${table}') IS NOT NULL AS ok`,
    );
    if (!exists.rows[0].ok) {
      console.log(`skip missing PG table: ${table}`);
      continue;
    }

    const { rows } = await pgClient.query(`SELECT * FROM "${table}"`);
    if (!rows.length) {
      console.log(`${table}: 0 rows`);
      continue;
    }

    const mysqlCols = await getMysqlColumns(myConn, table);
    const mapped = rows.map((r) => mapRow(table, r, mysqlCols));
    const cols = mysqlCols.filter((c) => mapped.some((m) => c in m));

    const placeholders = cols.map(() => '?').join(',');
    const colSql = cols.map((c) => `\`${c}\``).join(',');
    const sql = `INSERT INTO \`${table}\` (${colSql}) VALUES (${placeholders})`;

    for (const row of mapped) {
      const values = cols.map((c) => row[c] ?? null);
      try {
        await myConn.query(sql, values);
        total += 1;
      } catch (err) {
        console.error(`FAIL ${table}`, row.id ?? row, err.message);
        throw err;
      }
    }
    console.log(`${table}: ${rows.length} rows`);
  }

  await myConn.query('SET UNIQUE_CHECKS = 1');
  await myConn.query('SET FOREIGN_KEY_CHECKS = 1');

  // Sanity counts
  for (const t of ['users', 'roles', 'products', 'seller_offers', 'orders', 'shipping_methods']) {
    const [[{ c }]] = await myConn.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
    console.log(`mysql ${t}: ${c}`);
  }

  await pgClient.end();
  await myConn.end();
  console.log(`Done. Inserted ~${total} rows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
