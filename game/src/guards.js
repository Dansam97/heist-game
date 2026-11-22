// Guards for Velvet Vault: patrol, vision cones, suspicion and pursuit.
// A guard walks its waypoints, pauses, and turns to face where it walks.
// When the thief crosses its cone with a clear sight line, the guard turns,
// closes in, and the alarm climbs. Lose the thief for a while and the
// guard shakes it off and goes back to the route.

import {
  ALARM_RISE_CLOSE,
  ALARM_RISE_FAR,
  CONE_HALF_ANGLE,
  CONE_RANGE,
  GUARD_CHASE_SPEED,
  SNEAK_DETECTION,
} from './config.js';
import { angleDiff, angleTo, distance, moveCircle, sightBlocked } from './geometry.js';

export function createGuard(def, startIndex = 0) {
  const first = def.waypoints[startIndex % def.waypoints.length];
  return {
    x: first.x,
    y: first.y,
    waypoints: def.waypoints,
    waypointIndex: (startIndex + 1) % def.waypoints.length,
    speed: def.speed,
    pause: def.pause,
    pauseLeft: 0,
    facing: 0,
    alerted: false,
    loseLeft: 0,
    seenNow: false,
  };
}

// Can this guard see the thief right now? Cone, range, sight line, smoke.
export function guardCanSee(guard, player, blockers, smoked) {
  if (smoked) return false;
  const d = distance(guard.x, guard.y, player.x, player.y);
  if (d > CONE_RANGE) return false;
  const toPlayer = angleTo(guard.x, guard.y, player.x, player.y);
  if (Math.abs(angleDiff(toPlayer, guard.facing)) > CONE_HALF_ANGLE) return false;
  if (sightBlocked(guard.x, guard.y, player.x, player.y, blockers)) return false;
  return true;
}

// Alarm rise per second for a guard that has the thief in its cone.
export function guardAlarmRate(guard, player, sneaking) {
  const d = distance(guard.x, guard.y, player.x, player.y);
  const closeness = 1 - d / CONE_RANGE;
  let rate = ALARM_RISE_FAR + (ALARM_RISE_CLOSE - ALARM_RISE_FAR) * closeness;
  if (sneaking) rate *= SNEAK_DETECTION;
  return rate;
}

function turnToward(guard, targetAngle, dt) {
  const diff = angleDiff(targetAngle, guard.facing);
  const turnSpeed = 5.2; // radians per second
  const step = Math.max(-turnSpeed * dt, Math.min(turnSpeed * dt, diff));
  guard.facing += step;
}

export function updateGuard(guard, dt, player, blockers, solids, smoked) {
  guard.seenNow = guardCanSee(guard, player, blockers, smoked);

  if (guard.seenNow) {
    guard.alerted = true;
    guard.loseLeft = 2.0;
    // Face the thief and close the distance.
    turnToward(guard, angleTo(guard.x, guard.y, player.x, player.y), dt);
    const d = distance(guard.x, guard.y, player.x, player.y);
    if (d > 60) {
      const step = GUARD_CHASE_SPEED * dt;
      const nx = guard.x + Math.cos(guard.facing) * step;
      const ny = guard.y + Math.sin(guard.facing) * step;
      const moved = moveCircle(guard.x, guard.y, 14, nx - guard.x, ny - guard.y, solids);
      guard.x = moved.x;
      guard.y = moved.y;
    }
    return;
  }

  if (guard.alerted) {
    guard.loseLeft -= dt;
    if (guard.loseLeft <= 0) guard.alerted = false;
    // Stand and scan while the trail goes cold.
    guard.facing += dt * 0.6;
    return;
  }

  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  const d = distance(guard.x, guard.y, target.x, target.y);
  if (d < 6) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseLeft = guard.pause;
    return;
  }
  const heading = angleTo(guard.x, guard.y, target.x, target.y);
  turnToward(guard, heading, dt);
  const step = guard.speed * dt;
  const nx = guard.x + Math.cos(guard.facing) * step;
  const ny = guard.y + Math.sin(guard.facing) * step;
  const moved = moveCircle(guard.x, guard.y, 14, nx - guard.x, ny - guard.y, solids);
  guard.x = moved.x;
  guard.y = moved.y;
}
