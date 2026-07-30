# Ensure skill patients — reference

## Unit routing

Use library `unitHint` when set. Otherwise derive from skill `id` / `tags`:

| Signal | `unitHint` |
|--------|------------|
| `icu`, `neuro`, `icp`, `ventilator`, `central-line`, `code-blue`, `pressor`, `trach` | `icu` |
| `tele`, `ecg`, `cardiac`, `rhythm`, `nstemi` | `tele` |
| everything else (meds, admission, wound, fall, SBAR, …) | `medsurg` |

## Pack naming

Preferred new pack (skill practice):

```text
game/events/scenarios/skill-<skillId>-<unit>.json
```

Examples: `skill-icp-icu.json`, `skill-chest-tube-medsurg.json`.

`library.json` → `pack` is relative to `game/` (same style as landing `scenario=`):

```text
events/scenarios/skill-icp-icu.json
```

## Association fields

### `patientConfigs.<id>` (`patients.js`)

```js
{
  id: 'pat-icp-1',
  diagnosis: 'ICH with EVD / ICP monitoring',
  skills: ['icp', 'neuro-checks'],  // required for coverage
  // …
}
```

### Library skill row

```json
{
  "id": "icp",
  "games": ["icp"],
  "unitHint": "icu",
  "pack": "events/scenarios/skill-icp-icu.json",
  "patients": ["pat-icp-1"]
}
```

Landing skill start must prefer `pack` (then `unitHint` default unit file) over a random unit.

## Condition → skill task cues

| Skill / games | Patient must show |
|---------------|-------------------|
| `icp` / neuro | Neuro diagnosis; ICP-related assessment or `data-challenge` path |
| `ivpb-hang` | IVPB med with `data-challenge="ivpb"` |
| `med-identity` / `medication-rights` | Med task that opens med-identity |
| `bed-prep` / `admission` | Admission / bed-prep tasks |
| `accucheck` | Accucheck / insulin sliding-scale task |
| `iv-check` / heparin / titration | IV drip metadata |
| `code-blue` | High acuity / deterioration-ready ICU or floor crash risk |
| `skill-mcq` banks | Diagnosis + assessment task whose teaching matches the MCQ topic |

## Audit script

```bash
node .agents/skills/ensure-skill-patients/scripts/audit.mjs
node .agents/skills/ensure-skill-patients/scripts/audit.mjs --skill=icp
node .agents/skills/ensure-skill-patients/scripts/audit.mjs --write-progress
```

Exit code `0` if every playable skill is covered; `1` if any uncovered.

## progress.json

```json
{
  "skill": "ensure-skill-patients",
  "shiftDefault": "night",
  "milestone": "S2",
  "skills": [
    {
      "id": "icp",
      "status": "uncovered",
      "unitHint": "icu",
      "patientId": null,
      "packFile": null,
      "notes": ""
    }
  ],
  "blocked": null,
  "updatedAt": "ISO-8601"
}
```

Statuses: `uncovered` | `pending` | `covered` | `deferred` | `blocked`.
