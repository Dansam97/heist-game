// Security cameras for Velvet Vault: wall mounts that sweep a fixed arc.
// A camera never walks, but its fan never stops moving, so the safe moment
// is the beat between sweeps. Same sight rules as a guard: range, angle,
// a clear line, and smoke blinds it.

import { CAMERA_HALF_ANGLE, CAMERA_RANGE, CAMERA_RISE, SNEAK_DETECTION } from './config.js';
import { angleDiff, angleTo, distance, sightBlocked } from './geometry.js';

export function createCamera(def, phase = 0) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    period: def.period,
    phase,
    angle: def.base,
    seenNow: false,
  };
}

export function updateCamera(camera, time) {
  camera.angle =
    camera.base + camera.sweep * Math.sin(((time + camera.phase) / camera.period) * Math.PI * 2);
}

export function cameraCanSee(camera, player, blockers, smoked) {
  if (smoked) return false;
  const d = distance(camera.x, camera.y, player.x, player.y);
  if (d > CAMERA_RANGE) return false;
  const toPlayer = angleTo(camera.x, camera.y, player.x, player.y);
  if (Math.abs(angleDiff(toPlayer, camera.angle)) > CAMERA_HALF_ANGLE) return false;
  if (sightBlocked(camera.x, camera.y, player.x, player.y, blockers)) return false;
  return true;
}

export function cameraAlarmRate(player, sneaking) {
  return sneaking ? CAMERA_RISE * SNEAK_DETECTION : CAMERA_RISE;
}
