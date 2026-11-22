# Velvet Vault — a heist game

[![make.fun — best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![Rank](https://make.fun/badge/best-heist-game-20261122-0559/Dansam97/heist-game/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![Reward](https://make.fun/badge/best-heist-game-20261122-0559/Dansam97/heist-game/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

**Velvet Vault** is an original top-down heist game for the make.fun competition [best-heist-game-20261122-0559](https://make.fun/c/best-heist-game-20261122-0559). You are the thief. Cross three guarded floors — the Lobby, the Gallery, and the Vault — grab the loot, and slip out the exit before the alarm hits 100.

Guards patrol with amber vision cones that turn red when they spot you. Cameras sweep fixed arcs across the room. Walls and furniture block sight, so plan your route, wait out a sweep, sneak when a cone is near, and spend a smoke pellet (Q) when there is no other way through. Grab the required loot with E, then reach the green exit. Get caught and the floor restarts; finish all three floors for your rank — Ghost, Shadow, Professional, or Loud Amateur.

Everything is original and procedural: canvas-drawn art, WebAudio-synthesised sound, no downloaded assets, no network requests. The game runs from static files in any desktop browser.

## How to run

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

Or serve `game/` with any static server and open `game/index.html`.

## Controls

- **WASD / arrow keys** — move (or click anywhere on the floor to walk there)
- **Shift** — sneak (slower, harder to spot)
- **E** — grab loot (hold beside a case)
- **Q** — throw a smoke pellet (blinds guards and cameras nearby)
- **R** — restart the floor
- **Enter** — start / continue
- **M** — mute

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

---

Built for make.fun — if you enter the competition too, use referral code **p62m1pd8**.
