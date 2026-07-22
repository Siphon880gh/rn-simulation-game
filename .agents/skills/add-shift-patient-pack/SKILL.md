---
name: add-shift-patient-pack
description: >-
  Interviews for day vs night shift and unit (ICU, Med-Surg, Tele), then authors
  a condition-aware patient assignment pack for that shift. Use when adding
  patients to a shift, creating/updating scenario packs, building census
  assignments, or when the user mentions day shift, night shift, unit pack,
  or patient assignments.
---

# Add shift patient pack

Author **fictional** patient assignment packs where **each patient's conditions drive their tasks** (meds, assessments, Q2H turns, IVs, events)—not a generic identical census.

## When to use

- User wants to add patients to a day or night shift
- User wants a new or expanded pack for ICU / Med-Surg / Tele
- User asks for patient assignments keyed to diagnoses / mobility / acuity

## Hard rules

1. **Ask before inventing** — if shift and/or unit are missing, stop and ask (see Interview).
2. **Condition → tasks** — every patient must have tasks justified by diagnosis, mobility, acuity, or unit norms. Do not clone the same med list onto every patient.
3. **Fictional only** — names, orders, events are educational fiction; keep disclaimer language.
4. **Declarative content** — prefer `game/events/patients/*.html` + `game/events/scenarios/*.json` + `patients.js` config; do not reintroduce liveQuery task loops.
5. **Read maps first** — `AGENTS_CODE_REFERENCE-patients.md`, `AGENTS_CODE_REFERENCE-tasks.md`, then [reference.md](reference.md).

---

## Interview (required gate)

If the user has **not** already stated both answers, ask clearly (one short message):

1. **Shift:** day or night?
2. **Unit:** ICU, Med-Surg, or Telemetry?

Optional follow-ups (only if still ambiguous):

3. **Mode:** new pack file vs extend an existing pack?
4. **Census size:** default by unit (see [reference.md](reference.md)) or custom?
5. **Reuse:** reuse existing patient ids (`joe`, `maria`, …) and/or author new packs?

**Do not** create files until shift + unit are known.

Defaults when user says “use defaults”:

| Unit | Census | Night pack seed | Day pack seed |
|------|--------|-----------------|---------------|
| Tele | 4 | `tele-4.json` | new `day-shift-tele-4.json` (or extend if present) |
| Med-Surg | 5 | `medsurg-5.json` / `night-shift-default.json` | `day-shift-medsurg.json` |
| ICU | 2 | `icu-2.json` | new `day-shift-icu-2.json` (or extend if present) |

Night default start: `1900`. Day default start: `0700` (`shiftStart` + URL `shift-starts` when needed).

---

## Milestones (track every run)

Copy into the reply (or `.agents/skills/add-shift-patient-pack/progress.json`) and update as you go:

```text
[ ] M0 Interview — shift + unit locked
[ ] M1 Pack plan — census ids, diagnoses, condition→task map
[ ] M2 Patient content — HTML (+ past-hx) + patients.js entries
[ ] M3 Scenario pack — JSON patients[] / events / orderInjections / scene
[ ] M4 Wire entry — landing tile and/or demo URL if this is a primary pack
[ ] M5 Verify — JSON parse + ids resolve + condition tasks present
```

Full checklist: [milestones.md](milestones.md).

### Loop (multi-patient authoring)

When M2 has **2+ new or heavily edited patients**, use `/loop` so each tick finishes **one patient** then advances:

```text
/loop 2m Continue add-shift-patient-pack: next unfinished patient in M2 for <shift> <unit>; update progress; stop when M2–M5 done or blocked waiting user
```

On each tick: read progress → author/fix one patient → mark done → only then touch the scenario JSON (M3) once the census list is stable.

Stop the loop when M5 passes or status is blocked on a user question.

---

## Workflow

### M0 — Interview

Lock `shift` ∈ {day, night} and `unit` ∈ {icu, medsurg, tele}. Confirm pack id / filename with user if replacing a shipped pack.

### M1 — Pack plan (condition awareness)

For each census slot, write a one-line **condition → tasks** plan before editing files:

| Patient id | Diagnosis / acuity | Tasks that must exist | Why |
|------------|--------------------|------------------------|-----|
| example | stroke + bedbound | Q2H turns, neuro checks | cannot self-turn; neuro risk |
| example | NSTEMI rule-out | ASA/heparin windows; tele checks | cardiac unit norms |

**Condition cues (non-exhaustive):**

| Condition | Typical tasks |
|-----------|----------------|
| Obesity / bedbound / stroke weakness / post-op immobility | `careSchedules: ['turnQ2h']` + `data-care-schedule="turn-q2h"` + reason |
| Diabetes / DKA | Accucheck / insulin IV check challenges |
| Tele / arrhythmia risk | Rhythm/bedside assessment events |
| ICU / sepsis / pressors | Higher `patientOverrides` acuity; escalate assessments |
| Post-op | Pain/VTE meds; mobility limits |

Reuse existing patients when their diagnosis already fits the unit story; author new ids only when the census needs a new clinical profile.

### M2 — Patient content

Per patient:

1. `game/events/patients/<id>.html` — demographics, vitals, meds/tasks with `data-task-type`, `data-scheduled`, `data-expire`, `data-duration-mins`.
2. Optional `game/events/patients/<id>-past-hx.json`.
3. `patientConfigs` entry in `game/assets/js/patients.js` (id, diagnosis, htmlFile, pastHxFile, careSchedules/careReason when indicated).
4. Align med times to **shift start** (day vs night)—do not leave night-only `1900` windows on a day pack without retiming.

### M3 — Scenario pack

Create or update `game/events/scenarios/<pack-id>.json`:

- `id`, `title`, `department`, `patients[]`
- Day: `shiftStart: 700`, `shiftDurationHours: 12`
- `scene.theme` matches unit (`icu` | `medsurg` | `tele`)
- ICU: `patientOverrides` with elevated acuity where teaching needs it
- Thin `orderInjections` / `events` that reference **only** patients in `patients[]`
- `fictionalOnly: true` + disclaimer + learning objectives

Schema details: [reference.md](reference.md).

### M4 — Wire entry

- Primary unit tile: update `index.html` `data-href` / census hint if this pack replaces the unit default.
- Day/night demo links: `game/index.html` and/or `README.md` preset table when useful.
- Do **not** silently overwrite the other shift’s pack.

### M5 — Verify

AUTO checks (run these):

1. `JSON.parse` the scenario file.
2. Every `patients[]` id exists in `patients.js` `patientConfigs`.
3. Every `patientId` in events/orderInjections is in `patients[]`.
4. High-risk mobility patients have turn-q2h opt-in (config and/or HTML attr).
5. Scheduled times fit the shift (day ≈ 0700–1900 band; night ≈ 1900–0700 band).

HUMAN_REQUIRED only for subjective clinical teaching tone.

---

## Report format

```markdown
### Shift pack
- **Shift:** day | night
- **Unit:** icu | medsurg | tele
- **Pack file:** game/events/scenarios/<id>.json
- **Census:** [ids…]
- **Condition highlights:** 1 line per patient (why their tasks differ)
- **Milestones:** M0–M5 status
- **Verify:** PASS/FAIL (+ command)
```

## Additional resources

- [reference.md](reference.md) — schemas, census defaults, file paths
- [milestones.md](milestones.md) — detailed milestone checklist
- Repo maps: `AGENTS_CODE_REFERENCE-patients.md`, `AGENTS_CODE_REFERENCE-tasks.md`
