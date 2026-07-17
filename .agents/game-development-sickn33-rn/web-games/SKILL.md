---
name: web-games
description: >-
  Browser game development for panel-first shift sims: vanilla shell, guest
  mini-game ladder (DOM → Canvas/WebGL → Kaplay → Phaser 4 → PixiJS 8), tab
  pause, and no-build ES modules. Use when implementing web runtimes, perform
  challenges, canvas guests, or WebGPU/WebGL choices in this repo.
---

# Web games (shell + guest)

> For this product, the browser app is a **DOM shift shell**. 2D/3D frameworks are **guests** inside challenges or Later presentation — not the chrome.

---

## 1. Shell vs guest decision

```
What are you building?
│
├── Clock / census / slots / scenario drip / debrief
│   └── Custom vanilla ES modules (+ signals/jQuery)
│       optional: XState for phase/slot/challenge machines
│
├── Perform challenge
│   ├── Text / identity                     → DOM plugin modal
│   └── Spatial / arcade
│       └── Guest ladder (lightest first):
│           Raw Canvas/WebGL → Kaplay → Phaser 4 → PixiJS 8
│
├── Branching prose (approved only)         → Ink/Twine host slice
│
└── 3D beat (Later, approved)               → Three.js / Babylon.js guest
```

**Never** make Phaser, Kaplay, Pixi, Three, or Babylon the shift shell.

---

## 2. Framework roles (browser)

| Tool | Role here | Tier |
|------|-----------|------|
| **Vanilla ES modules** | App shell | Most likely |
| **Raw Canvas / WebGL** | Guest skill-check; closest to no-build | Likely partial |
| **Kaplay** | Lightweight 2D guest scenes | Likely partial |
| **Phaser 4** | Full 2D features guest; often needs bundler | Likely partial |
| **PixiJS 8** | GPU/scene-graph render guest | Possible / Later |
| **Three.js / Babylon.js** | 3D guest only | Possible / Later |
| **Godot / Unity WebGL** | — | Poor fit as shell |

Generic “Phaser for any 2D game” advice does **not** override the shell rule.

---

## 3. Guest lifecycle

1. Shell pauses game timer (challenge ownership).
2. Mount guest in modal (`<canvas>` or framework scene).
3. Run **local** loop (fixed timestep if physics).
4. Emit `{ pass: boolean }` (and optional metrics).
5. Destroy/teardown guest; clear listeners; resume per pause matrix.

Pass context in (task id, med data); do not read/write slot state from inside the guest except via the callback contract.

---

## 4. Browser constraints (still apply)

| Constraint | Strategy |
|------------|----------|
| Tab throttling | Pause shift when hidden if product rules say so; always pause during challenges |
| No required bundler (MVP) | Prefer DOM / Canvas / CDN ESM; flag Phaser bundler cost |
| Audio autoplay | Unlock on first user gesture |
| Static host | Works via local/static server; ES modules |

### WebGPU

- Optional Later for heavy guest GPU work; WebGL fallback.
- Feature-detect `navigator.gpu`; not needed for MVP shell or DOM quizzes.

---

## 5. Performance (priorities for *this* app)

1. Dirty-check panel updates (don’t rebuild whole census each tick)
2. Tear down challenge guests completely (no leaked RAF/timers)
3. Compress Later art assets (WebP, etc.) when E7 lands
4. Object pooling only inside busy canvas guests

---

## 6. Anti-patterns

| Don't | Do |
|-------|-----|
| Canvas-ify the med identity quiz | DOM form / buttons |
| Leave Kaplay/Phaser running after modal close | Destroy scene + cancel RAF |
| Assume WebGPU everywhere | Detect + fallback |
| Load a full 2D engine for one multiple-choice | Custom plugin module |

## Limitations

- Engine approval gates: see `engine-selection`.
- Sprite/tilemap details: see `2d-games` (guest only).
