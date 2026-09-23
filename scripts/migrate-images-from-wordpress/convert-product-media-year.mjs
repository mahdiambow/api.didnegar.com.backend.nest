/**
 * Remote worker. This file is copied to WORDPRESS_OPTIMIZER_DIR by the
 * controller and runs on the WordPress file server, where sharp is installed.
 * It intentionally receives a manifest of product-linked paths rather than
 * walking the complete WordPress uploads directory.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? null : process.argv[index + 1] ?? null;
}

const manifestPath = argument('--manifest');
const sourceRoot = argument('--source-root');
const destinationRoot = argument('--destination-root');

if (!manifestPath || !sourceRoot || !destinationRoot) {
  throw new Error(
    'Usage: node convert-product-media-year.mjs --manifest FILE --source-root DIR --destination-root DIR',
  );
}

const reportPath = path.join(destinationRoot, 'product-media-optimization-report.jsonl');
const summaryPath = path.join(destinationRoot, 'product-media-optimization-summary.json');
const successListPath = path.join(destinationRoot, 'product-media-successful-outputs.list0');
const statePath = path.join(destinationRoot, 'product-media-conversion-state.json');
const convertibleExtensions = new Set(['.jpg', '.jpeg', '.png']);
const concurrency = Math.max(1, Number(process.env.WORDPRESS_WEBP_CONCURRENCY || 4));

function safeRelativePath(value) {
  if (typeof value !== 'string' || !value || path.posix.isAbsolute(value)) return null;
  const normalized = path.posix.normalize(value.replaceAll('\\\\', '/'));
  return normalized === '..' || normalized.startsWith('../') ? null : normalized;
}

function outputRelativePath(sourceRelativePath) {
  return convertibleExtensions.has(path.extname(sourceRelativePath).toLowerCase())
    ? sourceRelativePath.replace(/\.(jpe?g|png)$/i, '.webp')
    : sourceRelativePath;
}

async function loadJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function main() {
  const manifest = await loadJson(manifestPath, null);
  if (!manifest || !Array.isArray(manifest.files) || !/^\d{4}$/.test(String(manifest.year))) {
    throw new Error(`Invalid manifest: ${manifestPath}`);
  }

  await fs.mkdir(destinationRoot, { recursive: true });
  const state = await loadJson(statePath, {});
  const totals = {
    selected: manifest.files.length,
    converted: 0,
    copied: 0,
    unchanged: 0,
    missing: 0,
    invalid: 0,
    collisions: 0,
  };
  const successfulOutputs = [];
  const outputOwners = new Map();
  const report = [];

  const files = manifest.files
    .map((item) => ({ ...item, relativePath: safeRelativePath(item.relativePath) }))
    .filter((item) => item.relativePath);

  for (const item of files) {
    const output = outputRelativePath(item.relativePath);
    const owner = outputOwners.get(output);
    if (owner && owner !== item.relativePath) {
      totals.collisions += 1;
      report.push({
        type: 'output-collision',
        sourceRelativePath: item.relativePath,
        conflictingSourceRelativePath: owner,
        outputRelativePath: output,
      });
    } else {
      outputOwners.set(output, item.relativePath);
    }
  }

  async function processFile(item) {
    const relativePath = item.relativePath;
    const outputRelative = outputRelativePath(relativePath);
    if (outputOwners.get(outputRelative) !== relativePath) return;

    const sourceFile = path.join(sourceRoot, relativePath);
    const outputFile = path.join(destinationRoot, outputRelative);
    try {
      const sourceStat = await fs.stat(sourceFile);
      if (!sourceStat.isFile()) throw new Error('Source is not a regular file');

      const fingerprint = `${sourceStat.size}:${sourceStat.mtimeMs}`;
      const previous = state[relativePath];
      const existing = await fs.stat(outputFile).catch(() => null);
      if (existing?.size > 0 && previous?.fingerprint === fingerprint) {
        totals.unchanged += 1;
        successfulOutputs.push(outputRelative);
        return;
      }

      await fs.mkdir(path.dirname(outputFile), { recursive: true });
      const temporary = `${outputFile}.partial-${process.pid}`;
      await fs.rm(temporary, { force: true });

      if (convertibleExtensions.has(path.extname(relativePath).toLowerCase())) {
        await sharp(sourceFile, { failOn: 'none' })
          .rotate()
          .webp({ quality: 82, alphaQuality: 90, effort: 4, smartSubsample: true })
          .toFile(temporary);
        totals.converted += 1;
      } else {
        await fs.copyFile(sourceFile, temporary);
        totals.copied += 1;
      }

      await fs.rename(temporary, outputFile);
      state[relativePath] = { fingerprint, outputRelative, updatedAt: new Date().toISOString() };
      successfulOutputs.push(outputRelative);
    } catch (error) {
      if (error.code === 'ENOENT') totals.missing += 1;
      else totals.invalid += 1;
      report.push({
        type: error.code === 'ENOENT' ? 'missing-source-file' : 'conversion-failed',
        sourceRelativePath: relativePath,
        outputRelativePath: outputRelative,
        error: error.message,
      });
    }
  }

  for (let index = 0; index < files.length; index += concurrency) {
    await Promise.all(files.slice(index, index + concurrency).map(processFile));
  }

  const uniqueOutputs = [...new Set(successfulOutputs)].sort();
  await fs.writeFile(successListPath, Buffer.from(`${uniqueOutputs.join('\0')}\0`));
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`);
  await fs.writeFile(
    reportPath,
    `${report.map((item) => JSON.stringify({ at: new Date().toISOString(), ...item })).join('\n')}\n`,
  );
  const summary = {
    type: 'run-complete',
    complete: true,
    year: manifest.year,
    ...totals,
    successfulOutputs: uniqueOutputs.length,
    reportPath,
    successListPath,
  };
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary)}\n`);
}

await main();
