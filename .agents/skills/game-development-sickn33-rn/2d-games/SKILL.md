---
name: 2d-games
description: >-
  2D guest mini-game patterns for RN Simulation Game perform challenges:
  sprites, atlases, simple physics, cameras, teardown. Use when building
  canvas/Kaplay/Phaser/Pixi skill-checks inside the challenge modal — not for
  the clinical panel shell.
---

# 2D games (guest challenges only)

> In this repo, 2D systems live **inside** the perform modal (or Later presentation). The census/task chrome stays HTML. Prefer the lightest guest: Raw Canvas/WebGL → Kaplay → Phaser 4 → PixiJS 8.

---

## When to use 2D at all

| Challenge need | Use 2D guest? |
|----------------|---------------|
| Med brand↔generic / text identity | **No** — DOM quiz |
| Spatial / timing / drag / simple arcade | **Yes** — sandboxed guest |
| Whole shift UI as sprites | **No** — poor fit |

---

## Guest boundaries

- Shell owns pause + pass/fail contract (see `web-games`, `shift-simulation`).
- Fixed timestep for any physics inside the guest only.
- Atlas + pool short-lived FX; destroy everything on modal close.
- No dependency from 2D code into `gameState` mutators except the completion callback.

---

## 1. Sprite systems

| Component | Purpose |
|-----------|---------|
| **Atlas** | Fewer draw calls |
| **Animation** | 8–24 FPS typical for UI-scale checks |
| **Pivot** | Rotation/scale origin |
| **Layering** | Z-order; keep readable at modal size |

---

## 2. Tilemaps (rare here)

Only if a challenge is room/grid based. Prefer simple boards over full Metroidvania cameras.

| Factor | Recommendation |
|--------|----------------|
| Tile size | 32×32 default for modal readability |
| Collision | Boxes/circles, not pixel-perfect |
| Layers | Background / interact / FX |

---

## 3. 2D physics

| Shape | Use |
|-------|-----|
| Box | UI blocks, hit zones |
| Circle | Soft targets |
| Capsule | Rare — character-like guests |

Fixed timestep; keep bodies few (challenge should resolve in seconds, not minutes).

---

## 4. Camera

| Type | Use in challenges |
|------|-------------------|
| Static | **Default** — full board visible in modal |
| Follow / shake | Sparingly; short shake 50–200ms |

Room-based / multi-target cameras are usually overkill for E5.

---

## 5. Genre patterns (borrow only)

| Pattern | OK inside guest? |
|---------|------------------|
| Timing / precision tap | Yes |
| Drag-to-target / sort | Yes |
| Platformer coyote/buffer | Only if the challenge *is* a platform beat |
| Top-down twin-stick | Unlikely for clinical framing |

---

## Anti-patterns

| Don't | Do |
|-------|-----|
| Drive the shift with a 2D scene graph | Guest modal only |
| Separate textures per frame | Atlases |
| Complex collision for a 10s check | Simplified shapes |
| Leave RAF running after fail/pass | Teardown on complete |

## Limitations

- Framework pick: `engine-selection` + `web-games`.
- Product loop / slots / clock: `shift-simulation`.
