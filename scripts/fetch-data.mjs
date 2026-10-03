#!/usr/bin/env node
/**
 * Downloads the Nookipedia data this site uses into public/data/*.json.
 * The site reads those files instead of calling the API from the browser.
 *
 *   npm run fetch-data
 *
 * API key: NOOKIPEDIA_API_KEY (or NEXT_PUBLIC_NOOKIPEDIA_API_KEY), from the
 * environment or from .env.local.
 *
 * Safe to re-run: a dataset that fails to download, or comes back much smaller
 * than the file we already have, keeps its previous file. The exit code is 1
 * when any dataset could not be refreshed.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'data');

const API_URL = 'https://api.nookipedia.com';
// Pin the response format. Without this header the API answers in its newest
// shape, which the UI does not read.
const API_VERSION = '1.0.0';
const TIMEOUT_MS = 60_000;
const ATTEMPTS = 3;
const CONCURRENCY = 4;
// A download far smaller than the existing file is treated as a failed response.
const MIN_SIZE_RATIO = 0.8;

const DATASETS = [
  ['villagers', '/villagers?nhdetails=true'],
  ['furniture', '/nh/furniture'],
  ['clothing', '/nh/clothing'],
  ['interior', '/nh/interior'],
  ['recipes', '/nh/recipes'],
  ['items', '/nh/items'],
  ['tools', '/nh/tools'],
  ['photos', '/nh/photos'],
  ['fish', '/nh/fish'],
  ['bugs', '/nh/bugs'],
  ['sea', '/nh/sea'],
  ['art', '/nh/art'],
  ['gyroids', '/nh/gyroids'],
  ['fossils-individuals', '/nh/fossils/individuals'],
  ['fossils-groups', '/nh/fossils/groups'],
  ['events', '/nh/events'],
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readApiKey() {
  const fromEnv = process.env.NOOKIPEDIA_API_KEY || process.env.NEXT_PUBLIC_NOOKIPEDIA_API_KEY;
  if (fromEnv?.trim()) return fromEnv.trim();
  try {
    const text = (await readFile(path.join(ROOT, '.env.local'), 'utf8')).replace(/^\uFEFF/, '');
    const match = text.match(/^\s*(?:NEXT_PUBLIC_)?NOOKIPEDIA_API_KEY\s*=\s*(.+?)\s*$/m);
    if (match) return match[1].replace(/^["']|["']$/g, '');
  } catch {
    // no .env.local
  }
  return null;
}

async function download(endpoint, apiKey) {
  let lastError;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(API_URL + endpoint, {
        headers: { 'X-API-KEY': apiKey, 'Accept-Version': API_VERSION },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) throw new Error('empty or non-array response');
      return data;
    } catch (error) {
      lastError = error;
      if (/HTTP 40[13]/.test(error.message)) break; // bad key: retrying will not help
      if (attempt < ATTEMPTS) await sleep(2000 * attempt);
    }
  }
  throw lastError;
}

function countRecords(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

async function refresh([name, endpoint], apiKey) {
  const file = path.join(OUT_DIR, `${name}.json`);
  const previous = await readFile(file, 'utf8').catch(() => null);

  const data = await download(endpoint, apiKey);
  const previousCount = previous ? countRecords(previous) : 0;
  if (previousCount && data.length < previousCount * MIN_SIZE_RATIO) {
    throw new Error(`only ${data.length} records, the current file has ${previousCount}`);
  }

  const text = JSON.stringify(data);
  if (text === previous) return { status: 'unchanged', count: data.length };

  const tmp = `${file}.tmp`;
  await writeFile(tmp, text);
  await rename(tmp, file);
  return { status: previous ? 'updated' : 'new', count: data.length };
}

async function main() {
  const apiKey = await readApiKey();
  if (!apiKey) {
    console.error('No API key. Set NOOKIPEDIA_API_KEY in the environment or in .env.local.');
    process.exit(1);
  }
  await mkdir(OUT_DIR, { recursive: true });

  let next = 0;
  let failed = 0;
  async function worker() {
    while (next < DATASETS.length) {
      const dataset = DATASETS[next++];
      try {
        const { status, count } = await refresh(dataset, apiKey);
        console.log(`${status.padEnd(9)} ${dataset[0].padEnd(20)} ${count} records`);
      } catch (error) {
        failed++;
        console.error(`FAILED    ${dataset[0].padEnd(20)} ${error.message} (kept the previous file)`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (failed) {
    console.error(`${failed} of ${DATASETS.length} datasets could not be refreshed.`);
    process.exit(1);
  }
  console.log(`Done: ${DATASETS.length} datasets in public/data`);
}

main();
