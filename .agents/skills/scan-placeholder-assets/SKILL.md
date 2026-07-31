---
name: scan-placeholder-assets
description: >-
  Scans the RN Simulation Game for places that need image/video placeholders,
  proposes catalog ids with subject + dimensions + fun-medical-simulation style
  prompts, and wires approved mounts. Use when looking for media opportunities,
  challenge heroes, landing art, slots, situations, or PLACEHOLDER_ASSETS gaps.
---

# Scan placeholder assets

Find UI/game surfaces that should show titled image/video placeholders, propose them **one at a time** (confirm before writing), and wire approved entries into the catalog + mounts.

Companion: [`../replace-placeholder-assets/`](../replace-placeholder-assets/) swaps real files once placeholders exist.

## Paths

| Artifact | Role |
|----------|------|
| [`PLACEHOLDER_ASSETS.md`](../../../PLACEHOLDER_ASSETS.md) | Inventory |
| [`game/assets/js/media-placeholder-catalog.json`](../../../game/assets/js/media-placeholder-catalog.json) | Canonical ids |
| [`game/assets/js/game-config.js`](../../../game/assets/js/game-config.js) → `mediaPlaceholders` | mounts / challenges / `promptStyleAppendix` |
| [`game/assets/js/media-placeholders.js`](../../../game/assets/js/media-placeholders.js) | `resolvePrompt` = subject + **Dimensions** + **Style** |
| [`memory.json`](memory.json) | Declined candidate ids — do not re-propose |
| [`progress.json`](progress.json) | Scan queue for `/loop` |
| [`reference.md`](reference.md) | Hunt surfaces + prompt contract |
| [`scripts/audit.mjs`](scripts/audit.mjs) | AUTO gap list |
| [`AGENTS_LOOP-Scan-Placeholder-Assets.md`](../../../AGENTS_LOOP-Scan-Placeholder-Assets.md) | `/loop` body |

## Prompt contract (every creation prompt)

Runtime `resolvePrompt` / PHP `ph_resolve_prompt` always builds:

1. **Subject** — catalog `prompt` (what to depict)
2. **Dimensions** — `Dimensions: {w}×{h}px — …` from catalog `w` / `h`
3. **Style** — `Style (fun medical simulation): …` from `promptStyleAppendix`

When proposing or authoring a catalog row, set `w` / `h` honestly for the mount (thumb vs hero vs backdrop). Do **not** paste the style appendix into the catalog `prompt` field — it is appended at resolve time. Do **not** put a Dimensions line in catalog `prompt` either unless you are intentionally overriding (prefer `w`/`h` fields).

## Hard rules

1. **Confirm before adding** — never write a new catalog id / mount until the user says yes.
2. **One candidate per tick** (or short batch then wait for yes/no per id).
3. **No means exclude** — decline → append to [`memory.json`](memory.json) `excluded`.
4. **Stable ids** — lowercase hyphenated (`challenge-foo`, `situation-bar`).
5. **Wire completely when yes** — catalog + `PLACEHOLDER_ASSETS.md` + config mount / `challengeMediaHtml` / landing as needed + `progress` for replace skill.
6. **Fun medical simulation** — honor style appendix; no gore, no real faces/PHI.
7. **Dimensions required** — every new asset must have `w` and `h`.

## Workflow

### 1. Load state

Read in parallel:

- `media-placeholder-catalog.json` → existing ids / mounts
- `memory.json` → excluded
- `PLACEHOLDER_ASSETS.md`
- `GameConfig.mediaPlaceholders.challenges` + `mounts`
- Optional: `node .agents/skills/scan-placeholder-assets/scripts/audit.mjs`

### 2. Hunt opportunities

See [reference.md](reference.md) § Hunt surfaces. Typical gaps:

- Challenge folders under `challenges/skills/*` / `emergencies/*` with no `challengeMediaHtml('<key>')`
- Landing tiles / debrief / toast hosts without media
- Situation still keys with null URLs and no catalog mount
- Busy-slot / patient perform variants

Skip ids already in catalog or `memory.json` → `excluded`.

### 3. Ask the user (required gate)

```text
Add this media placeholder?

- id: <id>
- kind: image | video
- title: <title>
- mount: <mount path>
- w×h: <w>×<h>
- subject prompt: <one sentence>
- resolved prompt preview: <subject> Dimensions: … Style (fun medical simulation): …

Reply yes or no for this placeholder.
```

### 4a. User says yes

1. Append catalog asset (`prompt` = subject only; set `w`/`h`).
2. Add inventory row in `PLACEHOLDER_ASSETS.md`.
3. Wire mount (`mediaPlaceholders.challenges`, `challengeMediaHtml`, landing, situation key, etc.).
4. Add replace-skill `progress.json` pending row.
5. AUTO: `node scripts/verify-placeholder-assets.mjs`

### 4b. User says no

Append `{ "id": "<id>", "reason": "…" }` to `memory.json` → `excluded`.

## /loop

```text
/loop 2m Read AGENTS_LOOP-Scan-Placeholder-Assets.md and execute one tick. Stop on STOP_* labels.
```

```text
@scan-placeholder-assets Scan for challenge/quiz media placeholder gaps.
```
