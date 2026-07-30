---
name: ensure-skill-patients
description: >-
  Loops every game skill library entry and checks for an associated patient who
  requires that skill. When missing, authors a unit pack via add-shift-patient-pack
  with at least one patient tagged for the skill. Use with /loop, skill-patient
  coverage, library skill patients, or when skill practice opens on the wrong census.
---

# Ensure skill patients

Every **playable** skill in [`game/events/skills/library.json`](../../../game/events/skills/library.json) must have **at least one associated patient** whose condition requires that skill. Skill practice should land on a pack that includes that patient—not a random first census slot.

## Paths

| Artifact | Role |
|----------|------|
| [`game/events/skills/library.json`](../../../game/events/skills/library.json) | Skills + optional `unitHint` / `pack` / `patients` |
| `game/assets/js/patients.js` → `patientConfigs.<id>.skills` | Canonical association (`skills: ['icp', …]`) |
| [`progress.json`](progress.json) | Loop queue + per-skill status |
| [`reference.md`](reference.md) | Unit routing, association rules, pack naming |
| [`scripts/audit.mjs`](scripts/audit.mjs) | AUTO coverage audit |
| [`../add-shift-patient-pack/SKILL.md`](../add-shift-patient-pack/SKILL.md) | Author packs/patients |
| [`../scan-game-skill-library/SKILL.md`](../scan-game-skill-library/SKILL.md) | Library schema / new skills |

## Association contract (done when)

A skill `id` is **covered** when **all** of:

1. At least one `patientConfigs` entry has `skills` including that `id`.
2. That patient appears in some scenario pack’s `patients[]` (prefer the pack named on the library entry).
3. Library entry has:
   - `patients`: `[ "<patientId>", … ]` (at least one),
   - `unitHint`: `icu` \| `medsurg` \| `tele`,
   - `pack`: scenario path relative to `game/` (e.g. `events/scenarios/skill-icp-icu.json`).
4. Patient content justifies the skill (diagnosis/tasks/`data-challenge` aligned with the skill’s `games[]` — see [reference.md](reference.md)).

Skip infrastructure-only ids (`skill-mcq`) and skills with `status: "hidden"`. Skills with empty `games` and `status: "planned"` may be queued as `deferred` (no patient until playable).

## Hard rules

1. **One skill per loop tick** — finish audit → author → wire → verify for a single skill before advancing.
2. **Use add-shift-patient-pack** for HTML / `patients.js` / scenario JSON (skill-driven mode — see that skill). Do not invent a parallel patient pipeline.
3. **Condition → skill** — the new patient must clinically require the skill; do not slap `skills: [id]` onto an unrelated chart.
4. **Unit fit** — pick unit from library `unitHint` or [reference.md](reference.md) § Unit routing; do not put ICP-only teaching on Tele without a clinical story.
5. **Update library + landing contract** — after authoring, set `patients`, `unitHint`, `pack` on the skill row so landing opens that pack (not a random unit).
6. **Honor exclusions** — never author for ids in `scan-game-skill-library/memory.json` → `excluded` unless the user reopens them.

## /loop

Dynamic or fixed; prefer **one skill per tick**:

```text
/loop 2m Continue ensure-skill-patients: next uncovered skill in progress.json; author via add-shift-patient-pack; update progress; stop when queue empty or blocked_waiting_user
```

On each tick:

1. Read [`progress.json`](progress.json) (create from template if missing).
2. Run `node .agents/skills/ensure-skill-patients/scripts/audit.mjs` (or refresh queue from library).
3. Take the first skill with `status: "uncovered"` (or `pending`).
4. Author patient + pack (add-shift-patient-pack skill-driven mode).
5. Stamp library fields + `patientConfigs.skills`.
6. Re-audit that skill → mark `covered` or `blocked`.
7. Stop when no uncovered skills remain, or user says stop.

## Workflow (single skill)

### S0 — Load queue

- Parse `library.json` skills (skip `hidden`, skip `skill-mcq`).
- Run audit script → write/update `progress.json` → `skills[]`.

### S1 — Pick next uncovered

Report:

```text
Skill patient gap

- id: <id>
- label: <label>
- games: […]
- unitHint: <icu|medsurg|tele>
- action: create patient + pack via add-shift-patient-pack
```

If the user only asked to audit, stop after listing gaps. If they asked to ensure/fix/loop, proceed to S2 without re-asking unit when `unitHint` is known.

### S2 — Author (add-shift-patient-pack, skill-driven)

Invoke [add-shift-patient-pack](../add-shift-patient-pack/SKILL.md) with:

- `mode`: `skill-driven`
- `skillId`, `skillLabel`, `games[]`
- `unit` = `unitHint`
- `shift`: default **night** unless user specified day
- `packFile`: `game/events/scenarios/skill-<skillId>-<unit>.json` (create) **or** extend an existing unit pack when the user asks to keep one census file
- Census: at least **one new patient** who requires the skill (fillers optional; skill practice packs may be smaller than unit default N)

Must produce:

- `game/events/patients/<id>.html` (+ past-hx when useful)
- `patientConfigs.<id>.skills = ['<skillId>', …]`
- Tasks/`data-challenge` that match a game in the skill’s `games[]` when a dedicated challenge exists; for `skill-mcq`, diagnosis + assessment task that teaches that topic
- Scenario JSON including that patient id

### S3 — Wire library

Update the skill row in `library.json`:

```json
{
  "unitHint": "icu",
  "pack": "events/scenarios/skill-icp-icu.json",
  "patients": ["pat-icp-1"]
}
```

### S4 — Verify

```bash
node .agents/skills/ensure-skill-patients/scripts/audit.mjs --skill=<id>
```

PASS when that skill is covered. Update `progress.json`.

## Report format

```markdown
### Skill patients
- **Tick skill:** <id> | covered | blocked
- **Patient:** <id> — <diagnosis>
- **Pack:** game/events/scenarios/<file>.json
- **Unit:** icu | medsurg | tele
- **Queue left:** N uncovered
- **Audit:** PASS/FAIL
```

## When to use

- User: `/loop` ensure skill patients, “skill needs a patient”, “associate patients with skills”
- After bulk-adding library skills
- Before shipping skill-practice landing path

## Out of scope

- Replacing the full unit assignment path
- Auto-adding brand-new library skills (use scan-game-skill-library)
- Implementing brand-new mini-game engines (use challenge authoring / skill-mcq banks)
