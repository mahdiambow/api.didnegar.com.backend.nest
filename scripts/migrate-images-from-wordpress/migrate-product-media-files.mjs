/**
 * Controller: run on the Nest/application server.
 *
 * It selects only media related to products in the Nest database, asks the
 * WordPress server to optimize those files, streams successful outputs to the
 * file server, and invokes the file server's local SeaweedFS S3 client.
 */
import 'dotenv/config';
import { Client } from 'ssh2';
import mysql from 'mysql2/promise';
import { appendFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import dotenv from 'dotenv';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.join(currentDirectory, 'convert-product-media-year.mjs');
// The API container runs as an unprivileged user and /app is read-only there.
const reportPath = '/tmp/migration-product-media-files-report.jsonl';

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function numberEnv(name, fallback) {
  const value = process.env[name];
  return value ? Number(value) : fallback;
}

function shell(value) {
  return `'${String(value).replaceAll("'", "'\"'\"'")}'`;
}

function sshConfig(prefix) {
  return {
    host: requiredEnv(`${prefix}_SSH_HOST`),
    port: numberEnv(`${prefix}_SSH_PORT`, 22),
    username: requiredEnv(`${prefix}_SSH_USERNAME`),
    password: requiredEnv(`${prefix}_SSH_PASSWORD`),
    readyTimeout: 30_000,
  };
}

function wordpressConfig() {
  return {
    ...sshConfig('WORDPRESS'),
    uploadsRoot: requiredEnv('WORDPRESS_UPLOADS_ROOT'),
    optimizedRoot: requiredEnv('WORDPRESS_OPTIMIZED_ROOT'),
    optimizerDir: requiredEnv('WORDPRESS_OPTIMIZER_DIR'),
  };
}

function fileServerConfig() {
  return {
    ...sshConfig('FILE_SERVER'),
    stagingRoot: requiredEnv('FILE_SERVER_STAGING_ROOT'),
    endpoint: requiredEnv('SEAWEED_S3_ENDPOINT'),
    bucket: requiredEnv('SEAWEED_S3_BUCKET'),
    prefix: requiredEnv('SEAWEED_S3_PREFIX').replace(/^\/+|\/+$/g, ''),
  };
}

function parseArgs() {
  const yearIndex = process.argv.indexOf('--year');
  const year = yearIndex < 0 ? null : process.argv[yearIndex + 1];
  if (year && !/^\d{4}$/.test(year)) throw new Error('--year must be YYYY');
  return { year, all: process.argv.includes('--all') };
}

function relativeUploadPath(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  let pathname = url.trim().split(/[?#]/, 1)[0];
  try {
    pathname = new URL(url).pathname;
  } catch {
    // Relative legacy URLs are supported.
  }
  const marker = '/wp-content/uploads/';
  const markerIndex = pathname.indexOf(marker);
  if (markerIndex < 0) return null;
  try {
    const relative = decodeURIComponent(pathname.slice(markerIndex + marker.length));
    const normalized = path.posix.normalize(relative.replaceAll('\\', '/'));
    if (!normalized || normalized === '..' || normalized.startsWith('../') || path.posix.isAbsolute(normalized)) return null;
    return normalized;
  } catch {
    return null;
  }
}

function outputRelativePath(relativePath) {
  return /\.(jpe?g|png)$/i.test(relativePath)
    ? relativePath.replace(/\.(jpe?g|png)$/i, '.webp')
    : relativePath;
}

function connect(config) {
  return new Promise((resolve, reject) => {
    const client = new Client();
    const timeout = setTimeout(() => {
      client.end();
      reject(new Error(`SSH connection timed out after ${config.readyTimeout}ms: ${config.username}@${config.host}:${config.port}`));
    }, config.readyTimeout);
    const finish = (callback) => (value) => {
      clearTimeout(timeout);
      callback(value);
    };
    client.once('ready', finish(() => resolve(client)));
    client.once('error', finish(reject));
    client.connect(config);
  });
}

function close(client) {
  if (client) client.end();
}

function exec(client, command, { stdin, onStdout, onStderr } = {}) {
  return new Promise((resolve, reject) => {
    client.exec(command, (error, stream) => {
      if (error) return reject(error);
      let stdout = '';
      let stderr = '';
      stream.on('data', (chunk) => {
        stdout += chunk;
        onStdout?.(chunk.toString('utf8'));
      });
      stream.stderr.on('data', (chunk) => {
        stderr += chunk;
        onStderr?.(chunk.toString('utf8'));
      });
      stream.once('close', (code) => {
        if (code === 0) resolve({ stdout, stderr });
        else reject(new Error(`Remote command failed (${code}): ${stderr || command}`));
      });
      if (stdin) stdin.pipe(stream);
      else stream.end();
    });
  });
}

function openSftp(client) {
  return new Promise((resolve, reject) => client.sftp((error, sftp) => (error ? reject(error) : resolve(sftp))));
}

function sftpFastPut(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => sftp.fastPut(localPath, remotePath, (error) => (error ? reject(error) : resolve())));
}

function sftpRead(sftp, remotePath) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = sftp.createReadStream(remotePath);
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.once('error', reject);
    stream.once('end', () => resolve(Buffer.concat(chunks)));
  });
}

function execChannel(client, command) {
  return new Promise((resolve, reject) => {
    client.exec(command, (error, stream) => (error ? reject(error) : resolve(stream)));
  });
}

function waitForChannel(channel, label) {
  return new Promise((resolve, reject) => {
    let stderr = '';
    channel.stderr.on('data', (chunk) => { stderr += chunk; });
    channel.once('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed (${code}): ${stderr}`));
    });
    channel.once('error', reject);
  });
}

async function report(event) {
  const entry = { at: new Date().toISOString(), ...event };
  await appendFile(reportPath, `${JSON.stringify(entry)}\n`);
  console.log(JSON.stringify(entry));
}

async function loadProductMedia(target, requestedYear) {
  const [rows] = await target.execute(
    `SELECT DISTINCT m.id AS mediaId, m.url
     FROM product_media pm
     INNER JOIN media m ON m.id = pm.mediaId
     WHERE m.url IS NOT NULL AND m.url <> ''`,
  );
  const grouped = new Map();
  const rejected = [];
  for (const row of rows) {
    const relativePath = relativeUploadPath(row.url);
    if (!relativePath) {
      rejected.push({ mediaId: row.mediaId, url: row.url, reason: 'unparseable-wordpress-upload-url' });
      continue;
    }
    const year = relativePath.split('/', 1)[0];
    if (!/^\d{4}$/.test(year) || (requestedYear && year !== requestedYear)) continue;
    const yearRelativePath = relativePath.slice(year.length + 1);
    if (!yearRelativePath) {
      rejected.push({ mediaId: row.mediaId, url: row.url, reason: 'missing-path-below-upload-year' });
      continue;
    }
    if (!grouped.has(year)) grouped.set(year, new Map());
    const byPath = grouped.get(year);
    // The remote source/destination roots already end with this year. Keeping
    // only the portion below it prevents paths such as 2017/2017/05/image.jpg.
    const entry = byPath.get(yearRelativePath) || { relativePath: yearRelativePath, mediaIds: [] };
    entry.mediaIds.push(row.mediaId);
    byPath.set(yearRelativePath, entry);
  }
  return { grouped, rejected, selectedRows: rows.length };
}

async function processYear({ year, files, wordpress, workspace }) {
  const manifest = { year, files };
  const manifestPath = path.join(workspace, `product-media-${year}.json`);
  await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`, 'utf8');

  let wordpressClient;
  let fileServerClient;
  try {
    await report({ type: 'year-started', year, selectedFiles: files.length });
    await report({ type: 'wordpress-connection-started', year, host: wordpress.host, port: wordpress.port, username: wordpress.username });
    wordpressClient = await connect(wordpress);
    await report({ type: 'wordpress-connected', year });
    const wordpressSftp = await openSftp(wordpressClient);
    const remoteManifest = `${wordpress.optimizerDir}/product-media-${year}.json`;
    const remoteWorker = `${wordpress.optimizerDir}/convert-product-media-year.mjs`;
    const remoteDestination = `${wordpress.optimizedRoot}/${year}`;
    await report({ type: 'wordpress-directories-preparing', year, remoteDestination });
    await exec(wordpressClient, `mkdir -p ${shell(wordpress.optimizerDir)} ${shell(remoteDestination)}`);
    await report({ type: 'wordpress-worker-upload-started', year, remoteWorker });
    await sftpFastPut(wordpressSftp, workerPath, remoteWorker);
    await report({ type: 'wordpress-manifest-upload-started', year, remoteManifest, selectedFiles: files.length });
    await sftpFastPut(wordpressSftp, manifestPath, remoteManifest);
    await report({ type: 'wordpress-conversion-started', year });
    await exec(
      wordpressClient,
      `node ${shell(remoteWorker)} --manifest ${shell(remoteManifest)} --source-root ${shell(`${wordpress.uploadsRoot}/${year}`)} --destination-root ${shell(remoteDestination)}`,
      {
        onStdout: (line) => process.stdout.write(`[wordpress:${year}] ${line}`),
        onStderr: (line) => process.stderr.write(`[wordpress:${year}:stderr] ${line}`),
      },
    );

    const summary = JSON.parse((await sftpRead(wordpressSftp, `${remoteDestination}/product-media-optimization-summary.json`)).toString('utf8'));
    await report({ type: 'wordpress-year-complete', year, ...summary });
    if (!summary.successfulOutputs) return summary;

    // Explicitly reload .env after conversion, before reading independent file-server credentials.
    dotenv.config({ override: true });
    const fileServer = fileServerConfig();
    await report({
      type: 'file-server-connection-started',
      year,
      host: fileServer.host,
      port: fileServer.port,
      username: fileServer.username,
    });
    fileServerClient = await connect(fileServer);
    await report({ type: 'file-server-connected', year });
    const remoteStage = `${fileServer.stagingRoot}/${year}`;
    await report({ type: 'file-server-staging-preparing', year, remoteStage });
    await exec(fileServerClient, `mkdir -p ${shell(remoteStage)}`);

    const tarSource = await execChannel(
      wordpressClient,
      `cd ${shell(remoteDestination)} && tar --null --verbatim-files-from -T product-media-successful-outputs.list0 -cf -`,
    );
    const tarDestination = await execChannel(
      fileServerClient,
      `tar -C ${shell(remoteStage)} -xf -`,
    );
    tarSource.stderr.on('data', (chunk) => process.stderr.write(`[wordpress:${year}:tar-stderr] ${chunk}`));
    tarDestination.stderr.on('data', (chunk) => process.stderr.write(`[file-server:${year}:tar-stderr] ${chunk}`));
    const sourceDone = waitForChannel(tarSource, `WordPress archive for ${year}`);
    const destinationDone = waitForChannel(tarDestination, `File-server extraction for ${year}`);
    await report({ type: 'file-transfer-started', year, successfulOutputs: summary.successfulOutputs });
    let transferredBytes = 0;
    let nextProgressBytes = 10 * 1024 * 1024;
    const heartbeat = setInterval(() => {
      console.log(JSON.stringify({
        type: 'file-transfer-heartbeat',
        year,
        transferredMiB: Math.floor(transferredBytes / 1024 / 1024),
      }));
    }, 15_000);
    tarSource.on('data', (chunk) => {
      transferredBytes += chunk.length;
      if (transferredBytes >= nextProgressBytes) {
        console.log(JSON.stringify({
          type: 'file-transfer-progress',
          year,
          transferredMiB: Math.floor(transferredBytes / 1024 / 1024),
        }));
        nextProgressBytes += 10 * 1024 * 1024;
      }
    });
    try {
      await pipeline(tarSource, tarDestination);
      await Promise.all([sourceDone, destinationDone]);
    } finally {
      clearInterval(heartbeat);
    }
    await report({
      type: 'file-transfer-complete',
      year,
      transferredMiB: Math.ceil(transferredBytes / 1024 / 1024),
    });

    const objectPrefix = `${fileServer.prefix}/${year}`;
    const s3Target = `s3://${fileServer.bucket}/${objectPrefix}`;
    await report({ type: 'seaweed-upload-started', year, s3Target });
    await exec(
      fileServerClient,
      `aws --endpoint-url ${shell(fileServer.endpoint)} s3 sync ${shell(remoteStage)} ${shell(s3Target)} --no-progress`,
      {
        onStdout: (line) => process.stdout.write(`[seaweed:${year}] ${line}`),
        onStderr: (line) => process.stderr.write(`[seaweed:${year}:stderr] ${line}`),
      },
    );
    const verification = await exec(
      fileServerClient,
      `aws --endpoint-url ${shell(fileServer.endpoint)} s3 sync ${shell(remoteStage)} ${shell(s3Target)} --dryrun --no-progress`,
    );
    if (/^(upload|delete):/m.test(verification.stdout)) {
      throw new Error(`SeaweedFS verification found unsynchronised objects for ${year}`);
    }
    await report({ type: 'seaweed-year-complete', year, s3Target, successfulOutputs: summary.successfulOutputs });
    return summary;
  } finally {
    close(fileServerClient);
    close(wordpressClient);
  }
}

async function main() {
  const { year, all } = parseArgs();
  if (!year && !all) throw new Error('Use --year YYYY or --all');
  const target = await mysql.createConnection({
    host: requiredEnv('DB_HOST'),
    port: numberEnv('DB_PORT', 3306),
    user: requiredEnv('DB_USERNAME'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_DATABASE'),
    charset: 'utf8mb4',
  });
  const workspace = await mkdtemp(path.join(tmpdir(), 'didnegar-product-media-'));
  try {
    await writeFile(reportPath, `${JSON.stringify({ type: 'run-started', at: new Date().toISOString() })}\n`);
    const [tables] = await target.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('media', 'product_media')`,
      [requiredEnv('DB_DATABASE')],
    );
    if (tables.length !== 2) throw new Error('Target database is missing media or product_media');
    const { grouped, rejected, selectedRows } = await loadProductMedia(target, year);
    console.log(JSON.stringify({
      type: 'product-media-selected',
      selectedRows,
      years: [...grouped.entries()].map(([selectedYear, files]) => ({ year: selectedYear, files: files.size })),
      skippedUrls: rejected.length,
    }));
    for (const item of rejected) await report({ type: 'skipped-media-url', ...item });
    const wordpress = wordpressConfig();
    const years = [...grouped.keys()].sort();
    const summaries = [];
    for (const targetYear of years) {
      summaries.push(await processYear({
        year: targetYear,
        files: [...grouped.get(targetYear).values()],
        wordpress,
        workspace,
      }));
    }
    const summary = { complete: true, selectedRows, years, skippedUrls: rejected.length, summaries, reportPath };
    await report({ type: 'run-complete', ...summary });
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await target.end();
    await rm(workspace, { recursive: true, force: true });
  }
}

await main();
