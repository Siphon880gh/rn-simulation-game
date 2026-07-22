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
| `game/assets/js/task-system.js` | ~280 | Schema normalize, processors, create/process/complete |
| `game/assets/js/availability-windows.js` | ~100 | E3.M3 phases + Perform gate + reveal CSS helpers |
| `game/assets/js/game-config.js` | — | `tasks.schemaVersion`, `classes`, `types`, `statuses`, `availability` |
| `game/assets/js/game-state.js` | — | `REGISTER_TASK`, `ACTIVATE_TASK`, `MARK_OVERDUE`, `COMPLETE_TASK` |
| `game/assets/js/app.js` | — | Context menu + med perform path |
| `game/assets/css/declarative-tasks.css` | ~150 | Status visuals + scheduled reveal opacity |

---

## Schema (E3.M1)

`taskSystem.createTask` → `normalizeTaskData`:

| Field | Notes |
|-------|--------|
| `id` | Stable string |
| `type` | Processor key: `med` / `assessment` / `procedure` / `orders` / `bedprep` / `default` |
| `taskClass` | `routine` / `urgent` / `stat` (E3.M4 batch/context-switch duration) |
| `name` | Display |
| `scheduled` | HHMM int |
| `expire` | HHMM int or null (`+N` relative from scheduled at create) |
| `duration` | Minutes (slot occupancy E3.M2) |
| `status` | `not-yet` → `active` → `completed` / `overdue` |
| `patientId` | Census link |
| `schemaVersion` | From `GameConfig.tasks.schemaVersion` |

HTML attrs: `data-task-type`, `data-task-class` (optional), `data-scheduled`, `data-expire`, `data-duration-mins`, `data-status`.

---

## Lifecycle actions

| Transition | Action |
|------------|--------|
| create | `REGISTER_TASK` |
| not-yet → active | `ACTIVATE_TASK` |
| active → overdue | `MARK_OVERDUE` |
| → completed | `COMPLETE_TASK` |

`processTasks(currentTime)` only queues those dispatches (no liveQuery). Registry mirrors state after each change.

---

## Statuses (`GameConfig.tasks.statuses`)

| Status | Meaning |
|--------|---------|
| `not-yet` | Before scheduled time |
| `active` | Available to perform |
| `completed` | Done |
| `overdue` | Past expire while still active |

CSS classes: `task-status-*` in `declarative-tasks.css`.

---

## Flow

1. **Create** — patients extract HTML → `createTask` → `REGISTER_TASK`.
2. **Process** — `currentTime` subscribe → `processTasks`.
3. **Reveal (DOM)** — timer poll may also force opacity/active on `data-scheduled` (keep aligned).
4. **Perform** — contextMenu on active meds; **disabled outside availability window** (early/late/end phases on `data-window-phase`); pass → challenge gate → slot. Reveal CSS in `#reveal-scheduled-tasks` includes scheduled + absolute/`+N` expire selectors.

---

## Slots (E3.M2)

`slot-system.js` + `GameConfig.slots.count` (3). Perform → `requestSlot`: free slot → `ASSIGN_SLOT`; full → `ENQUEUE_SLOT_TASK` (FIFO `#slot-waiting-queue`). On release, `drainQueue` auto-assigns. Progress CSS + end timemark at bottom center; then `COMPLETE_TASK`. Context menu: `app.js` only (`jquery-contextmenu`).

---

## Safe-edit notes

- Prefer new task types via `GameConfig.tasks.types` + `taskProcessors.set(...)`.
- Lifecycle status changes must go through `game-state` actions.
- Do not reintroduce `$("[data-scheduled]").livequery` activation.
- Context menu setup appears in both `app.js` and `patients.js` — consolidate when touching perform UX (E3.M2).
