// Velvet Vault — tuning constants and shared palette.
// One place holds every number the rest of the game reads, so balancing
// the heist never means hunting magic numbers through the other files.

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 64;
export const FLOOR_TOP = HUD_H;
export const FLOOR_BOTTOM = VIEW_H - 8;

export const PLAYER_R = 14;
export const WALK_SPEED = 175;
export const SNEAK_SPEED = 92;
export const GUARD_SPEED = 72;
export const GUARD_CHASE_SPEED = 118;

export const CONE_RANGE = 235;
export const CONE_HALF_ANGLE = 0.62; // radians, each side of the facing
export const CAMERA_RANGE = 285;
export const CAMERA_HALF_ANGLE = 0.46;

export const ALARM_MAX = 100;
export const ALARM_DECAY = 7; // per second while nobody sees the thief
export const ALARM_RISE_CLOSE = 58; // per second, guard cone, point blank
export const ALARM_RISE_FAR = 26; // per second, guard cone, at max range
export const CAMERA_RISE = 42; // per second inside a camera sweep
export const SNEAK_DETECTION = 0.55; // multiplier while sneaking

export const SMOKE_START = 2; // pellets per floor
export const SMOKE_RADIUS = 150;
export const SMOKE_SECONDS = 4;

export const GRAB_SECONDS = 0.7; // hold E beside loot to pocket it
export const GRAB_RANGE = 40;

export const PALETTE = {
  floorA: '#232a3a',
  floorB: '#1d2331',
  floorLine: '#2e3850',
  wall: '#3a4358',
  wallTop: '#4d5878',
  wallTrim: '#c9a227',
  coverWood: '#6b4a2b',
  coverWoodTop: '#8a6238',
  coverStone: '#4a4f5e',
  coverStoneTop: '#636a7d',
  carpet: '#3a2730',
  carpetEdge: '#4d3540',
  guardCone: 'rgba(255, 176, 32, 0.20)',
  guardConeHot: 'rgba(255, 64, 48, 0.30)',
  cameraCone: 'rgba(255, 80, 80, 0.16)',
  cameraConeHot: 'rgba(255, 40, 40, 0.30)',
  guardBody: '#2c4a7a',
  guardCap: '#1d3355',
  cameraBody: '#8a2f2f',
  lootGlow: 'rgba(255, 214, 64, 0.35)',
  lootGold: '#ffd640',
  exitGreen: '#2fd67a',
  exitGlow: 'rgba(47, 214, 122, 0.30)',
  thief: '#15161c',
  thiefTrim: '#e8c15a',
  hudBg: '#10131c',
  hudLine: '#2a3247',
  text: '#e8e6da',
  textDim: '#9aa3b8',
  alarmLow: '#2fd67a',
  alarmMid: '#ffb020',
  alarmHigh: '#ff4030',
};

export const LEVEL_NAMES = ['The Lobby', 'The Gallery', 'The Vault'];
export const LEVEL_SUBS = [
  'Cross the lobby. One case, two guards, one camera.',
  'Two cases now, and the patrols overlap. Watch the sweeps.',
  'The Star of Marlow waits in the vault. Grab it and vanish.',
];
