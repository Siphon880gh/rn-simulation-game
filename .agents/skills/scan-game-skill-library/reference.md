# Skill library reference

## `library.json` schema

```json
{
  "version": 1,
  "skills": [
    {
      "id": "icp",
      "label": "ICP monitoring",
      "aliases": ["intracranial pressure", "ICP"],
      "tags": ["neuro", "icu"],
      "blurb": "Short player-facing description.",
      "games": ["icp"],
      "status": "active"
    }
  ]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | Stable slug; URL `skill=` value |
| `label` | yes | Search + list title |
| `aliases` | no | Extra search tokens |
| `tags` | no | Filter / search |
| `blurb` | no | Landing hint |
| `games` | yes | Challenge spawn kinds; app picks **one** at random |
| `status` | no | `active` (default) \| `planned` (listed but no launch if `games` empty) |
| `unitHint` | for skill practice | `icu` \| `medsurg` \| `tele` — landing pack choice |
| `pack` | for skill practice | Scenario path under `game/` (e.g. `events/scenarios/skill-icp-icu.json`) |
| `packs` | optional | Multiple scenario paths; landing picks one at random for Start shift (e.g. medsurg + tele) |
| `patients` | for skill practice | Patient ids that require this skill (must match `patientConfigs.skills`) |

Player rules: **exactly one** skill may be selected on the Skills start path (not after department). Landing prefers library `pack` / `unitHint` when set; otherwise falls back to a random unit. The game module picks one entry from `games[]` and focuses an associated patient when tagged.

Patient coverage workflow: [`ensure-skill-patients`](../ensure-skill-patients/SKILL.md).

## Scan sources

1. Folders: `game/assets/js/challenges/skills/<id>/`
2. Registry: `CHALLENGE_REGISTRY` entries with `category: 'skills'`
3. Candidate seeds (below) — nursing skills not yet implemented

Skip any id in `library.json` or `memory.json` → `excluded`.

## Candidate seeds

Propose when missing from the library and not excluded. Prefer mapping `games` to an existing challenge kind. For new library skills without a dedicated mini-game, use `games: ["skill-mcq"]` and add a question bank under `challenges/skills/skill-mcq/config.js` keyed by skill id. Only use `status: "planned"` with `games: []` when content is intentionally unavailable.

| id | label | Suggested games |
|----|-------|-----------------|
| `icp` | ICP monitoring | `icp` |
| `neuro-checks` | Neuro checks | `icp` |
| `seizure-precautions` | Seizure precautions | *(planned)* |
| `stroke-assessment` | Stroke assessment | *(planned)* |
| `chest-tube` | Chest tube care | *(planned)* |
| `trach-care` | Trach care | *(planned)* |
| `oxygen-therapy` | Oxygen therapy | *(planned)* |
| `ventilator-basics` | Ventilator basics | *(planned)* |
| `blood-transfusion` | Blood transfusion | *(planned)* |
| `wound-vac` | Wound vac | *(planned)* |
| `wound-care` | Wound care / dressing | *(planned)* |
| `pressure-injury` | Pressure injury prevention | *(planned)* |
| `pca-pump` | PCA pump | *(planned)* |
| `pain-assessment` | Pain assessment | *(planned)* |
| `foley-care` | Foley / catheter care | *(planned)* |
| `ng-tube` | NG tube | *(planned)* |
| `ostomy-care` | Ostomy care | *(planned)* |
| `central-line` | Central line care | *(planned)* |
| `isolation-ppe` | Isolation / PPE | *(planned)* |
| `hand-hygiene` | Hand hygiene | *(planned)* |
| `fall-precautions` | Fall precautions | *(planned)* |
| `sepsis-recognition` | Sepsis recognition | *(planned)* |
| `code-blue-response` | Code Blue response | `code-blue` |
| `sbar` | SBAR communication | *(planned)* |
| `ecg-basics` | ECG / telemetry basics | *(planned)* |
| `dvt-prophylaxis` | DVT prophylaxis | *(planned)* |
| `fluid-balance` | Fluid balance / I&O | *(planned)* |
| `dialysis-access` | Dialysis access care | *(planned)* |
| `suicide-precautions` | Suicide precautions | *(planned)* |
| `restraint-safety` | Restraint safety | *(planned)* |
| `medication-rights` | Medication rights | `med-identity` |
| `critical-labs` | Critical lab response | *(planned)* |

Existing challenge folders / registry skills should be proposed with `games: [<same id or testSpawnKind>]` when not yet in the library.

**Bulk add:** if the user says add every / all possible skills, add all missing seeds + challenge folders in one pass (skip per-id confirm). Still honor `memory.json` exclusions.

## Game wiring

- Landing: `assets/js/landing-skill.js` + skill dialog on `index.html`
- Boot: URL `skill=` → `game/assets/js/skill-focus.js` loads library, picks a game, opens challenge gate
- Config: `GameConfig.urlParams.skill` / `skillLibraryUrl`
