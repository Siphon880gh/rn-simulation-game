---
name: engine-selection
description: >-
  Chooses runtimes for RN Simulation Game using fit tiers (most likely, likely
  partial, possible/approval, poor fit). Use when deciding game engines, E0.M3
  stamps, comparing Phaser/Kaplay/Pixi/Ink/Twine/React/Godot, or proposing a
  library that might replace the vanilla shift shell.
---

# Engine selection (RN shift sim)

> Full comparison tables live in [`AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md`](../../../AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md). This skill is the decision procedure.

---

## Fit tiers

| Tier | Meaning | Action |
|------|---------|--------|
| **Most likely** | Matches locked stack + core loop | Default; implement |
| **Likely (partial)** | Subsystem only (reactivity, guest mini-game, state machine) | OK if sandboxed |
| **Possible (needs approval)** | Viable if product direction changes | **Stop and ask** before adding |
| **Poor fit** | Wrong UX/toolchain for panels-first shift sim | Do not use as shell |

---

## Decision tree

```
Need a runtime for what?
│
├── Shift shell (clock, panels, slots, packs)
│   └── Custom vanilla JS ES modules  → Most likely
│       optional: signals / XState     → Likely partial
│
├── Scenario content drip
│   └── JSON/YAML (HTML data-* today) → Most likely (E4)
│
├── Perform challenge
│   ├── Text / identity quiz          → Custom DOM plugin
│   └── Spatial / arcade
│       └── lightest guest that works:
│           Raw Canvas/WebGL → Kaplay → Phaser 4 → PixiJS 8
│
├── Branching prose / dialogue
│   └── Ink / Twine / Adventure Engine → Possible (approval)
│       never owns clock or slots
│
├── Dense SPA component model
│   ├── Lit / Web Components           → Possible (approval)
│   └── React                          → Possible (approval; stack change)
│
└── 3D spectacle / big editor engines
    ├── Three / Babylon guest          → Possible Later (approval)
    └── Godot / Unity / Construct shell → Poor fit
```

---

## Quick scorecard (shell job)

Score candidates on: **clock & slots · clinical panels · scenario packs · mini-games · vanilla/no-build · authoring**.

| Approach | Tier | Shell? |
|----------|------|--------|
| Custom vanilla JS | Most likely | **Yes — default** |
| Scenario-as-data packs | Most likely | Feeds shell |
| Signals / light reactive | Likely partial | UI sync |
| Custom mini-game plugins | Likely partial | Guest |
| Raw Canvas / WebGL | Likely partial | Guest |
| Kaplay | Likely partial | Guest |
| Phaser 4 | Likely partial | Guest (often needs bundler) |
| XState | Likely partial | Orchestration aid |
| Ink + inkjs | Possible | No — narrative slice |
| Twine / Twison / TweeJS | Possible | No |
| Adventure Engine | Possible | No |
| React custom | Possible | Only if approved stack change |
| Lit / Web Components | Possible | Maybe panels later |
| PixiJS 8 | Possible / Later | Guest render |
| Three.js / Babylon.js | Possible / Later | 3D guest only |
| Godot / Unity WebGL | Poor fit | No |
| Full canvas app shell | Poor fit | No |

---

## Approval gates

Ask the user before:

1. Adding **React**, **Ink**, or **Twine** (named in locked constraints)
2. Making **Phaser / Kaplay / Pixi / Three / Babylon** the app shell
3. Adopting **Godot / Unity / Construct / GDevelop** for the product
4. Changing `decisions.game_runtime` away from `keep_modular_app`

When proposing: name **game type**, **tier**, **epic** (E1–E6), and whether it is shell or guest.

---

## Agent defaults

1. Extend **custom vanilla shell** + **scenario packs** + **plugin challenges**.
2. Prefer **lightest guest** for canvas challenges.
3. Narrative engines never become shift-time authority.
4. After a decision, record rationale in `.agents/state.json` when it is an E0.M3 stamp.

## Limitations

- Does not implement engines; only selects and constrains.
- Prefer the living engines markdown over memory if tables disagree.
