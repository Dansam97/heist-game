// Rendering for Velvet Vault: one canvas, everything drawn by hand.
// The draw order does the depth work: floor, then vision cones, then
// walls and furniture (which cut the cones where sight is blocked), then
// loot, exit, people and smoke, then the HUD bar and any overlay screen.

import { PALETTE, VIEW_W, VIEW_H, HUD_H, FLOOR_TOP, FLOOR_BOTTOM, ALARM_MAX, CONE_RANGE, CONE_HALF_ANGLE, CAMERA_RANGE, CAMERA_HALF_ANGLE, PLAYER_R, SMOKE_RADIUS } from './config.js';

function drawFloor(ctx, level) {
  // Checkerboard stone tiles.
  const tile = 64;
  for (let y = FLOOR_TOP; y < FLOOR_BOTTOM; y += tile) {
    for (let x = 0; x < VIEW_W; x += tile) {
      const even = ((x / tile) | 0) % 2 === ((y / tile) | 0) % 2;
      ctx.fillStyle = even ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW_W; x += tile) {
    ctx.beginPath();
    ctx.moveTo(x, FLOOR_TOP);
    ctx.lineTo(x, FLOOR_BOTTOM);
    ctx.stroke();
  }
  for (let y = FLOOR_TOP; y <= FLOOR_BOTTOM; y += tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
    ctx.stroke();
  }
  // Carpet runner down the middle of the room.
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(612, FLOOR_TOP, 56, FLOOR_BOTTOM - FLOOR_TOP);
  ctx.fillStyle = PALETTE.carpetEdge;
  ctx.fillRect(612, FLOOR_TOP, 4, FLOOR_BOTTOM - FLOOR_TOP);
  ctx.fillRect(664, FLOOR_TOP, 4, FLOOR_BOTTOM - FLOOR_TOP);
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
    ctx.strokeStyle = PALETTE.wallTrim;
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
  }
}

function drawCover(ctx, level) {
  for (const c of level.cover) {
    const top = c.kind === 'plinth' || c.kind === 'statue' ? PALETTE.coverStoneTop : PALETTE.coverWoodTop;
    const body = c.kind === 'plinth' || c.kind === 'statue' ? PALETTE.coverStone : PALETTE.coverWood;
    ctx.fillStyle = body;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = top;
    ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
    if (c.kind === 'statue') {
      ctx.fillStyle = '#b9c0cc';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCone(ctx, x, y, facing, range, halfAngle, fill, hot) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = hot ? 'rgba(255, 80, 60, 0.85)' : 'rgba(255, 200, 90, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawCones(ctx, game) {
  for (const cam of game.cameras) {
    drawCone(
      ctx, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE,
      cam.seenNow ? PALETTE.cameraConeHot : PALETTE.cameraCone, cam.seenNow,
    );
  }
  for (const guard of game.guards) {
    drawCone(
      ctx, guard.x, guard.y, guard.facing, CONE_RANGE, CONE_HALF_ANGLE,
      guard.seenNow ? PALETTE.guardConeHot : PALETTE.guardCone, guard.seenNow,
    );
  }
}

function drawLoot(ctx, game) {
  const now = game.time;
  for (const item of game.loot) {
    if (item.taken) continue;
    const pulse = 0.5 + 0.5 * Math.sin(now * 3 + item.x);
    // Glow halo.
    const glow = ctx.createRadialGradient(item.x, item.y, 4, item.x, item.y, 46);
    glow.addColorStop(0, PALETTE.lootGlow);
    glow.addColorStop(1, 'rgba(255, 214, 64, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(item.x, item.y, 46, 0, Math.PI * 2);
    ctx.fill();
    // The jewel itself: a spinning diamond.
    const s = 13 + pulse * 2;
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = PALETTE.lootGold;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.fillStyle = '#fff3b0';
    ctx.fillRect(-s / 4, -s / 4, s / 2, s / 2);
    ctx.restore();
    // Label and value, always legible.
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe27a';
    ctx.fillText(item.label, item.x, item.y - 26);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = PALETTE.textDim;
    ctx.fillText(`$${item.value.toLocaleString('en-US')}${item.required ? '  ★ REQUIRED' : ''}`, item.x, item.y + 34);
  }
}

function drawExit(ctx, game) {
  const e = game.level.exit;
  const open = game.requiredTaken;
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  if (open) {
    const glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, 70);
    glow.addColorStop(0, PALETTE.exitGlow);
    glow.addColorStop(1, 'rgba(47, 214, 122, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = open ? PALETTE.exitGreen : '#3d6b52';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? '#a9f5c9' : '#5a7a68';
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2);
  ctx.fillStyle = open ? '#062b18' : '#cfe8d8';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(open ? 'EXIT' : 'LOCKED', 0, 5);
  ctx.restore();
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = open ? PALETTE.exitGreen : PALETTE.textDim;
  ctx.fillText(open ? 'EXIT — GO!' : 'EXIT — GRAB THE LOOT FIRST', e.x + e.w + 12, cy + 5);
}

function drawGuard(ctx, guard) {
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 10, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = PALETTE.guardBody;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d7deea';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim shows the facing.
  ctx.fillStyle = PALETTE.guardCap;
  ctx.beginPath();
  ctx.arc(
    guard.x + Math.cos(guard.facing) * 8,
    guard.y + Math.sin(guard.facing) * 8,
    7, 0, Math.PI * 2,
  );
  ctx.fill();
  // Eyes toward the facing.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(
    guard.x + Math.cos(guard.facing) * 12,
    guard.y + Math.sin(guard.facing) * 12,
    2.5, 0, Math.PI * 2,
  );
  ctx.fill();
  if (guard.alerted) {
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5040';
    ctx.fillText('!', guard.x, guard.y - 22);
  }
}

function drawCamera(ctx, cam) {
  ctx.fillStyle = PALETTE.cameraBody;
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8b0b0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Lens barrel along the sweep angle.
  ctx.strokeStyle = '#ff6b5e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cam.x, cam.y);
  ctx.lineTo(cam.x + Math.cos(cam.angle) * 16, cam.y + Math.sin(cam.angle) * 16);
  ctx.stroke();
  // Blinking record light.
  const blink = Math.sin(cam.seenNow ? 12 : 4) > 0;
  ctx.fillStyle = cam.seenNow ? '#ff2020' : blink ? '#ff8080' : '#5a2020';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y - 11, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(ctx, game) {
  const p = game.player;
  const r = p.sneaking ? 11 : PLAYER_R;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 10, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded thief: dark cloak, gold clasp, pale face in the facing.
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.thiefTrim;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.arc(
    p.x + Math.cos(p.facing) * 6,
    p.y + Math.sin(p.facing) * 6,
    5, 0, Math.PI * 2,
  );
  ctx.fill();
  // Grab progress ring.
  if (game.grabProgress > 0 && game.grabTarget) {
    ctx.strokeStyle = PALETTE.lootGold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * game.grabProgress);
    ctx.stroke();
  }
}

function drawSmoke(ctx, game) {
  for (const cloud of game.smokeClouds) {
    const alpha = Math.max(0, Math.min(0.55, (cloud.left / SMOKE_SECONDS) * 0.55));
    const grad = ctx.createRadialGradient(cloud.x, cloud.y, 10, cloud.x, cloud.y, SMOKE_RADIUS);
    grad.addColorStop(0, `rgba(200, 200, 210, ${alpha})`);
    grad.addColorStop(1, 'rgba(200, 200, 210, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, SMOKE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}

function alarmColor(alarm) {
  if (alarm >= 70) return PALETTE.alarmHigh;
  if (alarm >= 35) return PALETTE.alarmMid;
  return PALETTE.alarmLow;
}

function drawHud(ctx, game) {
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = PALETTE.hudLine;
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

  // Title + floor.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('VELVET VAULT', 16, 26);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(`${game.level.name}  ·  Floor ${game.levelIndex + 1} of 3`, 16, 46);

  // Alarm meter.
  const ax = 300;
  const aw = 340;
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('ALARM', ax, 20);
  ctx.fillStyle = '#1a1f2c';
  ctx.fillRect(ax, 28, aw, 18);
  ctx.fillStyle = alarmColor(game.alarm);
  ctx.fillRect(ax, 28, (aw * game.alarm) / ALARM_MAX, 18);
  ctx.strokeStyle = '#556080';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax + 0.5, 28.5, aw, 18);
  if (game.alarm >= 70) {
    ctx.fillStyle = PALETTE.alarmHigh;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('!! SPOTTED !!', ax + aw + 10, 43);
  }
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '12px sans-serif';
  ctx.fillText(`seen ${game.timesSeen}x`, ax + aw + 10, 20);

  // Loot carried.
  ctx.fillStyle = PALETTE.lootGold;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`LOOT  $${game.lootValue.toLocaleString('en-US')}`, 700, 30);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '13px sans-serif';
  ctx.fillText(game.objective, 700, 50);

  // Smoke, timer, mute.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`SMOKE ×${game.smokeLeft}  (Q)`, VIEW_W - 190, 28);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '13px sans-serif';
  const mins = Math.floor(game.time / 60);
  const secs = Math.floor(game.time % 60);
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}   ${game.muted ? 'MUTED (M)' : 'SOUND ON (M)'}`, VIEW_W - 16, 48);
  ctx.textAlign = 'left';
}

function drawCenterPanel(ctx, lines, accent) {
  const w = 640;
  const h = 44 + lines.length * 34;
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.fillStyle = 'rgba(10, 12, 20, 0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.textAlign = 'center';
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? accent : PALETTE.text;
    ctx.font = i === 0 ? 'bold 30px sans-serif' : '16px sans-serif';
    ctx.fillText(line.text, VIEW_W / 2, y + 52 + i * 34);
  });
  ctx.textAlign = 'left';
}

function drawOverlay(ctx, game) {
  if (game.state === 'title') {
    ctx.fillStyle = 'rgba(8, 10, 16, 0.72)';
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
    drawCenterPanel(ctx, [
      { text: 'VELVET VAULT' },
      { text: 'A three-floor heist. Cross each room, grab the loot, slip out.' },
      { text: 'WASD / arrows to move · Shift to sneak · Click to walk' },
      { text: 'E to grab loot · Q for a smoke pellet · R to restart' },
      { text: 'Stay out of the amber cones and the red camera sweeps.' },
      { text: 'If the alarm hits 100, you are caught.' },
      { text: 'Press Enter to begin the heist' },
    ], PALETTE.lootGold);
    return;
  }
  if (game.state === 'caught') {
    ctx.fillStyle = 'rgba(40, 6, 6, 0.66)';
    ctx.fillRect(0, HUD_H, VIEW_W, VIEW_H - HUD_H);
    drawCenterPanel(ctx, [
      { text: 'CAUGHT!' },
      { text: 'The alarm hit 100. The guards have you.' },
      { text: `Loot kept: $${game.lootValue.toLocaleString('en-US')}  ·  Times seen: ${game.timesSeen}` },
      { text: 'Press R to try this floor again' },
    ], PALETTE.alarmHigh);
    return;
  }
  if (game.state === 'leveldone') {
    drawCenterPanel(ctx, [
      { text: `${game.level.name.toUpperCase()} — CLEAN GETAWAY` },
      { text: `Loot so far: $${game.lootValue.toLocaleString('en-US')}` },
      { text: 'Press Enter for the next floor' },
    ], PALETTE.exitGreen);
    return;
  }
  if (game.state === 'score') {
    const s = game.score;
    drawCenterPanel(ctx, [
      { text: 'THE HEIST IS DONE' },
      { text: `Rank: ${s.rank}` },
      { text: `Total loot: $${s.loot.toLocaleString('en-US')}  ·  Time: ${s.timeText}` },
      { text: `Times seen: ${s.seen}  ·  Smoke used: ${s.smokeUsed}` },
      { text: 'Velvet Vault — an original game. Press R to run it again.' },
    ], PALETTE.lootGold);
  }
}

export function render(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, game.level);
  drawCones(ctx, game);
  drawWalls(ctx, game.level);
  drawCover(ctx, game.level);
  drawLoot(ctx, game);
  drawExit(ctx, game);
  for (const cam of game.cameras) drawCamera(ctx, cam);
  for (const guard of game.guards) drawGuard(ctx, guard);
  drawPlayer(ctx, game);
  drawSmoke(ctx, game);
  drawHud(ctx, game);
  drawOverlay(ctx, game);
}
