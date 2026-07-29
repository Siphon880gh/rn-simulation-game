# Challenges — authoring map

Perform mini-games live here. **Edit `config.js` in the challenge folder** to change content.
Leave `challenge.js` alone unless you are changing interaction logic.

Test spawn (`Test` flask control) groups these as **Skills** and **Emergencies** (not “Challenges”).

## Folder taxonomy

| Category | Path | Test spawn group | Role |
|----------|------|------------------|------|
| **Skills** | `skills/<id>/` | Skills | Perform / practice skill-checks |
| **Emergencies** | `emergencies/<id>/` | Emergencies | Escalation responses (not every Perform) |
| **Shared** | `shared/` | — | Chrome copy shared by all |

## Skills (author here)

| Challenge | Configure | Runtime |
|-----------|-----------|---------|
| IVPB hang | [`skills/ivpb-hang/config.js`](skills/ivpb-hang/config.js) | `skills/ivpb-hang/challenge.js` |
| Med identity | [`skills/med-identity/config.js`](skills/med-identity/config.js) | `skills/med-identity/challenge.js` |
| Bed prep | [`skills/bed-prep/config.js`](skills/bed-prep/config.js) | `skills/bed-prep/challenge.js` |
| Accucheck | (task attrs + logic) | `skills/accucheck/challenge.js` |
| IV check / titration | (task attrs + `GameConfig` IV) | `skills/iv-check/challenge.js` |
| Admission quizzes | `GameConfig.admission` + quiz builder | `skills/admission/challenge.js` |

## Emergencies (author here)

| Challenge | Configure | Runtime |
|-----------|-----------|---------|
| Code Blue | [`emergencies/code-blue/config.js`](emergencies/code-blue/config.js) | `emergencies/code-blue/challenge.js` |

## Shared

| File | Purpose |
|------|---------|
| [`shared/copy-config.js`](shared/copy-config.js) | Pause banner / pass feedback |
| [`challenge-gate.js`](challenge-gate.js) | Modal + timer pause + routing |
| [`registry.js`](registry.js) | Kind → path / category index |
| [`test-spawn.js`](test-spawn.js) | Test flask Skills/Emergencies menu + stub tasks |

Add a Test spawn row: set `testSpawnKind` on the registry entry (and a stub in `test-spawn.js` if needed). Extra IV / admission rows live in `EXTRA_SKILL_SPAWNS` inside `test-spawn.js`.

## Wiring notes

- `GameConfig` re-exports the same config objects (`ivpbHangChallenge`, `codeBlueChallenge`, …) for existing callers and AUTO scripts.
- Patient HTML still selects types with `data-challenge="ivpb"` (etc.).
- Code Blue is opened from deterioration / Test spawn, not from every med Perform.
