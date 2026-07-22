# AGENTS_CODE_REFERENCE-patients.md

Patient census / clinical panels subsystem for AI assistants.

**Approximate location cues are intentional.** Exact line numbers drift.

Parent: [`AGENTS_CODE_REFERENCE.md`](AGENTS_CODE_REFERENCE.md)

---

## Role

Load fictional patient “content packs” (HTML + optional past-hx JSON), register into state, extract tasks, render panels into `#patients`, wire collapsibles, med interactions, and lazy TimelineJS chart history.

| File | ~Lines | Role |
|------|--------|------|
| `game/assets/js/patients.js` | ~280 | Config map, fetch, extract, render, status sync, past hx wire-up |
| `game/assets/js/past-hx-timeline.js` | ~90 | `pastHx[]` → TimelineJS adapter; lazy init |
| `game/events/patients/joe.html` | ~120 | Sample panel: vitals, tasks, meds, past hx mount |
| `game/events/patients/joe-past-hx.json` | ~30 | Authored past hx events for Joe |
| `game/assets/css/patients.css` | ~20 | Med opacity + past-hx timeline sizing |
| `game/assets/js/game-state.js` | — | `REGISTER_PATIENT`, `SET_ACTIVE_PATIENT`, `patients` Map |

**Library stamp:** `decisions.timeline_library` = `timelinejs` (Knight Lab CDN in `game/index.html`).

---

## Config map

Near top of `patients.js`, `patientConfigs`:

```js
// Six census packs (E2.M3): joe, maria, derek, aisha, robert, lin
joe: { id, name, room, htmlFile, pastHxFile }
```

Adding a patient = new config entry + HTML under `game/events/patients/` (+ optional `*-past-hx.json`). MVP census size is **4–6** (currently 6).

**E4.M1 packs:** `game/events/scenarios/*.json` lists patient ids + optional `disclaimer` / `learningObjectives`. `ScenarioPackModule` loads before `patients.init()`; census order follows pack `patients[]`. Shell `#fiction-disclaimer` is not replaced by pack text.

**E9 census hold / admit:** Landing choice → `?census=` omitted/`full` (full load), `minus1` (N−1, no admit), `admitStart` / `admitMiddle` (hold last pack patient + spawn in that band). Legacy `openAdmit` still randomizes start/middle/near-end. Spawn via `admission-system.js`; new patient gets `admissionPhase: 'admitting'` (left-tab **Admitting** badge) + config-driven checklist.

**E2.M2 swap:** All packs mount under `#patients` as `.patient-panel-host`. `#patient-tabs` + Global tab drive `SET_ACTIVE_PATIENT` / `panelMode`; CSS opacity/translate transitions; task DOM stays mounted (census-aware).

---

## Init pipeline (`init` near bottom of public API section)

For each config:

1. `fetch(htmlFile)` → HTML string  
2. Optional `loadPastHxPack(pastHxFile)`  
3. `extractTasksFromHTML` — `DOMParser`, query `[data-task-type]`  
4. `REGISTER_PATIENT` + `SET_ACTIVE_PATIENT`  
5. `taskSystem.createTask` per extracted task  
6. `renderPatient` — append under `#patients` with `data-patient-id`  
7. `setupPatientInteractions` — collapsibles; past-hx toggle lazy-inits TimelineJS via `ensurePastHxTimeline`  

Subscribe to `currentTime`: `updatePatientTaskStatuses` syncs DOM `data-status` / `task-status-*` from `gameState.tasks`.

---

## Panel content shape (`joe.html`)

- Header: name + room  
- Static vitals grid  
- Collapsible **Tasks**  
- Collapsible **Medications** — scheduled `data-task-type="med"` rows  
- Collapsible **Chart history (past hx)** — `[data-past-hx-mount]` host for TimelineJS  

Only elements with `data-task-type` enter the task system.

---

## Safe-edit notes

- Paths in `htmlFile` / `pastHxFile` are relative to `game/`.  
- Lazy-init timeline on first open of past hx (do not construct TL while panel is `hidden`).  
- Multi-patient census layout is planned (E2.M3); panel swap is E2.M2.  
- Fictional names only; keep disclaimer language if adding player-facing copy.  
- Do not swap away from TimelineJS without user approval.
