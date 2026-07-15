# AGENTS_CODE_REFERENCE-tasks.md

Task / medication subsystem for AI assistants.

**Approximate location cues are intentional.** Exact line numbers drift.

Parent: [`AGENTS_CODE_REFERENCE.md`](AGENTS_CODE_REFERENCE.md)  
Related: [`docs/devs/MEDICATION_WINDOW_MECHANICS.md`](docs/devs/MEDICATION_WINDOW_MECHANICS.md)

---

## Role

Declarative tasks with availability windows: create from patient HTML attrs, activate by game time, expire/overdue, context-menu perform for meds, complete into state.

| File | ~Lines | Role |
|------|--------|------|
| `game/assets/js/task-system.js` | ~261 | Processors, create/process/complete, render helpers |
| `game/assets/js/game-config.js` | ~69 | `tasks.types`, `tasks.statuses` |
| `game/assets/js/game-state.js` | ~173 | `REGISTER_TASK`, `ACTIVATE_TASK`, `COMPLETE_TASK` |
| `game/assets/js/app.js` | ~355 | Context menu + `performMedicationTask` |
| `game/assets/css/declarative-tasks.css` | ~150 | Status visuals + scheduled reveal opacity |

---

## Statuses (`GameConfig.tasks.statuses`)

| Status | Meaning |
|--------|---------|
| `not-yet` | Before scheduled time |
| `active` | Available to perform |
| `completed` | Done |
| `overdue` | Past expire while still active |

CSS classes: `task-status-*` in `declarative-tasks.css` (near top of file).

---

## Content contract (HTML)

Required on task `<li>` (see `game/events/patients/joe.html`, medications list):

| Attribute | Example | Notes |
|-----------|---------|--------|
| `data-task-type` | `med` | Processor key (`med` / default) |
| `data-status` | `not-yet` | Initial |
| `data-scheduled` | `2100` | HHMM activate time |
| `data-expire` | `+120` or `2300` | Relative (+mins from scheduled) or absolute |
| `data-duration-mins` | `10` | Intended work duration (slots later) |
| `id` | optional | Assigned if missing when patient renders |

Types declared in config: `MED`, `ASSESSMENT`, `PROCEDURE` — only `med` has rich context menu today.

---

## Flow

1. **Create** — `taskSystem.createTask` (called from patients): parse times, status `not-yet`, `REGISTER_TASK`.
2. **Process** — on each `currentTime` (subscribed in `app.js`): for `not-yet`, if `shouldActivate` → `ACTIVATE_TASK`; for `active`, if `shouldExpire` → set `overdue` on task object (overdue path is lighter than activate dispatch).
3. **Reveal (DOM)** — timer poll also forces opacity/active on matching `data-scheduled` (see timer doc). Two paths can touch activation; keep them aligned when changing rules.
4. **Perform** — left-click contextMenu on `[data-task-type="med"][data-status="active"]` in `app.js` (~ middle): Perform → `ModalModule.showMedicationConfirmation` → `taskSystem.completeTask` → `COMPLETE_TASK`.

### Snippet — relative expire parse (around middle of `task-system.js`)

```js
// parseTime('+120', scheduled) → addMinutesToTime(base, 120)
// Absolute: parseInt('2300')
```

### Snippet — process pipeline (around middle of `task-system.js`)

```js
// NOT_YET + shouldActivate → ACTIVATE_TASK
// ACTIVE + shouldExpire → status OVERDUE
```

---

## Slot bar (incomplete)

`#task-queue-bar` in `game/index.html` (~ bottom of body) shows three fixed slots. Med HTML includes `<data class="slot-label" value="1">`. **Full concurrent slot execution is not implemented** (epic E3.M2). Do not invent slot occupancy logic without matching product stories.

---

## Safe-edit notes

- Prefer new task types via `GameConfig.tasks.types` + `taskProcessors.set(...)`.
- Keep expire math in one place (`parseTime` / `addMinutesToTime`).
- Context menu setup appears in both `app.js` and `patients.js` — changing perform UX may need both or consolidating to one owner.
- Scoring / overdue penalties not wired yet (E6).
