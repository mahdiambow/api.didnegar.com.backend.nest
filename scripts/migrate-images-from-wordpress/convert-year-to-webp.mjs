// Standalone utility for the WordPress file server.
//
// Install and run it there, not inside the Nest container:
//   mkdir -p /home/didnegar/image-optimizer
//   cd /home/didnegar/image-optimizer
//   npm init -y && npm install sharp
//   cp convert-year-to-webp.mjs /home/didnegar/image-optimizer/
//   node convert-year-to-webp.mjs 2017

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const year = process.argv[2];

if (!/^\d{4}$/.test(year ?? '')) {
  throw new Error('Usage: node convert-year-to-webp.mjs YEAR');
}

const sourceRoot = `/home/didnegar/public_html/wp-content/uploads/${year}`;
const destinationRoot = `/home/didnegar/optimized/${year}`;
const failureLogPath = path.join(destinationRoot, 'failed-conversions.jsonl');
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png']);
const concurrency = 4;

let completed = 0;
let skipped = 0;
let failed = 0;

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function logFailure(payload) {
  await fs.appendFile(failureLogPath, `${JSON.stringify(payload)}\n`);
}

async function convert(sourceFile) {
  const relativePath = path.relative(sourceRoot, sourceFile);
  const outputFile = path.join(
    destinationRoot,
    relativePath.replace(/\.(jpe?g|png)$/i, '.webp'),
  );

  try {
    const existing = await fs.stat(outputFile).catch(() => null);

    // The script is resumable: completed files are left unchanged.
    if (existing?.size > 0) {
      skipped += 1;
      return;
    }

    await fs.mkdir(path.dirname(outputFile), { recursive: true });

    await sharp(sourceFile, { failOn: 'none' })
      .rotate()
      .webp({
        quality: 82,
        alphaQuality: 90,
        effort: 4,
        smartSubsample: true,
      })
      .toFile(outputFile);

    completed += 1;
  } catch (error) {
    failed += 1;

    await logFailure({
      type: 'conversion-failed',
      at: new Date().toISOString(),
      sourceFile,
      relativePath,
      outputFile,
      error: error.message,
    });

    console.error(`Failed: ${sourceFile}`, error.message);
  }

  const processed = completed + skipped + failed;
  if (processed > 0 && processed % 100 === 0) {
    console.log({ year, completed, skipped, failed, processed });
  }
}

async function main() {
  const source = await fs.stat(sourceRoot).catch(() => null);
  if (!source?.isDirectory()) {
    throw new Error(`Source directory does not exist: ${sourceRoot}`);
  }

  await fs.mkdir(destinationRoot, { recursive: true });
  await logFailure({
    type: 'run-started',
    year,
    at: new Date().toISOString(),
  });

  const sourceFiles = (await walk(sourceRoot)).filter((file) =>
    supportedExtensions.has(path.extname(file).toLowerCase()),
  );

  console.log(`Found ${sourceFiles.length} JPG/JPEG/PNG files for ${year}.`);

  for (let index = 0; index < sourceFiles.length; index += concurrency) {
    await Promise.all(sourceFiles.slice(index, index + concurrency).map(convert));
  }

  const summary = {
    type: 'run-complete',
    complete: true,
    year,
    found: sourceFiles.length,
    completed,
    skipped,
    failed,
    destinationRoot,
    failureLogPath,
  };

  await logFailure(summary);
  console.log(summary);
}

await main();
