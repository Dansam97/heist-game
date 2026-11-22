// Deterministic screenshot states for Velvet Vault.
// ?shot=start shows the title over the lobby, ?shot=play freezes a
// mid-heist moment (thief grabbing the case, a guard spotting him), and
// ?shot=end shows the score screen over the vault. Every state is built
// from the same seed, so the same URL renders the same frame every time.

import { buildLevel } from './levels.js';
import { createGuard, updateGuard } from './guards.js';
import { createCamera, updateCamera } from './cameras.js';
import { SMOKE_START } from './config.js';

function solidsOf(level) {
  return [...level.walls, ...level.cover];
}

function blockersOf(level) {
  return [...level.walls, ...level.cover];
}

// Walk the patrols forward with the thief standing at the spawn, so the
// guards and cameras land mid-route instead of at their start points.
function simulatePatrol(game, seconds) {
  const solids = solidsOf(game.level);
  const blockers = blockersOf(game.level);
  const dummy = { x: game.level.spawn.x, y: game.level.spawn.y };
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) {
    const dt = 1 / 60;
    for (const guard of game.guards) {
      updateGuard(guard, dt, dummy, blockers, solids, false);
    }
    for (const cam of game.cameras) updateCamera(cam, game.time + dt);
    game.time += dt;
  }
}

function setupFloor(game, index) {
  const level = buildLevel(index);
  game.levelIndex = index;
  game.level = level;
  game.player.x = level.spawn.x;
  game.player.y = level.spawn.y;
  game.player.facing = -Math.PI / 2;
  game.player.sneaking = false;
  game.guards = level.guards.map((def, i) => createGuard(def, i));
  game.cameras = level.cameras.map((def, i) => createCamera(def, i * 1.7));
  game.loot = level.loot.map((item) => ({ ...item, taken: false }));
  game.alarm = 0;
  game.smokeLeft = SMOKE_START;
  game.smokeClouds = [];
  game.grabProgress = 0;
  game.grabTarget = null;
  game.requiredTaken = false;
  game.seenNow = false;
  game.wasSeen = false;
  game.time = 0;
}

function shotStart(game) {
  setupFloor(game, 0);
  simulatePatrol(game, 6);
  game.player.x = 640;
  game.player.y = 640;
  game.player.facing = -Math.PI / 2;
  game.state = 'title';
}

function shotPlay(game) {
  setupFloor(game, 0);
  simulatePatrol(game, 8);
  // The thief is mid-grab on the Sapphire Case while the first guard
  // turns his cone onto him: alarm climbing, loot half-pocketed.
  const sapphire = game.loot.find((item) => item.required);
  const silver = game.loot.find((item) => !item.required);
  if (silver) {
    silver.taken = true;
    game.lootValue = silver.value;
  }
  game.player.x = 1040;
  game.player.y = 210;
  game.player.facing = Math.atan2(
    sapphire.y - game.player.y,
    sapphire.x - game.player.x,
  );
  game.grabTarget = sapphire;
  game.grabProgress = 0.55;
  game.alarm = 38;
  game.timesSeen = 1;
  game.smokeLeft = 1;
  game.smokeUsed = 1;
  const guard = game.guards[0];
  guard.facing = Math.atan2(
    game.player.y - guard.y,
    game.player.x - guard.x,
  );
  guard.alerted = true;
  guard.seenNow = true;
  game.seenNow = true;
  game.state = 'playing';
}

function shotEnd(game) {
  setupFloor(game, 2);
  simulatePatrol(game, 5);
  for (const item of game.loot) item.taken = true;
  game.requiredTaken = true;
  game.lootValue = 68000;
  game.time = 402;
  game.alarm = 12;
  game.timesSeen = 1;
  game.smokeLeft = 0;
  game.smokeUsed = 2;
  game.objective = 'Heist complete';
  game.player.x = 75;
  game.player.y = 698;
  game.player.facing = Math.PI;
  game.score = {
    loot: 68000,
    timeText: '6:42',
    seen: 1,
    smokeUsed: 2,
    rank: 'SHADOW — barely a whisper',
  };
  game.state = 'score';
}

// Apply a ?shot= state to a fresh game. Returns true when a shot applied
// (the frame is then frozen), false when the URL names no shot.
export function applyShot(game, shot, seed) {
  if (shot === 'start') {
    shotStart(game, seed);
    return true;
  }
  if (shot === 'play') {
    shotPlay(game, seed);
    return true;
  }
  if (shot === 'end') {
    shotEnd(game, seed);
    return true;
  }
  return false;
}
