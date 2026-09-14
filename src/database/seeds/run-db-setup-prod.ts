/**
 * One-shot inside api container:
 *   sudo docker compose exec api node dist/database/seeds/run-db-setup-prod.js
 *
 * 1) ensure Nest + legacy DBs
 * 2) if SOURCE has no countries → load LEGACY_DUMP_PATH (rewrites `didnegar` → source)
 * 3) migrate
 * 4) import-legacy all
 * 5) seed-super-admin
 *
 * Requires:
 *   - dumps mounted at /dumps (see docker-compose)
 *   - MYSQL_ROOT_PASSWORD in api env
 *   - mysql client in image
 */
import 'dotenv/config';
import { createReadStream, existsSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import mysql from 'mysql2/promise';

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

function resolveDumpPath(source: string): string | null {
  const explicit = process.env.LEGACY_DUMP_PATH?.trim();
  if (explicit && existsSync(explicit)) return explicit;

  const candidates = [
    `/dumps/didnegar-20260913-151630.sql`,
    `/dumps/didnegar_new.sql`,
    `/dumps/${source}.sql`,
  ];
  for (const path of candidates) {
    if (existsSync(path)) return path;
  }

  if (existsSync('/dumps')) {
    const first = readdirSync('/dumps').find((name) => name.endsWith('.sql'));
    if (first) return `/dumps/${first}`;
  }
  return null;
}

async function rootConn() {
  const host = env('DB_HOST', 'localhost');
  const port = Number(env('DB_PORT', '3306'));
  const rootPassword = env('MYSQL_ROOT_PASSWORD');
  return mysql.createConnection({
    host,
    port,
    user: 'root',
    password: rootPassword,
    multipleStatements: true,
  });
}

async function tableCount(schema: string, table?: string) {
  const conn = await rootConn();
  try {
    const [rows] = await conn.query(
      table
        ? `SELECT COUNT(*) AS cnt FROM information_schema.tables
           WHERE table_schema = ? AND table_name = ?`
        : `SELECT COUNT(*) AS cnt FROM information_schema.tables
           WHERE table_schema = ?`,
      table ? [schema, table] : [schema],
    );
    return Number((rows as Array<{ cnt: number | string }>)[0]?.cnt ?? 0);
  } finally {
    await conn.end();
  }
}

async function ensureDatabases() {
  const user = env('DB_USERNAME', 'didnegar');
  const target = env('DB_DATABASE', 'didnegar');
  const source = env('SOURCE_DATABASE', 'didnegar_new');
  const conn = await rootConn();
  try {
    console.log(`==> ensure databases: ${target}, ${source}`);
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${target}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${source}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    const safeUser = user.replace(/[^a-zA-Z0-9_]/g, '');
    await conn.query(
      `GRANT ALL PRIVILEGES ON \`${target}\`.* TO '${safeUser}'@'%'`,
    );
    await conn.query(
      `GRANT ALL PRIVILEGES ON \`${source}\`.* TO '${safeUser}'@'%'`,
    );
    await conn.query('FLUSH PRIVILEGES');
  } finally {
    await conn.end();
  }
}

/** Dump files usually contain USE `didnegar` — force into SOURCE_DATABASE */
async function loadDumpIntoSource(dumpPath: string, source: string) {
  const host = env('DB_HOST', 'localhost');
  const port = env('DB_PORT', '3306');
  const rootPassword = env('MYSQL_ROOT_PASSWORD');

  console.log(`==> recreate ${source}`);
  const conn = await rootConn();
  try {
    await conn.query(`DROP DATABASE IF EXISTS \`${source}\``);
    await conn.query(
      `CREATE DATABASE \`${source}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    const user = env('DB_USERNAME', 'didnegar').replace(/[^a-zA-Z0-9_]/g, '');
    await conn.query(
      `GRANT ALL PRIVILEGES ON \`${source}\`.* TO '${user}'@'%'`,
    );
    await conn.query('FLUSH PRIVILEGES');
  } finally {
    await conn.end();
  }

  console.log(`==> loading dump ${dumpPath} → ${source} (rewrite didnegar → ${source})`);

  const rewrite = new Transform({
    transform(chunk, _enc, cb) {
      const text = chunk
        .toString('utf8')
        .replaceAll('`didnegar`', `\`${source}\``);
      cb(null, text);
    },
  });

  await new Promise<void>((resolve, reject) => {
    const mysqlCli = spawn(
      'mysql',
      [
        `-h${host}`,
        `-P${port}`,
        '-uroot',
        `-p${rootPassword}`,
        '--protocol=TCP',
        source,
      ],
      { stdio: ['pipe', 'inherit', 'inherit'] },
    );

    mysqlCli.on('error', reject);
    mysqlCli.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`mysql dump load exited with ${code}`));
    });

    pipeline(createReadStream(dumpPath), rewrite, mysqlCli.stdin!).catch(
      reject,
    );
  });

  const countries = await tableCount(source, 'countries');
  if (countries === 0) {
    throw new Error(
      `Dump loaded but \`${source}\`.countries is still missing. Check dump file.`,
    );
  }
  console.log(`==> dump OK (${source}.countries present)`);
}

async function main() {
  const source = env('SOURCE_DATABASE', 'didnegar_new');
  const force = process.env.FORCE_DUMP_RELOAD === '1';

  await ensureDatabases();

  const hasCountries = (await tableCount(source, 'countries')) > 0;
  if (!hasCountries || force) {
    const dumpPath = resolveDumpPath(source);
    if (!dumpPath) {
      throw new Error(
        [
          `\`${source}\` has no countries table and no dump found.`,
          `Mount dumps and set LEGACY_DUMP_PATH, e.g.:`,
          `  volumes: ./dumps:/dumps:ro`,
          `  LEGACY_DUMP_PATH=/dumps/didnegar-20260913-151630.sql`,
          `Then:`,
          `  sudo docker compose exec api node dist/database/seeds/run-db-setup-prod.js`,
        ].join('\n'),
      );
    }
    await loadDumpIntoSource(dumpPath, source);
  } else {
    console.log(`==> ${source} already has countries — skip dump load`);
  }

  console.log('==> migrations');
  await run('node', [
    './node_modules/typeorm/cli.js',
    'migration:run',
    '-d',
    'dist/database/data-source.js',
  ]);

  console.log('==> legacy import (all)');
  await run('node', ['dist/database/seeds/import-legacy-dump.js', 'all']);

  console.log('==> seed super-admin');
  await run('node', ['dist/database/seeds/seed-super-admin.js']);

  console.log('==> db setup complete');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
