# AGENTS_CODE_REFERENCE.md

AI-oriented codebase map for safe modification, feature tracing, and implementation planning.

**Approximate location cues are intentional** (e.g. “near the top”, “around the middle”). Exact line numbers drift; do not treat them as stable anchors.

**Companion files:**
- [`AGENTS_CODE_REFERENCE-timer.md`](AGENTS_CODE_REFERENCE-timer.md) — clock / speed / poll
- [`AGENTS_CODE_REFERENCE-tasks.md`](AGENTS_CODE_REFERENCE-tasks.md) — task system / meds
- [`AGENTS_CODE_REFERENCE-patients.md`](AGENTS_CODE_REFERENCE-patients.md) — census / HTML packs
- [`AGENTS_CODE_REFERENCE-ui.md`](AGENTS_CODE_REFERENCE-ui.md) — shell / modal / docs / CSS

Also: [`AGENTS.md`](AGENTS.md) (entry), [`AGENTS_POSSIBLE_GAME_ENGINES.md`](AGENTS_POSSIBLE_GAME_ENGINES.md) (engine unification options).

> Refer to this file for high-level context; details are in feature context files.

---

## What the app does

**RN Simulation Game** — browser sim of a fast-paced ~12-hour nursing shift. Player manages patients (vitals, meds, tasks) under an accelerated military clock. Goal: complete the shift without overtime by prioritizing timed work.

Early WIP: one patient pack (`joe`), declarative task statuses, context-menu med perform, pause, game-over modal. Task **slot queue bar** exists in HTML but full slot execution is still planned (see epic E3).

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Runtime | Static HTML + ES6 modules (no required bundler) |
| UI libs | Tailwind CDN, Font Awesome, jQuery 2.x, jQuery contextMenu, js-signals, marked |
| State | Custom singleton `gameState` (subscribe / dispatch) |
| Content | Patient HTML under `game/events/patients/` with `data-*` task attrs |
| Entry | `game/index.html` → `assets/js/app.js` (module) + `docs.js` (classic script) |

**Constraints:** vanilla / light stack; no React unless approved. See `.agents/state.json` → `decisions.main_constraints`.

---

## Architecture

```
URL params (?speed-factor=&shift-starts=&shift-duration=)
        │
        ▼
   GameApplication (app.js)
        │  init order: patients → task listeners → UI → timer start
        ▼
┌───────────────┐     dispatch/subscribe      ┌────────────────┐
│  game-state   │◄────────────────────────────►│ timer_ingame   │
│  (singleton)  │                              │ patients       │
└───────┬───────┘                              │ task-system    │
        │                                      │ modal          │
        ▼                                      └────────────────┘
   #patients DOM ◄── fetch events/patients/*.html
   #clock / #pause / #modal / #task-queue-bar
```

**Config sources (do not confuse):**
- `game/assets/js/game-config.js` — **used** by modules (selectors, statuses, defaults)
- `game/app.config.js` — alternate preset/speed helper; **not wired** into `app.js` today
- URL query params override defaults in `AppConfig` inside `app.js`

---

## Relevant file tree

```
rngame/
├── AGENTS.md                          # AI entry + engine pointer
├── AGENTS_CODE_REFERENCE*.md          # this family
├── AGENTS_POSSIBLE_GAME_ENGINES.md    # engine options if unifying DX
├── EPIC_MAP.md / IMPLEMENTATION_STORIES.md / .agents/state.json
├── index.html                         # repo root stub (game lives under game/)
├── game/
│   ├── index.html                     # shell UI (~132 lines)
│   ├── app.config.js                  # unused-by-app presets (~53)
│   ├── assets/js/
│   │   ├── app.js                     # GameApplication entry (~355)
│   │   ├── game-config.js             # GameConfig constants (~69)
│   │   ├── game-state.js              # state + actions (~173)
│   │   ├── timer_ingame.js            # shift clock (~276)
│   │   ├── timer_utils.js             # HHMM / 15-min helpers (~69)
│   │   ├── task-system.js             # tasks (~261)
│   │   ├── patients.js                # census loader (~263)
│   │   ├── modal.js                   # modals (~212)
│   │   ├── docs.js                    # in-game docs UI (~336)
│   │   └── events.js                  # legacy Signal reveal (~23)
│   ├── assets/css/                    # app / patients / declarative-tasks
│   └── events/patients/joe.html       # patient content pack (~109)
├── docs/{devs,players}/               # markdown shown in docs dropdown
└── prompts/                           # milestone authoring (not runtime)
```

Line counts are approximate totals to help decide whether to load a whole file.

---

## High-level code flow

1. **Boot** — `app.js` constructs `GameApplication`, runs `initialize()` on DOM ready.
2. **Patients** — `PatientsModule.init()` fetches each configured HTML pack, parses `[data-task-type]`, registers patient + tasks into `gameState` / `taskSystem`, injects DOM into `#patients`.
3. **Subscriptions** — `currentTime` → `taskSystem.processTasks()`; also patients refresh DOM status classes.
4. **Start** — URL params → `INITIALIZE_GAME` → `GameTimerModule.start(...)`.
5. **Tick** — timer interval (scaled by speed factor) updates `#clock`, `UPDATE_TIME`, reveals scheduled tasks at 15-min poll marks (CSS + `data-status="active"`).
6. **Interact** — active meds: jQuery contextMenu → Perform → confirmation modal → `completeTask`.
7. **End** — timer seconds exhausted → `GAME_OVER` → game-over modal + dimmed container.

### Snippet — entry pipeline (near top / middle of `app.js`)

```js
// AppConfig.modules: modal, patients, timer, tasks
// initialize(): setupGlobalState → initializeModules → setupUIHandlers → startGame
await patients.init();
gameState.subscribe('currentTime', (t) => taskSystem.processTasks(t));
```

### Snippet — task content contract (patient HTML)

```html
<li data-task-type="med" data-status="not-yet"
    data-scheduled="2100" data-expire="+120" data-duration-mins="10">
```

`+N` expire = N minutes after scheduled (parsed in `task-system`).

---

## Safe-edit guidance

| Do | Avoid |
|----|--------|
| Extend via `GameConfig`, `gameState` actions, patient HTML packs | Assuming `app.config.js` drives runtime |
| Keep military HHMM integers (e.g. `1900`) consistent | Introducing React/bundler without approval |
| Prefer modules under `game/assets/js/` | Breaking `#` selectors listed in `GameConfig.selectors` |
| Read feature `AGENTS_CODE_REFERENCE-*.md` before deep edits | Treating `#task-queue-bar` as fully implemented slots |

**Recent direction (git history themes):** declarative refactor; patient module; timer/utils; task queue UI shell; context menus; med windows; nested in-game docs; generative prompts / planning artifacts.

**Next planned product work** (from `.agents/state.json`): E1.M1 clock/speed contracts, then panels, then full task slots.
