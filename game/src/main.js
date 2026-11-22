// Velvet Vault — game loop and rules.
// Owns the state machine (title → playing → caught / level done → score),
// moves the thief, runs the alarm, the loot grab, the smoke pellets and
// the escape, and hands the whole state to render.js every frame.

import {
  ALARM_DECAY,
  ALARM_MAX,
  FLOOR_BOTTOM,
  FLOOR_TOP,
  GRAB_RANGE,
  GRAB_SECONDS,
  PALETTE,
  PLAYER_R,
  SMOKE_RADIUS,
  SMOKE_SECONDS,
  SMOKE_START,
  SNEAK_SPEED,
  VIEW_H,
  VIEW_W,
  WALK_SPEED,
} from './config.js';
import { buildLevel, levelCount } from './levels.js';
import { createGuard, guardAlarmRate, guardCanSee, updateGuard } from './guards.js';
import { cameraAlarmRate, cameraCanSee, createCamera, updateCamera } from './cameras.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { distance, moveCircle, pointInRect } from './geometry.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export function createGame() {
  const input = createInput(canvas);
  const audio = createAudio();
  const game = {
    state: 'title',
    levelIndex: 0,
    level: null,
    player: { x: 130, y: 700, facing: -Math.PI / 2, sneaking: false },
    guards: [],
    cameras: [],
    loot: [],
    alarm: 0,
    lootValue: 0,
    smokeLeft: SMOKE_START,
    smokeClouds: [],
    smokeUsed: 0,
    time: 0,
    timesSeen: 0,
    seenNow: false,
    wasSeen: false,
    grabProgress: 0,
    grabTarget: null,
    requiredTaken: false,
    objective: 'Grab the required loot',
    muted: false,
    score: null,
    stepAcc: 0,
    alarmBeep: 0,
  };
  game.input = input;
  game.audio = audio;
  return game;
}

function solidRects(level) {
  return [...level.walls, ...level.cover];
}

function sightBlockers(level) {
  return [...level.walls, ...level.cover];
}

function loadLevel(game, index, keepProgress) {
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
  game.objective = 'Grab the required loot';
  if (!keepProgress) {
    game.lootValue = 0;
    game.time = 0;
    game.timesSeen = 0;
    game.smokeUsed = 0;
    game.score = null;
  }
}

function cloudCovers(game, x, y) {
  for (const cloud of game.smokeClouds) {
    if (distance(cloud.x, cloud.y, x, y) <= SMOKE_RADIUS) return true;
  }
  return false;
}

function rankFor(seen) {
  if (seen === 0) return 'GHOST — never seen once';
  if (seen <= 2) return 'SHADOW — barely a whisper';
  if (seen <= 5) return 'PROFESSIONAL — clean enough';
  return 'LOUD AMATEUR — the crew is laughing';
}

function finishScore(game) {
  const mins = Math.floor(game.time / 60);
  const secs = Math.floor(game.time % 60);
  game.score = {
    loot: game.lootValue,
    timeText: `${mins}:${String(secs).padStart(2, '0')}`,
    seen: game.timesSeen,
    smokeUsed: game.smokeUsed,
    rank: rankFor(game.timesSeen),
  };
  game.state = 'score';
  game.audio.escaped();
  game.audio.stopHum();
}

function updatePlaying(game, dt) {
  const input = game.input;
  const level = game.level;
  const solids = solidRects(level);
  const blockers = sightBlockers(level);
  const player = game.player;

  game.time += dt;
  input.playerX = player.x;
  input.playerY = player.y;

  // --- Movement: keyboard first, click-to-move when no key is held.
  const sneaking = input.held('sneak');
  player.sneaking = sneaking;
  const speed = sneaking ? SNEAK_SPEED : WALK_SPEED;
  const vec = input.moveVector();
  if (vec.x !== 0 || vec.y !== 0) {
    player.facing = Math.atan2(vec.y, vec.x);
    const moved = moveCircle(player.x, player.y, PLAYER_R, vec.x * speed * dt, vec.y * speed * dt, solids);
    const actuallyMoved = distance(player.x, player.y, moved.x, moved.y);
    player.x = moved.x;
    player.y = moved.y;
    game.stepAcc += actuallyMoved;
    if (game.stepAcc > 46) {
      game.stepAcc = 0;
      game.audio.footstep(sneaking);
    }
  } else {
    input.clearMoveTarget();
  }

  // --- Smoke pellet.
  if (input.wasPressed('smoke') && game.smokeLeft > 0) {
    game.smokeClouds.push({ x: player.x, y: player.y, left: SMOKE_SECONDS });
    game.smokeLeft -= 1;
    game.smokeUsed += 1;
    game.audio.smoke();
  }
  for (const cloud of game.smokeClouds) cloud.left -= dt;
  game.smokeClouds = game.smokeClouds.filter((c) => c.left > 0);

  // --- Watchers: guards patrol and chase, cameras sweep.
  let anySeen = false;
  let rise = 0;
  for (const guard of game.guards) {
    const smoked = cloudCovers(game, guard.x, guard.y) || cloudCovers(game, player.x, player.y);
    updateGuard(guard, dt, player, blockers, solids, smoked);
    if (guard.seenNow) {
      anySeen = true;
      rise = Math.max(rise, guardAlarmRate(guard, player, sneaking));
    }
  }
  for (const cam of game.cameras) {
    updateCamera(cam, game.time);
    const smoked = cloudCovers(game, cam.x, cam.y) || cloudCovers(game, player.x, player.y);
    cam.seenNow = cameraCanSee(cam, player, blockers, smoked);
    if (cam.seenNow) {
      anySeen = true;
      rise = Math.max(rise, cameraAlarmRate(player, sneaking));
    }
  }
  game.seenNow = anySeen;
  if (anySeen && !game.wasSeen) {
    game.timesSeen += 1;
    game.audio.spotted();
  }
  game.wasSeen = anySeen;

  // --- Alarm: climbs while seen, drains while hidden.
  if (anySeen) {
    game.alarm = Math.min(ALARM_MAX, game.alarm + rise * dt);
    game.alarmBeep -= dt;
    if (game.alarm >= 70 && game.alarmBeep <= 0) {
      game.alarmBeep = 0.55;
      game.audio.alarmTick();
    }
  } else {
    game.alarm = Math.max(0, game.alarm - ALARM_DECAY * dt);
  }

  // --- Loot grab: hold E beside a case.
  let near = null;
  for (const item of game.loot) {
    if (!item.taken && distance(player.x, player.y, item.x, item.y) <= GRAB_RANGE) {
      near = item;
      break;
    }
  }
  if (near && input.held('grab') && !anySeen) {
    game.grabTarget = near;
    game.grabProgress += dt / GRAB_SECONDS;
    if (Math.random() < dt * 6) game.audio.grabTick(game.grabProgress);
    if (game.grabProgress >= 1) {
      near.taken = true;
      game.lootValue += near.value;
      game.grabProgress = 0;
      game.grabTarget = null;
      game.audio.pickup();
      if (near.required) {
        game.requiredTaken = true;
        game.objective = 'Loot secured — reach the EXIT';
      }
    }
  } else {
    game.grabProgress = 0;
    game.grabTarget = null;
  }

  // --- Escape: the exit opens once the required loot is pocketed.
  if (game.requiredTaken && pointInRect(player.x, player.y, level.exit, 4)) {
    if (game.levelIndex + 1 >= levelCount()) {
      finishScore(game);
    } else {
      game.state = 'leveldone';
      game.audio.escaped();
    }
    input.clearPressed();
    return;
  }

  // --- Caught: a full alarm ends the floor.
  if (game.alarm >= ALARM_MAX) {
    game.state = 'caught';
    game.audio.caught();
    game.audio.stopHum();
  }

  if (input.wasPressed('mute')) {
    game.muted = game.audio.toggleMute();
  }
  input.clearPressed();
}

function update(game, dt) {
  const input = game.input;
  if (input.wasPressed('confirm') || input.wasPressed('restart')) {
    game.audio.unlock();
    game.audio.click();
  }
  if (game.state === 'title') {
    if (input.wasPressed('confirm')) {
      loadLevel(game, 0, false);
      game.state = 'playing';
      game.audio.startHum();
    }
    input.clearPressed();
    return;
  }
  if (game.state === 'playing') {
    updatePlaying(game, dt);
    return;
  }
  if (game.state === 'caught') {
    if (input.wasPressed('restart') || input.wasPressed('confirm')) {
      loadLevel(game, game.levelIndex, true);
      game.state = 'playing';
      game.audio.startHum();
    }
    input.clearPressed();
    return;
  }
  if (game.state === 'leveldone') {
    if (input.wasPressed('confirm')) {
      loadLevel(game, game.levelIndex + 1, true);
      game.state = 'playing';
      game.audio.startHum();
    }
    input.clearPressed();
    return;
  }
  if (game.state === 'score') {
    if (input.wasPressed('restart') || input.wasPressed('confirm')) {
      loadLevel(game, 0, false);
      game.state = 'playing';
      game.audio.startHum();
    }
    input.clearPressed();
  }
}

function main() {
  const game = createGame();
  loadLevel(game, 0, false);
  game.state = 'title';

  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '1');
  const frozen = shot !== null && applyShot(game, shot, seed);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!frozen) update(game, dt);
    render(ctx, game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

main();
