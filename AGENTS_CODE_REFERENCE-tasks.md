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
| `game/assets/js/slot-constraints.js` | ~200 | Declarative queue-slot concurrency gates (`canEnterSlot`) |
| `game/assets/js/game-config.js` | — | `tasks.*`, `slots`, `slotConstraints`, `availability` |
| `game/assets/js/game-state.js` | — | `REGISTER_TASK`, `ACTIVATE_TASK`, `MARK_OVERDUE`, `COMPLETE_TASK` |
| `game/assets/js/app.js` | — | Context menu + med perform path |
| `game/assets/css/declarative-tasks.css` | ~150 | Status visuals + scheduled reveal opacity + disabled slots |

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
4. **Perform** — contextMenu on active meds; **disabled outside availability window** (early/late/end phases on `data-window-phase`); pass → `challenges/challenge-gate.js` → slot. Author content under `challenges/skills/<id>/config.js` or `challenges/emergencies/<id>/config.js` (see `challenges/README.md`). Med identity / IVPB hang / bed-prep / accucheck / IV / admission are **skills**; Code Blue is an **emergency**. Test spawn groups match: Skills / Emergencies. Reveal CSS in `#reveal-scheduled-tasks` includes scheduled + absolute/`+N` expire selectors.

---

## Slots (E3.M2)

`slot-system.js` + `GameConfig.slots.count` (3). Perform → `requestSlot`: free slot → `ASSIGN_SLOT`; full → `ENQUEUE_SLOT_TASK` (FIFO `#slot-waiting-queue`). On release, `drainQueue` auto-assigns. Progress CSS + end timemark at bottom center; then `COMPLETE_TASK`. Context menu: `app.js` only (`jquery-contextmenu`).

### Slot constraints (`slot-constraints.js`)

`GameConfig.slotConstraints.rules` — evaluated by `canEnterSlot` before assign / enqueue / Perform / FIFO drain.

| Rule type | Behavior |
|-----------|----------|
| `mutexSimilar` | Only one matching task (by `metadata.kind` / similarityKey / type) in busy slots |
| `requiresEmptySlots` | Start only when all 3 slots empty; `exclusive:true` blocks other starts and renders remaining slots `.task-slot--disabled` |
| `blocksWith` | Blocked while any busy-slot task matches `blocksWhen` |

Default rules: shift-assessment mutex; chart-assessment mutex + exclusive empty-slots; chart blocked while any shift-assessment is in a slot. Details menu appends the block `message` to duration/expire copy. AUTO: `node scripts/verify-slot-constraints.mjs`.

---

## Care schedules (E12)

`GameConfig.careSchedules.turnQ2h` — every 120 game-min from shift start; `assessment` tasks (duration 10, expire +60). Built in `patients.js` (`buildCareScheduleTasks` / `mountCareScheduleTasks`). Perform = existing assessment → slot path in `app.js`.

## Delegate assist (E13)

`delegation.js` + `GameConfig.delegation`. ICU: one **CCT**, free first or second half of each hour. Floor: up to **2 CNAs** on **distinct non-overlapping thirds** of the shift; patients split; label `CNA Wendy · 201`. Select aide on `#delegate-rail` → borders on aide + eligible tasks.

| Mode | When | Effect |
|------|------|--------|
| **Team · ½ time** | Turns / reposition | Slot duration ×0.5 |
| **They do this · instant** | `soloRequestCatalog` (bathroom, water, bed position, pillow, linen) + **call lights** (`nurse-alerts.js`, floor CNA on tele/med-surg only — not ICU CCT) | `COMPLETE_TASK` immediately |

Invalid click while aide selected → soft `#shell-delegate-hint`. AUTO: `node scripts/verify-e13.mjs` (+ nurse-alerts solo stamp in `verify-nurse-alerts.mjs`).

## Doctor orders + E11

`doctor-orders.js` — hourly `doctor-orders-check` (duration 5). On **complete**: inject pack `orderInjections` + **carryover** (missed-check undelivered specs + overdue `fromOrdersCheck` tasks) + maybe **one** sudden procedure (`GameConfig.doctorOrders.procedures`).

| Procedure rule | Behavior |
|----------------|----------|
| Eligibility | Diagnosis match in `procedures.byDiagnosis`; max 1/game |
| sameDay | Schedule ≥ `minLeadMinsSameDay` (120); always spawn Obtain consent |
| tomorrow | Consent + Inform NPO + whiteboard/CNA NPO; `expire` = next midnight (`nextMidnightExpire`) |

AUTO: `node scripts/verify-e11.mjs`.

---

## Safe-edit notes

- Prefer new task types via `GameConfig.tasks.types` + `taskProcessors.set(...)`.
- Lifecycle status changes must go through `game-state` actions.
- Do not reintroduce `$("[data-scheduled]").livequery` activation.
- Context menu setup appears in both `app.js` and `patients.js` — consolidate when touching perform UX (E3.M2).
