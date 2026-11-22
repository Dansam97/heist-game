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

// Loosen permissions on one output entry and everything under it, so a
// previous run's read-only leftovers can be removed. Best effort only: an
// entry this process does not own may refuse chmod, and that must not
// abort the clean-up before the removal itself has been tried — deleting
// an entry needs write access to its parent directory, not ownership.
function loosenForRemoval(path, isDirectory) {
  if (isDirectory) {
    for (const child of readdirSync(path, { withFileTypes: true })) {
      loosenForRemoval(join(path, child.name), child.isDirectory());
    }
  }
  try {
    chmodSync(path, isDirectory ? 0o755 : 0o644);
  } catch {
    // Not ours to chmod; the rmSync below may still succeed.
  }
}

// Empty the output directory while leaving the directory itself in place.
// The grader mounts /output as a root-owned directory and runs this
// program as an unprivileged user, so removing the directory — as the old
// version did before recreating it — fails there with EPERM. Only the
// entries inside are removed, one at a time; an already empty directory
// (the grader starts with one) is simply left as it is.
function emptyOutputDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  if (!statSync(dir).isDirectory()) {
    throw new Error(`${dir} exists and is not a directory`);
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    loosenForRemoval(path, entry.isDirectory());
    rmSync(path, { recursive: true, force: true });
  }
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
