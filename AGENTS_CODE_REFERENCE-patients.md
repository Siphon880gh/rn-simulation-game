# AGENTS_CODE_REFERENCE-patients.md

Patient census / clinical panels subsystem for AI assistants.

**Approximate location cues are intentional.** Exact line numbers drift.

Parent: [`AGENTS_CODE_REFERENCE.md`](AGENTS_CODE_REFERENCE.md)

---

## Role

Load fictional patient “content packs” (HTML), register into state, extract tasks, render panels into `#patients`, wire collapsibles and med interactions.

| File | ~Lines | Role |
|------|--------|------|
| `game/assets/js/patients.js` | ~263 | Config map, fetch, extract, render, status sync |
| `game/events/patients/joe.html` | ~109 | Sample panel: vitals, tasks, meds, assessments |
| `game/assets/css/patients.css` | ~3 | Thin patient styles |
| `game/assets/js/game-state.js` | ~173 | `REGISTER_PATIENT`, `patients` Map |

---

## Config map

Near top of `patients.js`, `patientConfigs`:

```js
joe: {
  id: 'joe',
  name: 'Joe Johnson',
  room: 'Room 201-A',
  // vitals object, htmlFile: 'events/patients/joe.html'
}
```

Adding a patient = new config entry + new HTML under `game/events/patients/`.

---

## Init pipeline (`init` near bottom of public API section)

For each config:

1. `fetch(htmlFile)` → HTML string  
2. `extractTasksFromHTML` — `DOMParser`, query `[data-task-type]`, build task data objects  
3. `REGISTER_PATIENT`  
4. `taskSystem.createTask` per extracted task  
5. `renderPatient` — append HTML under `#patients` with `data-patient-id`  
6. `setupPatientInteractions` — replace inline `onclick` collapsibles; ensure task IDs; med context menus  

Subscribe to `currentTime`: `updatePatientTaskStatuses` syncs DOM `data-status` / `task-status-*` from `gameState.tasks`.

---

## Panel content shape (`joe.html`)

- Header: name + room  
- Static vitals grid  
- Collapsible **Tasks** (checkbox list — not all items are `data-task-type` scheduled tasks)  
- Collapsible **Medications** — scheduled `data-task-type="med"` rows  
- Collapsible **Assessments** — additional clinical lists  

Only elements with `data-task-type` enter the task system.

---

## Safe-edit notes

- Paths in `htmlFile` are relative to `game/` (fetch from page URL under `/game/`).  
- Multi-patient census layout is planned (E2.M3); grid already in `index.html` (`#patients` with responsive columns).  
- Prefer content-as-HTML packs for scenarios until E4 scenario loader exists.  
- Fictional names only; keep disclaimer language if adding player-facing copy.
