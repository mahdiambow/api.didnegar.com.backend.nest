/**
 * Production DB setup — همه چیز داخل همین فایل.
 *
 *   node dist/database/seeds/run-db-setup-prod.js
 *   # یا:
 *   npm run db:setup:prod
 *
 * Env:
 *   DB_* / SOURCE_DATABASE / MYSQL_ROOT_PASSWORD (اختیاری برای CREATE/GRANT)
 *   LEGACY_DUMP_PATH=/path/inside/container/to/dump.sql  (اگر didnegar_new خالی است)
 */
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import mysql, { type Connection, type RowDataPacket } from 'mysql2/promise';

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: process.env,
      shell: false,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

function openAdminConn() {
  const host = env('DB_HOST', 'localhost');
  const port = Number(env('DB_PORT', '3306'));
  const user = env('DB_USERNAME', 'didnegar');
  const password = env('DB_PASSWORD', 'didnegar');
  const rootPassword = process.env.MYSQL_ROOT_PASSWORD;

  return mysql.createConnection({
    host,
    port,
    user: rootPassword ? 'root' : user,
    password: rootPassword || password,
    multipleStatements: true,
    charset: 'utf8mb4',
  });
}

async function tableCount(conn: Connection, schema: string): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.tables
     WHERE table_schema = ?`,
    [schema],
  );
  return Number(rows[0]?.cnt ?? 0);
}

async function loadDump(conn: Connection, source: string, dumpPath: string) {
  if (!existsSync(dumpPath)) {
    throw new Error(`LEGACY_DUMP_PATH not found: ${dumpPath}`);
  }

  const sizeMb = (statSync(dumpPath).size / (1024 * 1024)).toFixed(1);
  console.log(`==> loading dump into ${source} (${sizeMb} MB) from ${dumpPath}`);

  let sql = readFileSync(dumpPath, 'utf8');
  // Strip dump noise that breaks mysql2 multi-statement runs
  sql = sql
    .replace(/^\/\*![0-9]{5}.*?\*\/;?\s*$/gm, '')
    .replace(/^--.*$/gm, '');

  await conn.query(`USE \`${source}\``);
  await conn.query(sql);
  console.log(`==> dump loaded into ${source}`);
}

async function ensureDatabasesAndDump() {
  const user = env('DB_USERNAME', 'didnegar');
  const target = env('DB_DATABASE', 'didnegar');
  const source = env('SOURCE_DATABASE', 'didnegar_new');
  const rootPassword = process.env.MYSQL_ROOT_PASSWORD;
  const dumpPath = process.env.LEGACY_DUMP_PATH?.trim() || '';

  const conn = await openAdminConn();
  try {
    console.log(`==> ensure databases: ${target}, ${source}`);
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${target}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${source}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );

    if (rootPassword) {
      const safeUser = user.replace(/[^a-zA-Z0-9_]/g, '');
      await conn.query(
        `GRANT ALL PRIVILEGES ON \`${target}\`.* TO '${safeUser}'@'%'`,
      );
      await conn.query(
        `GRANT ALL PRIVILEGES ON \`${source}\`.* TO '${safeUser}'@'%'`,
      );
      await conn.query('FLUSH PRIVILEGES');
    }

    let count = await tableCount(conn, source);

    if (count === 0 && dumpPath) {
      await loadDump(conn, source, dumpPath);
      count = await tableCount(conn, source);
    }

    if (count === 0) {
      throw new Error(
        [
          `Database \`${source}\` has no tables.`,
          `Set LEGACY_DUMP_PATH in .env to a .sql dump readable inside the api container, e.g.:`,
          `  LEGACY_DUMP_PATH=/dumps/didnegar_new.sql`,
          `Then re-run: npm run db:setup:prod`,
        ].join('\n'),
      );
    }

    console.log(`==> ${source} ready (${count} tables)`);
  } finally {
    await conn.end();
  }
}

async function main() {
  await ensureDatabasesAndDump();
  console.log('==> migrations');
  await run('npm', ['run', 'migration:run:prod']);
  console.log('==> legacy import (all)');
  await run('npm', ['run', 'db:import:legacy:prod', '--', 'all']);
  console.log('==> seed super-admin');
  await run('npm', ['run', 'db:seed:super-admin:prod']);
  console.log('==> db setup complete');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
