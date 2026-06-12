#!/usr/bin/env node
/**
 * Downloads optional CC0 GLB models for the 3D driving journey into
 * client/public/models/journey/. The game works without them (procedural
 * fallback), so this is purely a visual upgrade.
 *
 * Usage: node scripts/fetch-journey-assets.mjs
 *
 * If your network intercepts TLS (corporate proxy) and the download fails,
 * download the files manually and drop them into client/public/models/journey/
 * using the target filenames below. See that folder's CREDITS.md for sources.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'client', 'public', 'models', 'journey');

// Edit these URLs to point at the exact CC0/MIT GLBs you want to vendor.
// Left blank by default so the script is explicit rather than guessing at
// asset URLs that may move. Fill in and re-run.
const ASSETS = [
  { name: 'car.glb', url: process.env.CAR_GLB_URL || '' },
  { name: 'tree.glb', url: process.env.TREE_GLB_URL || '' },
  { name: 'house-garage.glb', url: process.env.HOUSE_GLB_URL || '' },
];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  let configured = 0;
  for (const a of ASSETS) {
    const dest = join(OUT_DIR, a.name);
    if (await exists(dest)) {
      console.log(`✓ ${a.name} already present — skipping`);
      continue;
    }
    if (!a.url) {
      console.log(`• ${a.name}: no URL configured (set the env var or edit ASSETS). Procedural fallback will be used.`);
      continue;
    }
    configured++;
    try {
      const bytes = await download(a.url, dest);
      console.log(`✓ ${a.name} downloaded (${(bytes / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.warn(`✗ ${a.name} failed: ${err.message}. Drop the file manually into ${OUT_DIR}.`);
    }
  }
  if (configured === 0) {
    console.log('\nNo asset URLs were configured. The driving journey will run with procedural shapes.');
    console.log('To add models, set CAR_GLB_URL / TREE_GLB_URL / HOUSE_GLB_URL or edit ASSETS in this script.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
