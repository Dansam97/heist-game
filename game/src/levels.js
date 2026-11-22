// Floor plans for Velvet Vault: three rooms, one heist each.
// Every room is a list of axis-aligned rectangles: outer walls, furniture
// that blocks sight and movement, patrol waypoints, camera mounts, loot
// and the exit. Patrol legs are drawn through open floor only, so a guard
// never has to push through a wall. Nothing here runs; levels.js only
// describes the rooms.

import { FLOOR_TOP, FLOOR_BOTTOM, LEVEL_NAMES, LEVEL_SUBS } from './config.js';

// A rectangle: {x, y, w, h} in canvas pixels.
function wall(x, y, w, h) {
  return { x, y, w, h };
}

function buildLobby() {
  return {
    name: LEVEL_NAMES[0],
    sub: LEVEL_SUBS[0],
    spawn: { x: 130, y: 700 },
    exit: { x: 52, y: 660, w: 46, h: 76 },
    walls: [
      wall(24, FLOOR_TOP + 8, 1232, 18), // north wall
      wall(24, FLOOR_BOTTOM - 26, 1232, 18), // south wall
      wall(24, FLOOR_TOP + 8, 18, 700), // west wall
      wall(1238, FLOOR_TOP + 8, 18, 700), // east wall
      wall(430, 210, 180, 20), // reception desk, north run
      wall(700, 210, 180, 20),
      wall(430, 470, 20, 160), // central pillar row
      wall(830, 470, 20, 160),
      wall(560, 560, 160, 20), // low planter wall
    ],
    cover: [
      { x: 300, y: 330, w: 150, h: 60, kind: 'sofa' },
      { x: 830, y: 330, w: 150, h: 60, kind: 'sofa' },
      { x: 560, y: 120, w: 160, h: 44, kind: 'desk' },
      { x: 180, y: 560, w: 120, h: 50, kind: 'desk' },
      { x: 980, y: 560, w: 120, h: 50, kind: 'desk' },
    ],
    guards: [
      {
        waypoints: [
          { x: 280, y: 180 }, { x: 1000, y: 180 },
          { x: 1000, y: 420 }, { x: 280, y: 420 },
        ],
        speed: 72, pause: 1.4,
      },
      {
        waypoints: [
          { x: 1050, y: 300 }, { x: 1050, y: 640 },
          { x: 760, y: 640 }, { x: 760, y: 300 },
        ],
        speed: 66, pause: 1.1,
      },
    ],
    cameras: [
      { x: 640, y: 96, base: Math.PI / 2, sweep: 0.85, period: 5.2 },
    ],
    loot: [
      { x: 1120, y: 150, value: 5000, required: true, label: 'Sapphire Case' },
      { x: 170, y: 150, value: 1200, required: false, label: 'Silver Tray' },
    ],
  };
}

function buildGallery() {
  return {
    name: LEVEL_NAMES[1],
    sub: LEVEL_SUBS[1],
    spawn: { x: 130, y: 700 },
    exit: { x: 52, y: 660, w: 46, h: 76 },
    walls: [
      wall(24, FLOOR_TOP + 8, 1232, 18),
      wall(24, FLOOR_BOTTOM - 26, 1232, 18),
      wall(24, FLOOR_TOP + 8, 18, 700),
      wall(1238, FLOOR_TOP + 8, 18, 700),
      wall(300, 200, 20, 220), // gallery partition, west
      wall(960, 200, 20, 220), // gallery partition, east
      wall(560, 140, 160, 18), // plinth wall north
      wall(560, 620, 160, 18), // plinth wall south
      wall(430, 420, 130, 18),
      wall(720, 420, 130, 18),
    ],
    cover: [
      { x: 380, y: 250, w: 90, h: 120, kind: 'plinth' },
      { x: 810, y: 250, w: 90, h: 120, kind: 'plinth' },
      { x: 150, y: 300, w: 110, h: 60, kind: 'bench' },
      { x: 1020, y: 300, w: 110, h: 60, kind: 'bench' },
      { x: 560, y: 480, w: 160, h: 44, kind: 'desk' },
      { x: 640, y: 190, w: 60, h: 60, kind: 'statue' },
    ],
    guards: [
      {
        waypoints: [
          { x: 120, y: 120 }, { x: 640, y: 120 },
          { x: 1180, y: 120 }, { x: 1180, y: 460 },
          { x: 640, y: 460 }, { x: 120, y: 460 },
        ],
        speed: 78, pause: 1.0,
      },
      {
        waypoints: [
          { x: 420, y: 680 }, { x: 940, y: 680 },
          { x: 940, y: 180 }, { x: 420, y: 180 },
        ],
        speed: 70, pause: 1.3,
      },
      {
        waypoints: [
          { x: 1150, y: 160 }, { x: 1150, y: 660 },
          { x: 920, y: 660 }, { x: 920, y: 160 },
        ],
        speed: 64, pause: 1.6,
      },
    ],
    cameras: [
      { x: 300, y: 96, base: Math.PI / 2, sweep: 0.7, period: 4.6 },
      { x: 980, y: 96, base: Math.PI / 2, sweep: 0.7, period: 5.6 },
    ],
    loot: [
      { x: 640, y: 300, value: 9000, required: true, label: 'Emerald Bust' },
      { x: 1120, y: 680, value: 2500, required: false, label: 'Gold Frame' },
      { x: 160, y: 680, value: 2500, required: false, label: 'Ivory Mask' },
    ],
  };
}

function buildVault() {
  return {
    name: LEVEL_NAMES[2],
    sub: LEVEL_SUBS[2],
    spawn: { x: 130, y: 700 },
    exit: { x: 52, y: 660, w: 46, h: 76 },
    walls: [
      wall(24, FLOOR_TOP + 8, 1232, 18),
      wall(24, FLOOR_BOTTOM - 26, 1232, 18),
      wall(24, FLOOR_TOP + 8, 18, 700),
      wall(1238, FLOOR_TOP + 8, 18, 700),
      wall(340, 180, 20, 260), // vault antechamber, west
      wall(920, 180, 20, 260), // vault antechamber, east
      wall(340, 180, 270, 20), // antechamber north wall, left of the door gap
      wall(670, 180, 270, 20), // antechamber north wall, right of the door gap
      wall(500, 440, 280, 20), // vault door frame, north
      wall(500, 560, 280, 20), // vault door frame, south
      wall(500, 440, 20, 140), // vault door frame, west
      wall(760, 440, 20, 140), // vault door frame, east
      wall(180, 560, 160, 18), // south cover wall
      wall(940, 560, 160, 18),
    ],
    cover: [
      { x: 120, y: 200, w: 130, h: 60, kind: 'desk' },
      { x: 1030, y: 200, w: 130, h: 60, kind: 'desk' },
      { x: 420, y: 640, w: 120, h: 50, kind: 'bench' },
      { x: 740, y: 640, w: 120, h: 50, kind: 'bench' },
      { x: 560, y: 300, w: 160, h: 44, kind: 'plinth' },
    ],
    guards: [
      {
        waypoints: [
          { x: 220, y: 160 }, { x: 640, y: 160 },
          { x: 1150, y: 160 }, { x: 1150, y: 700 },
          { x: 400, y: 700 }, { x: 400, y: 160 },
        ],
        speed: 84, pause: 0.9,
      },
      {
        waypoints: [
          { x: 640, y: 620 }, { x: 400, y: 620 },
          { x: 400, y: 700 }, { x: 880, y: 700 },
          { x: 880, y: 620 },
        ],
        speed: 76, pause: 1.0,
      },
      {
        waypoints: [
          { x: 640, y: 260 }, { x: 880, y: 260 },
          { x: 880, y: 420 }, { x: 400, y: 420 },
          { x: 400, y: 260 },
        ],
        speed: 72, pause: 1.2,
      },
    ],
    cameras: [
      { x: 640, y: 96, base: Math.PI / 2, sweep: 0.9, period: 4.2 },
      { x: 340, y: 440, base: 0, sweep: 0.6, period: 5.0 },
      { x: 940, y: 440, base: Math.PI, sweep: 0.6, period: 5.0 },
    ],
    loot: [
      { x: 640, y: 500, value: 50000, required: true, label: 'Star of Marlow' },
      { x: 180, y: 120, value: 4000, required: false, label: 'Ruby Tiara' },
      { x: 1100, y: 120, value: 4000, required: false, label: 'Pearl Strand' },
    ],
  };
}

const BUILDERS = [buildLobby, buildGallery, buildVault];

export function buildLevel(index) {
  const level = BUILDERS[index % BUILDERS.length]();
  // Deep-copy the plain data so a run never mutates the blueprint.
  return JSON.parse(JSON.stringify(level));
}

export function levelCount() {
  return BUILDERS.length;
}
