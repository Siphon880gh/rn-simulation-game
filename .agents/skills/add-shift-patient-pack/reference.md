# Shift patient pack — reference

Read from [SKILL.md](SKILL.md) only when authoring packs.

## Existing scenario packs

| File | Unit | Shift | Census |
|------|------|-------|--------|
| `game/events/scenarios/tele-4.json` | tele | night-style (default 1900) | 4 |
| `game/events/scenarios/medsurg-5.json` | medsurg | night-style | 5 |
| `game/events/scenarios/icu-2.json` | icu | night-style | 2 |
| `game/events/scenarios/night-shift-default.json` | medsurg | night | 6 |
| `game/events/scenarios/day-shift-medsurg.json` | medsurg | day (`shiftStart: 700`) | 6 |

Landing tiles (`index.html`) point at tele-4 / medsurg-5 / icu-2.

## Unit census defaults

| Unit | `department` | `scene.theme` | Default N | Notes |
|------|--------------|---------------|-----------|-------|
| Telemetry | `tele` | `tele` | 4 | Rhythm alarms; cardiac-leaning diagnoses |
| Med-Surg | `medsurg` | `medsurg` | 5 | Floor meds + assessments; last id often admit-hold |
| ICU | `icu` | `icu` | 2 | Use `patientOverrides` acuity; denser emergencies |

## Shift timing

| Shift | Typical `shiftStart` | Game window | Med/task authoring |
|-------|----------------------|-------------|--------------------|
| Night | omit or `1900` | 1900 → 0700 | Existing night packs |
| Day | `700` | 0700 → 1900 | Retimed meds; see `day-shift-medsurg.json` |

URL override: `game/index.html?scenario=events/scenarios/<file>.json&shift-starts=0700` (day demos).

## Scenario JSON shape

```json
{
  "id": "day-shift-tele-4",
  "title": "Day Shift — Telemetry",
  "version": 1,
  "department": "tele",
  "shiftStart": 700,
  "shiftDurationHours": 12,
  "fictionalOnly": true,
  "disclaimer": "All patients, orders, and events in this pack are fictional and for educational practice only.",
  "learningObjectives": ["…"],
  "patients": ["id1", "id2"],
  "patientOverrides": {
    "id1": { "clinicalStatus": "watch", "acuityScore": 2 }
  },
  "scene": {
    "theme": "tele",
    "unitBackground": null,
    "situationStills": { "code-blue": null, "bed-prep": null }
  },
  "incidentPackUrl": "events/incidents/chaos-night-medsurg.json",
  "orderInjections": {
    "0700": [],
    "default": []
  },
  "events": []
}
```

- `orderInjections` keys are hour starts as strings matching pack hours (`"1900"` night / `"0700"` day).
- Event `at` and task `scheduled` use military HHMM integers.
- `injectTasks[].patientId` must be in `patients[]`.

## Patient pack files

| Artifact | Path |
|----------|------|
| Panel HTML | `game/events/patients/<id>.html` |
| Past hx | `game/events/patients/<id>-past-hx.json` |
| Registry | `game/assets/js/patients.js` → `patientConfigs.<id>` |

### HTML task attrs

- `data-task-type`: `med` | `assessment` | `iv` | `bedprep` | …
- `data-scheduled` / `data-expire` / `data-duration-mins` / `data-status="not-yet"`
- Optional `data-challenge` (e.g. `accucheck`, `ivpb`, `med-identity`)
- Optional med route for queue thumbs: `data-route="po|sq|im|ivpb|iv-push"` (alias `data-med-form`) and/or `data-task-kind="med-pills|med-shot|med-ivpb|med-iv-push"`
- Care schedule: on `.patient` root — `data-care-schedule="turn-q2h"` + `data-care-reason="…"`

### Config care schedules

```js
careSchedules: ['turnQ2h'],
careReason: 'BMI 38; cannot self-reposition'
```

Config lives in `GameConfig.careSchedules.turnQ2h` (120 min interval from shift start).

### Skill association (skill-driven packs)

```js
skills: ['icp', 'neuro-checks'], // library skill ids this patient requires
```

Used by `ensure-skill-patients` audit + `skill-focus.js` to focus the matching census patient. Pack naming: `skill-<skillId>-<unit>.json` (see [ensure-skill-patients/reference.md](../ensure-skill-patients/reference.md)).

## Condition → task cheat sheet

| Signal in chart | Prefer |
|-----------------|--------|
| BMI ≥ 35, bedbound, CVA/hemiparesis, dense weakness, immobility | Q2H turns |
| Insulin / DKA | Accucheck + IV insulin rate check |
| NSTEMI / tele | ASA/heparin windows; PVC/rhythm events |
| Sepsis / pressors | IV drips panel; escalate assessments; higher acuity override |
| Fresh post-op | Pain meds, VTE prophylaxis, mobility limits ± turns |
| New admit (last census id) | Often held for E9 admit flow — keep last pack id as admit candidate |

## Wiring landing / demos

- Unit default: `index.html` button `data-href="game/index.html?speed-factor=48&scenario=events/scenarios/<file>.json"` + `data-census-full`.
- Demo presets: `README.md` table; optional links in `game/index.html`.
- `GameConfig.scenario.demoLinks` if present — keep in sync when editing demos.

## AUTO verify sketch

```bash
node --input-type=module -e "
import fs from 'fs';
const packPath = 'game/events/scenarios/<file>.json';
const pack = JSON.parse(fs.readFileSync(packPath, 'utf8'));
const js = fs.readFileSync('game/assets/js/patients.js', 'utf8');
for (const id of pack.patients) {
  if (!js.includes(\"id: '\" + id + \"'\")) throw new Error('missing config ' + id);
}
console.log('PASS', pack.id, pack.patients);
"
```
