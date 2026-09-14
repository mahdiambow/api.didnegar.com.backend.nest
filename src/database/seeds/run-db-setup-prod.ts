/**
 * Production DB setup (runs inside api container):
 * 1) ensure Nest + legacy databases exist
 * 2) run migrations
 * 3) import from SOURCE_DATABASE (default didnegar_new)
 * 4) seed super-admin
 *
 * Host one-shot (recommended if legacy dump file must be loaded first):
 *   LEGACY_DUMP_PATH=/path/to/dump.sql sudo bash scripts/db-setup-prod.sh
 */
import 'dotenv/config';
import { spawn } from 'node:child_process';
import mysql from 'mysql2/promise';
import { assertAppMysqlTarget } from '../../config/assert-app-mysql.js';

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

async function ensureDatabases() {
  const host = env('DB_HOST', 'localhost');
  const port = Number(env('DB_PORT', '3306'));
  const user = env('DB_USERNAME', 'didnegar');
  const password = env('DB_PASSWORD', 'didnegar');
  const target = env('DB_DATABASE', 'didnegar');
  const source = env('SOURCE_DATABASE', 'didnegar_new');
  assertAppMysqlTarget(host, port, target);
  if (target.trim().toLowerCase() === source.trim().toLowerCase()) {
    throw new Error(
      `DB_DATABASE and SOURCE_DATABASE must differ (both are "${target}").`,
    );
  }
  const rootPassword = process.env.MYSQL_ROOT_PASSWORD;

  // Prefer app user; fall back to root if available (compose usually has MYSQL_ROOT_PASSWORD)
  const conn = await mysql.createConnection({
    host,
    port,
    user: rootPassword ? 'root' : user,
    password: rootPassword || password,
    multipleStatements: true,
  });

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

    const [rows] = await conn.query(
      `SELECT COUNT(*) AS cnt
       FROM information_schema.tables
       WHERE table_schema = ?`,
      [source],
    );
    const tableCount = Number(
      (rows as Array<{ cnt: number | string }>)[0]?.cnt ?? 0,
    );

    if (tableCount === 0) {
      const dumpHint =
        process.env.LEGACY_DUMP_PATH ||
        '/var/www/dumps/didnegar_new.sql';
      throw new Error(
        [
          `Database \`${source}\` exists but has no tables.`,
          `Load the legacy dump first, then re-run setup.`,
          ``,
          `From host:`,
          `  LEGACY_DUMP_PATH=${dumpHint} sudo bash scripts/db-setup-prod.sh`,
          ``,
          `Or manually:`,
          `  sudo docker compose exec -T mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" ${source} < ${dumpHint}`,
          `  sudo docker compose exec api npm run db:setup:prod`,
        ].join('\n'),
      );
    }

    console.log(`==> ${source} ready (${tableCount} tables)`);
  } finally {
    await conn.end();
  }
}

async function main() {
  await ensureDatabases();
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
