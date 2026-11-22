// Keyboard and mouse input for Velvet Vault.
// Tracks held keys, edge-triggered presses, and a click-to-move target so
// the thief answers both WASD and the mouse. Nothing here touches the game.

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let moveTarget = null; // {x, y} in canvas pixels, or null
  let mouse = { x: 0, y: 0 };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    KeyE: 'grab',
    KeyQ: 'smoke',
    KeyR: 'restart',
    Enter: 'confirm',
    KeyM: 'mute',
  };

  function onKeyDown(event) {
    const action = KEYMAP[event.code];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) pressed.add(action);
    held.add(action);
  }
  function onKeyUp(event) {
    const action = KEYMAP[event.code];
    if (!action) return;
    held.delete(action);
  }
  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouse = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }
  function onMouseDown(event) {
    onMouseMove(event);
    // A click below the HUD sets a walk target; the thief steers to it.
    if (mouse.y > 72) moveTarget = { x: mouse.x, y: mouse.y };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    held(action) {
      return held.has(action);
    },
    // True once per physical press; the game clears it each frame.
    wasPressed(action) {
      return pressed.has(action);
    },
    clearPressed() {
      pressed.clear();
    },
    moveVector() {
      let x = 0;
      let y = 0;
      if (held.has('left')) x -= 1;
      if (held.has('right')) x += 1;
      if (held.has('up')) y -= 1;
      if (held.has('down')) y += 1;
      if (x === 0 && y === 0 && moveTarget) {
        // Click-to-move: steer toward the target until close.
        const dx = moveTarget.x - this.playerX;
        const dy = moveTarget.y - this.playerY;
        const d = Math.hypot(dx, dy);
        if (d < 8) {
          moveTarget = null;
        } else {
          x = dx / d;
          y = dy / d;
        }
      }
      const len = Math.hypot(x, y);
      if (len > 1) {
        x /= len;
        y /= len;
      }
      return { x, y };
    },
    clearMoveTarget() {
      moveTarget = null;
    },
    playerX: 0,
    playerY: 0,
    mouse() {
      return mouse;
    },
  };
}
