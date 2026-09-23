# Arena Shooter

A browser-based 3D first-person shooter built with [Three.js](https://threejs.org/). Fight a single AI-controlled opponent in a closed arena using only the arrow keys and space bar — no mouse required.

![engine](https://img.shields.io/badge/engine-Three.js-black) ![type](https://img.shields.io/badge/type-static%20site-blue) ![build](https://img.shields.io/badge/build%20step-none-green)

## Features

- First-person arena shooter with keyboard-only controls (arrow keys + space)
- One AI opponent with a patrol / engage state machine — it detects you by line of sight, chases, strafes, keeps a preferred combat range, and fires back
- Hitscan raycast shooting with glowing tracer beams, muzzle flashes, and impact effects
- Health, damage, win/lose conditions, and a restart flow
- Bloom post-processing and a sci-fi HUD (health bars, crosshair, hit marker, hit counter, damage vignette)
- Zero build step — plain ES modules loaded straight from a CDN

## Controls

| Key | Action |
|---|---|
| `↑` / `↓` | Move forward / backward |
| `←` / `→` | Turn left / right |
| `Space` | Fire |

There is no mouse-look — turning is keyboard-only, similar to classic keyboard-driven FPS controls.

## Getting Started

This is a static site with **no build step and no dependencies to install**, but it does use native ES module [import maps](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap), which browsers only resolve when the page is served over `http://` — opening `index.html` directly via `file://` will not work.

Serve the project root with any static file server, for example:

```bash
npx serve .
```

or

```bash
python -m http.server
```

Then open the printed local URL (e.g. `http://localhost:3000`) in your browser.

## Project Structure

```
3d Shooter game/
├── index.html          # Page shell, HUD markup, import map, font/CDN links
├── style.css            # HUD styling (health bars, crosshair, overlays, effects)
├── docs/
│   └── README.md         # This file
└── js/
    ├── main.js            # Renderer/scene/camera setup, bloom pipeline, game loop
    ├── config.js           # Tunable constants (speeds, damage, cooldowns, arena layout)
    ├── input.js             # Keyboard input tracking (arrow keys + space)
    ├── arena.js              # Arena geometry, lighting, sky, glow trim, colliders/bounds
    ├── collision.js           # Shared bounds + circle-vs-pillar collision resolution
    ├── player.js               # Player movement, turning, health, camera sync
    ├── enemy.js                 # Enemy mesh, patrol/engage AI state machine, AI fire
    ├── combat.js                 # Raycast shooting, tracers, muzzle flashes, hit detection
    ├── hud.js                     # Health bars, crosshair, hit marker, overlays
    └── gameState.js                # Game state (playing/won/lost) and restart flow
```

## How It Works

- **Rendering** — [Three.js](https://threejs.org/) (loaded from a CDN via an import map, no bundler) renders the arena, and an `UnrealBloomPass` post-processing pass makes glowing elements (the enemy's eyes, tracers, arena trim) actually bloom.
- **Movement** — the player has no mouse-look; `←`/`→` rotate the camera's yaw and `↑`/`↓` move along the current facing direction. Movement is resolved against the arena bounds and pillar colliders each frame (simple bounds clamp + circle push-out, no physics engine).
- **Shooting** — pressing `Space` fires a hitscan ray from the center of the screen on a short cooldown. A hit on the enemy reduces its health; anything else just produces a tracer/impact effect.
- **Enemy AI** — a small state machine:
  - `PATROL`: cycles between fixed waypoints around the arena.
  - `ENGAGE`: triggered once the player is within detection range and in line of sight. The enemy closes or backs off to a preferred range, strafes, faces the player, and fires on a randomized cooldown with a hit chance that improves at closer range.
- **Win / lose** — the player wins when the enemy's health reaches 0 (it plays a death animation), and loses when their own health reaches 0. Either state shows an overlay with a **Restart** button that resets health, positions, and AI state.

## Tuning

All gameplay constants (movement speed, turn speed, fire cooldowns, damage values, detection/engage ranges, arena size, pillar/waypoint layout) live in [`js/config.js`](../js/config.js), so balance changes don't require touching game logic.

## Tech Stack

- [Three.js](https://threejs.org/) `r186` (core + `postprocessing` addons: `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `OutputPass`), loaded from [jsDelivr](https://www.jsdelivr.com/)
- Plain HTML / CSS / JavaScript (ES modules), no framework or build tooling
- Google Fonts (`Orbitron`, `Rajdhani`) for the HUD
