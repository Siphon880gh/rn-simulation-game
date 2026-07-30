---
name: scan-game-skill-library
description: >-
  Scans for new clinical skills to add to the RN Simulation skill library
  (landing search → one skill → assigned mini-game). Use when adding skills to
  game options, reviewing ICP or other skill candidates, syncing
  challenges/skills into the library, or when the user asks to scan/confirm
  new skills.
---

# Scan game skill library

Keep the **player-facing skill library** in sync with challenge folders and candidate nursing skills. On the landing **Skills** path (parallel to department), players pick **exactly one** skill; the app places them on a random unit and assigns a mini-game from that skill’s `games` list. Department starts do **not** open the skill picker.

## Paths

| Artifact | Role |
|----------|------|
| [`game/events/skills/library.json`](../../../game/events/skills/library.json) | Live catalog (search + pick) |
| [`memory.json`](memory.json) | Skills the user **declined** — never re-propose |
| [`reference.md`](reference.md) | Catalog schema + scan sources |
| `game/assets/js/challenges/skills/<id>/` | Implemented skill challenges |
| [`game/assets/js/challenges/registry.js`](../../../game/assets/js/challenges/registry.js) | Challenge kind registry |

## Hard rules

1. **Confirm before adding** — never write a new skill into `library.json` until the user says yes.
2. **One skill at a time** — present candidates one-by-one (or a short numbered list, then wait for yes/no per id).
3. **No means exclude** — if the user declines a candidate, update [`memory.json`](memory.json) immediately and do not propose that id again.
4. **Do not invent games** — only attach `games` entries that exist in the challenge registry / test-spawn kinds, or scaffold a challenge in the same turn when the user approved the skill **and** asked for an implementation.
5. **Declarative** — library is data; landing + `skill-focus.js` consume it. No liveQuery task loops.
6. **Patient coverage** — after adding a playable skill, note that [`ensure-skill-patients`](../ensure-skill-patients/SKILL.md) must associate a patient (`patientConfigs.skills` + library `patients` / `unitHint` / `pack`). Do not claim skill practice is patient-complete until that audit passes.

## Workflow

### 1. Load state

Read in parallel:

- `game/events/skills/library.json` → set of `skills[].id`
- `.agents/skills/scan-game-skill-library/memory.json` → set of `excluded[].id`
- Directory listing of `game/assets/js/challenges/skills/*/`
- Registry keys in `challenges/registry.js` with `category: 'skills'`
- Optional seed list in [reference.md](reference.md) § Candidate seeds

### 2. Build candidates

A candidate is a skill **id** that is:

- present as a challenge folder, registry skill entry, or seed row, **and**
- **not** already in `library.json`, **and**
- **not** in `memory.json` → `excluded`

Normalize ids: lowercase, hyphenated (`icp`, `ivpb-hang`, `med-identity`).

**Skip infrastructure folders** (not player-facing library skills): `skill-mcq` (shared MCQ engine for library banks).

### 3. Ask the user (required gate)

For each candidate (stop after a small batch if many — e.g. 5 per turn):

```text
Add this skill to the game library?

- id: <id>
- label: <human label>
- games: <challenge kinds that would be assigned>
- source: <folder | registry | seed>

Reply yes or no for this skill.
```

**Do not** edit `library.json` until they answer.

### 4a. User says yes

1. Append (or merge) an entry into `library.json` matching the schema in [reference.md](reference.md).
2. If no playable `games` exist yet, either:
   - set `"status": "planned"` and `games: []`, **or**
   - scaffold `challenges/skills/<id>/` + registry + wire when the user wants it playable now.
3. Tell the user the skill is in the library (searchable at landing).

### 4b. User says no

Update `memory.json`:

```json
{
  "excluded": [
    {
      "id": "<id>",
      "label": "<label>",
      "excludedAt": "<ISO-8601>",
      "source": "<folder|registry|seed>"
    }
  ],
  "updatedAt": "<ISO-8601>"
}
```

Merge with existing `excluded` (dedupe by `id`). Do not remove prior exclusions unless the user explicitly reopens an id.

### 5. Verify

- `library.json` parses as JSON
- Every `games[]` id that is not empty resolves to a registry / test-spawn kind **or** the entry is `"status": "planned"`
- Declined ids appear only in `memory.json`, not in the library

## When to run

- User: “scan skills”, “add skill to library”, “new skill options”, “ICP skill”, etc.
- After adding a folder under `challenges/skills/`
- Before a release polish pass on the landing skill picker

## Out of scope

- Ideal Customer Profiles (product ICPs in `EPIC_MAP.md`) — different meaning of “ICP”
- Auto-adding skills without confirmation
- Multi-skill player selection (library UI is single-select only)
