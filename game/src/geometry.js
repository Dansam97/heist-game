// Flat geometry for Velvet Vault: angles, segment tests and circle pushes.
// Guards, cameras and the player all ask these same questions, so the
// answers live here once instead of three times, slightly differently.

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

// Does the segment (x1,y1)-(x2,y2) touch the rectangle? Slab test.
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  // X slab.
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  // Y slab.
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// Is the sight line between two points cut by any blocker rect?
export function sightBlocked(x1, y1, x2, y2, blockers) {
  for (const rect of blockers) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return true;
  }
  return false;
}

// Push a circle out of a rectangle it overlaps. Returns corrected {x, y}.
export function pushCircleOutOfRect(px, py, r, rect) {
  const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
  const dx = px - cx;
  const dy = py - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return { x: px, y: py };
  if (d2 < 1e-9) {
    // Centre inside the rect: shove out along the shortest side.
    const left = px - rect.x;
    const right = rect.x + rect.w - px;
    const top = py - rect.y;
    const bottom = rect.y + rect.h - py;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: rect.x - r, y: py };
    if (m === right) return { x: rect.x + rect.w + r, y: py };
    if (m === top) return { x: px, y: rect.y - r };
    return { x: px, y: rect.y + rect.h + r };
  }
  const d = Math.sqrt(d2);
  return { x: cx + (dx / d) * r, y: cy + (dy / d) * r };
}

// Run a circle through every solid rect, one axis at a time for sliding.
export function moveCircle(px, py, r, dx, dy, solids) {
  let nx = px + dx;
  for (const rect of solids) {
    const fixed = pushCircleOutOfRect(nx, py, r, rect);
    nx = fixed.x;
  }
  let ny = py + dy;
  for (const rect of solids) {
    const fixed = pushCircleOutOfRect(nx, ny, r, rect);
    ny = fixed.y;
  }
  return { x: nx, y: ny };
}

// Is a point inside a rectangle (with a small margin)?
export function pointInRect(px, py, rect, margin = 0) {
  return (
    px >= rect.x - margin && px <= rect.x + rect.w + margin &&
    py >= rect.y - margin && py <= rect.y + rect.h + margin
  );
}
