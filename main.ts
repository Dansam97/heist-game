// Velvet Vault — the hand-in program (Node 22, standard library only).
// It assembles the entry in the output directory: the playable game, the
// screenshots, and the dossier the judge reads, written with the vendored
// make.fun library. Running it twice writes the same bytes twice.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The grader runs this in a container where the repository is read-only
// and /output starts empty; locally, /output may already hold a previous
// run whose files inherited the repository's read-only modes. Copying over
// a read-only file fails, so an existing output tree is first made
// writable and then removed wholesale — the directory itself is never
// deleted, only emptied, so a mounted /output keeps working.

import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, passed through so this program refuses exactly
// where the scorer would: at most 4 screenshots of 256 KiB, at most 993
// game entries of 48 MiB, and a 160 KiB dossier text.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function makeTreeWritable(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      makeTreeWritable(path);
      chmodSync(path, 0o755);
    } else {
      chmodSync(path, 0o644);
    }
  }
}

function emptyOutputDir(dir) {
  if (!existsSync(dir)) return;
  if (!statSync(dir).isDirectory()) {
    throw new Error(`${dir} exists and is not a directory`);
  }
  makeTreeWritable(dir);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

function requireDir(path, what) {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`missing ${what}: ${path}`);
  }
}

emptyOutputDir(OUTPUT_DIR);

const gameDir = join(REPO_ROOT, 'game');
const shotsDir = join(REPO_ROOT, 'screenshots');
requireDir(gameDir, 'game/');
requireDir(shotsDir, 'screenshots/');

cpSync(gameDir, join(OUTPUT_DIR, 'game'), { recursive: true });
cpSync(shotsDir, join(OUTPUT_DIR, 'screenshots'), { recursive: true });

writeFileSync(
  join(OUTPUT_DIR, 'dossier.json'),
  buildDossier(OUTPUT_DIR, DOSSIER_CAPS),
);
