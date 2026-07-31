---
name: game-development-sickn33
description: >-
  Orchestrates RN Simulation Game / panel-first browser shift-sim development.
  Routes by game type and engine fit tier (vanilla shell, scenario packs, guest
  mini-games, narrative slices). Use when choosing runtimes, implementing clock/
  slots/panels/challenges, or when the user mentions AGENTS_POSSIBLE_GAME_ENGINES,
  E0.M3, Kaplay, Phaser, Pixi, Ink, Twine, or shift simulation architecture.
---

# Game Development (RN shift sim — repo fork)

> Project orchestrator for **this** nursing shift sim. **Engines serve game types — not the reverse.**  
> Source of truth for runtime choices: [`AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md`](../../AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md)  
> **Upstream / contribute-back pack (no shift rules):** [`../sickn33-game-development/`](../sickn33-game-development/)

---

## When to use

- Picking or arguing for a game engine / runtime (E0.M3 and later)
- Extending the shift shell (clock, census panels, slots, scenario drip, challenges)
- Adding a perform mini-game or narrative vignette without replacing the shell
- Mapping a feature to a **game type** + **fit tier** before coding

**Do not** use this pack to quietly adopt React, Ink, Twine, Phaser-as-shell, Unity/Godot WebGL, or 3D ward chrome. Those need explicit user approval (see locked constraints).

---

## Locked constraints (MVP)

From `.agents/state.json` → `decisions.main_constraints`:

- Web, ES6 modules, no required build step for MVP
- Vanilla JS (+ jQuery / signals or light reactive)
- **No React / Ink / Twine unless approved**
- Military game clock; **panels-first** clinical UI (not inventory RPG chrome)

Default runtime intent: **`keep_modular_app`** (custom vanilla shell).

---

## Game-type routing

| If the work is… | Fit | Read |
|-----------------|-----|------|
| Shift clock, pause ownership, speed factor | Primary | `shift-simulation` → repo timer maps |
| Multi-patient census / clinical panels | Primary | `shift-simulation` |
| Task slots, windows, urgents | Primary | `shift-simulation` |
| Scenario / event packs (JSON→YAML) | Primary | `shift-simulation` |
| Add patients to day/night + unit census | Primary | [`../add-shift-patient-pack/`](../add-shift-patient-pack/) |
| Engine / library choice | Decision | `engine-selection` + engines doc |
| DOM pass/fail challenge (quiz) | Primary thin | `web-games` (plugin path) |
| 2D canvas skill-check (guest only) | Optional guest | `web-games` → `2d-games` |
| Scoring / teaching debrief | Primary | `game-design` + E6 stories |
| Placeholder → final image/video | Primary | [`../replace-placeholder-assets/`](../replace-placeholder-assets/) + `PLACEHOLDER_ASSETS.md` |
| Find new image/video placeholder mounts | Primary | [`../scan-placeholder-assets/`](../scan-placeholder-assets/) (dimensions + fun-medical style) |
| Branching dialogue / case vignette | Side slice | `engine-selection` (Ink/Twine — approval) |
| Classic platformer / top-down as product | Out of scope | Refuse as shell; patterns only inside guest mini-game |
| 3D ward / XR / Godot-Unity shell | Poor fit | `engine-selection` poor-fit; Later guest at most |

### Legacy platform routes (keep for non-product work)

| Target | Sub-skill |
|--------|-----------|
| Generic browser HTML5/WebGL | `web-games` |
| Sprites / tilemaps / 2D physics | `2d-games` |
| 3D meshes / shaders | `3d-games` (guest Later only for this product) |
| Mobile / PC / VR / multiplayer / art / audio | `mobile-games`, `pc-games`, `vr-ar`, `multiplayer`, `game-art`, `game-audio` |

---

## Core principles (this product)

### 1. Two clocks, one authority

```
WALL CLOCK  → drives timer tick (scaled by speed factor)
GAME TIME   → military shift time; tasks unlock / expire against this
SHIFT SHELL → owns pause (user / modal / challenge)
```

Canvas/framework guests **never** own shift time. Challenges pause the shell timer; on complete, return pass/fail and destroy the guest.

### 2. Shell vs guest

| Layer | Owns | May use |
|-------|------|---------|
| **Shell** | Clock, census DOM, slots, scenario drip, scoring | Vanilla ES modules, signals/jQuery, optional XState |
| **Guest** | One perform challenge or Later presentation beat | DOM quiz → Raw Canvas/WebGL → Kaplay → Phaser 4 → PixiJS 8 (lightest first) |

### 3. Product game loop (not INPUT→UPDATE→RENDER as the shell)

```
SCAN census/tasks → CHOOSE work → (optional CHALLENGE) → OCCUPY slot
  → COMPLETE / MISS → REACT to drip/urgents → END SHIFT → DEBRIEF
```

Use fixed-timestep INPUT→UPDATE→RENDER only **inside** a canvas guest.

### 4. Patterns that matter here

| Pattern | Use when |
|---------|----------|
| **Store + subscribe** | Panel DOM sync (clock, slots, vitals) |
| **State machine** | Shift phases, slot lifecycle, challenge pause/resume |
| **Content packs** | Scenario drip, patient HTML/`data-*` → JSON/YAML |
| **Plugin registry** | Mini-game types keyed by task/challenge id |
| **Observer/events** | Cross-module: timer → tasks → UI |

Skip ECS / behavior trees / spatial hashes unless a guest mini-game needs them.

### 5. Anti-patterns (product)

| Don't | Do |
|-------|-----|
| Make Phaser/Kaplay/Pixi/Three the app shell | Keep clinical panels as HTML |
| Drive multi-patient slots from Ink/Twine | Host narrative as approved side slice |
| Add React quietly | Treat as stack decision + approval |
| Canvas-ify text/identity quizzes | Prefer DOM for E5 med quiz |
| Optimize draw calls for the census UI | Patch dirty panel regions |

---

## Agent workflow

1. Name the **game type** (table above).
2. Open [`AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md`](../../AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md) and assign a **fit tier**.
3. Read the matching sub-skill (`engine-selection`, `shift-simulation`, `web-games`, …).
4. Map work to epics: E1 clock · E2 panels · E3 slots · E4 scenarios · E5 challenges · E6 debrief.
5. Implement the lightest approved approach; do not switch stacks without user approval.

---

## Routing examples

### “Stamp E0.M3 / which engine?”
→ `engine-selection` → stamp `keep_modular_app` unless user changes direction.

### “Add med identity challenge”
→ `shift-simulation` (pause + slot gate) → `web-games` plugin DOM path. No Phaser.

### “Arcade skill-check in Perform modal”
→ `web-games` guest ladder (Canvas → Kaplay → Phaser) → `2d-games` for sprites/physics inside the modal only.

### “Patient conversation tree”
→ `engine-selection` narrative slice; require approval before Ink/Twine; shell keeps clock/slots.

---

## Related repo artifacts

| Artifact | Role |
|----------|------|
| [`AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md`](../../AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md) | Engine tiers & comparison |
| [`EPIC_MAP.md`](../../EPIC_MAP.md) / [`IMPLEMENTATION_STORIES.md`](../../IMPLEMENTATION_STORIES.md) | Capabilities & milestones |
| [`AGENTS_CODE_REFERENCE.md`](../../AGENTS_CODE_REFERENCE.md) | Code map (timer/tasks/patients/ui companions) |
| [`.agents/state.json`](../state.json) | Locked decisions + resume point |

## Limitations

- Does not replace reading repo maps before code changes.
- Does not authorize stack switches; approval required for React / Ink / Twine / full 2D-3D shells.
- Generic platformer/VR/multiplayer sub-skills are secondary for this product.
