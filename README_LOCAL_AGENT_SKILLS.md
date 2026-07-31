# Local agent skills

Project skills live under [`.agents/skills/`](.agents/skills/). They teach the Cursor agent repo-specific workflows (shift packs, skill library, patient coverage, RN game architecture). This is separate from Cursor’s built-in skills under `~/.cursor/skills-cursor/`.

## How to invoke

| Method | When | Example |
|--------|------|---------|
| **@ skill** | Explicitly attach a skill in chat | `@ensure-skill-patients` then describe the task |
| **Natural language** | Description triggers match | “Add a day-shift ICU patient pack” |
| **`/loop …`** | Recurring ticks (one item per wake) | See scenarios below |
| **Direct path** | Point at `SKILL.md` | “Follow `.agents/skills/scan-game-skill-library/SKILL.md`” |

Prefer **@ skill** or a pasted `/loop` prompt when you want a specific workflow. For multi-step queues, use `/loop` so each tick finishes one unit of work.

---

## Skill map

| Skill | Path | Role |
|-------|------|------|
| **add-shift-patient-pack** | [`.agents/skills/add-shift-patient-pack/`](.agents/skills/add-shift-patient-pack/) | Author day/night unit census packs (condition → tasks) |
| **scan-game-skill-library** | [`.agents/skills/scan-game-skill-library/`](.agents/skills/scan-game-skill-library/) | Propose new landing skill-library entries; confirm; exclude on “no” |
| **ensure-skill-patients** | [`.agents/skills/ensure-skill-patients/`](.agents/skills/ensure-skill-patients/) | Every library skill has a tagged patient + pack; author gaps via add-shift-patient-pack |
| **game-development-sickn33-rn** | [`.agents/skills/game-development-sickn33-rn/`](.agents/skills/game-development-sickn33-rn/) | Orchestrator for RN shift-sim / engine fit / guest mini-games (sub-skills below) |
| **replace-placeholder-assets** | [`.agents/skills/replace-placeholder-assets/`](.agents/skills/replace-placeholder-assets/) | Swap titled image/video placeholders for real files (`PLACEHOLDER_ASSETS.md`) |
| **scan-placeholder-assets** | [`.agents/skills/scan-placeholder-assets/`](.agents/skills/scan-placeholder-assets/) | Find UI/game spots needing image/video placeholders; propose with dimensions + fun-medical style |

### Sub-skills (game-development-sickn33-rn)

Routed by the orchestrator; @ them when you already know the lane:

| Sub-skill | Use for |
|-----------|---------|
| `shift-simulation` | Clock, panels, slots, windows, scenario drip, debrief |
| `web-games` | Browser shell + guest challenge patterns |
| `2d-games` | Canvas / sprite guest challenges |
| `engine-selection` | Runtime / engine fit (honor locked vanilla shell) |
| `game-design` | Loop, prioritization, teaching debrief |
| `game-art` / `game-audio` | Visual / audio passes |
| `mobile-games` / `pc-games` / `3d-games` / `vr-ar` / `multiplayer` | Usually **out of MVP** unless explicitly approved |

---

## Scenarios

### 1. New or expanded shift census (day/night × unit)

**Need:** Patients whose diagnoses drive distinct tasks; scenario JSON + landing/demo wiring.

**Skill:** `add-shift-patient-pack`

**Invoke:**

```text
@add-shift-patient-pack Add a night ICU pack (or: day Med-Surg, Tele, …).
```

If shift/unit are unknown, the skill interviews first. For many new patients:

```text
/loop 2m Continue add-shift-patient-pack: next unfinished patient in M2 for <shift> <unit>; update progress; stop when M2–M5 done or blocked waiting user
```

---

### 2. Add clinical skills to the landing skill library

**Need:** New searchable skills (e.g. ICP) with `games[]`; user confirms each add; declines go to memory.

**Skill:** `scan-game-skill-library`

**Invoke:**

```text
@scan-game-skill-library Scan for new skills to add to the game library.
```

Or bulk (after explicit user OK):

```text
@scan-game-skill-library Add every skill that's possible.
```

Declined ids are stored in [`.agents/skills/scan-game-skill-library/memory.json`](.agents/skills/scan-game-skill-library/memory.json) and must not be re-proposed.

---

### 3. Skill practice needs a real patient (coverage gaps)

**Need:** Each playable library skill has a patient with `skills: ['…']`, a pack that includes them, and library `patients` / `unitHint` / `pack`.

**Skill:** `ensure-skill-patients` (calls `add-shift-patient-pack` in skill-driven mode)

**Audit first:**

```bash
node .agents/skills/ensure-skill-patients/scripts/audit.mjs --write-progress
```

**Invoke loop:**

```text
/loop 2m Continue ensure-skill-patients: next uncovered skill in progress.json; author via add-shift-patient-pack; update progress; stop when queue empty or blocked_waiting_user
```

**Single skill:**

```text
@ensure-skill-patients Cover skill icp — create ICU patient + pack if missing.
```

---

### 4. Skill library + patients end-to-end

**Need:** New skill in the library **and** a patient who requires it.

**Order:**

1. `@scan-game-skill-library` — confirm/add the skill (+ MCQ bank / challenge if needed).
2. `@ensure-skill-patients` (or `/loop` above) — author patient + pack and stamp library fields.

Do not treat a skill as practice-ready until the ensure-skill-patients audit reports it **covered**.

---

### 5. Engine / runtime / architecture (E0.M3, guest mini-games)

**Need:** Choose or defend a runtime; keep panels-first vanilla shell; add a perform challenge without replacing the app.

**Skill:** `game-development-sickn33-rn` (+ `engine-selection` / `web-games` / `2d-games` / `shift-simulation`)

**Invoke:**

```text
@game-development-sickn33-rn How should we implement this challenge? (honor keep_modular_app)
```

```text
@shift-simulation Wire availability windows for this task type.
```

Honor `.agents/state.json` → `decisions.main_constraints` and `AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md`. No React/Ink/Twine/Phaser-as-shell without explicit approval.

---

### 6. Find or replace image/video placeholders

**Need (scan):** Surfaces that should show media but have no catalog mount yet (challenges, landing, situations, slots).

**Skill:** `scan-placeholder-assets` — proposes ids with **subject + Dimensions (w×h) + Style (fun medical simulation)**; confirm before wiring.

```text
@scan-placeholder-assets Scan for challenge/quiz media placeholder gaps.
```

```text
/loop 2m Read AGENTS_LOOP-Scan-Placeholder-Assets.md and execute one tick. Stop on STOP_* labels.
```

**AUTO audit:** `node .agents/skills/scan-placeholder-assets/scripts/audit.mjs`

**Need (replace):** Final stills/clips for existing catalog ids.

**Skill:** `replace-placeholder-assets`

**Inventory:** [`PLACEHOLDER_ASSETS.md`](PLACEHOLDER_ASSETS.md) · catalog [`game/assets/js/media-placeholder-catalog.json`](game/assets/js/media-placeholder-catalog.json)

**PHP placeholders (no build):** [`placeholders/`](placeholders/) — `image.php?title=&prompt=`, `video.php`, partial `ph_media_tag()`. Tags expose `data-asset-prompt` (subject → dimensions → style).

**Invoke replace:**

```text
@replace-placeholder-assets Replace dept-icu with the attached image.
```

```text
/loop 2m Read AGENTS_LOOP-Replace-Placeholder-Assets.md and execute one tick. Stop on STOP_* labels.
```

**AUTO:** `node scripts/verify-placeholder-assets.mjs`

---

### 7. Milestone continue (product backlog)

**Need:** Advance `EPIC_MAP` / `IMPLEMENTATION_STORIES` / `.agents/state.json` — not a local content skill.

**Use:** [`AGENTS_LOOP-Continue-Milestone.md`](AGENTS_LOOP-Continue-Milestone.md) and `AGENTS.md` continue rules — not the content skills above, unless the milestone itself is pack/skill work.

```text
/loop Continue next milestone per AGENTS-MILESTONES-TURNS.md
```

---

### 8. Stop a content `/loop`

Say **stop** (or abort the loop terminals). For ensure-skill-patients / add-shift-patient-pack, also leave `progress.json` as-is so the next run can resume.

---

## Quick decision tree

```text
Adding patients to a unit shift?
  → add-shift-patient-pack

Adding options to the landing skill search?
  → scan-game-skill-library

Skill opens a game but no patient “needs” it?
  → ensure-skill-patients

New skill + patient together?
  → scan-game-skill-library, then ensure-skill-patients

Clock / slots / panels / challenge runtime?
  → game-development-sickn33-rn (+ shift-simulation / web-games / …)

Looking for places that need image/video placeholders?
  → scan-placeholder-assets (dimensions + fun-medical style in prompts)

Supplying final images/videos for titled placeholders?
  → replace-placeholder-assets (+ PLACEHOLDER_ASSETS.md)

Advancing MVP milestones?
  → AGENTS continue / milestone loop (not these content skills)
```

---

## Related repo docs

| Doc | Role |
|-----|------|
| [`AGENTS.md`](AGENTS.md) | Agent entry, maps, continue rules |
| [`AGENTS_LOOP-Continue-Milestone.md`](AGENTS_LOOP-Continue-Milestone.md) | Milestone `/loop` |
| [`AGENTS_LOOP-Replace-Placeholder-Assets.md`](AGENTS_LOOP-Replace-Placeholder-Assets.md) | Replace placeholder media `/loop` |
| [`AGENTS_LOOP-Scan-Placeholder-Assets.md`](AGENTS_LOOP-Scan-Placeholder-Assets.md) | Scan for new placeholder mounts `/loop` |
| [`PLACEHOLDER_ASSETS.md`](PLACEHOLDER_ASSETS.md) | Placeholder inventory for art handoff |
| [`game/events/skills/library.json`](game/events/skills/library.json) | Player-facing skill catalog |
| [`game/assets/js/challenges/README.md`](game/assets/js/challenges/README.md) | Challenge authoring map |
