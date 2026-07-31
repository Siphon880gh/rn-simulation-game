# AGENTS_CODE_REFERENCE.md

AI-oriented codebase map for safe modification, feature tracing, and implementation planning.

**Approximate location cues are intentional** (e.g. “near the top”, “around the middle”). Exact line numbers drift; do not treat them as stable anchors.

**Companion files:**
- [`AGENTS_CODE_REFERENCE-timer.md`](AGENTS_CODE_REFERENCE-timer.md) — clock / speed / poll
- [`AGENTS_CODE_REFERENCE-tasks.md`](AGENTS_CODE_REFERENCE-tasks.md) — task system / meds
- [`AGENTS_CODE_REFERENCE-patients.md`](AGENTS_CODE_REFERENCE-patients.md) — census / HTML packs
- [`AGENTS_CODE_REFERENCE-ui.md`](AGENTS_CODE_REFERENCE-ui.md) — shell / modal / docs / CSS

Also: [`AGENTS.md`](AGENTS.md) (entry), [`AGENTS_POSSIBLE_DECISIONS_INDEX.md`](AGENTS_POSSIBLE_DECISIONS_INDEX.md) (decision routing), [`AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md`](AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md) (engine options for E0.M3).

> Refer to this file for high-level context; details are in feature context files.

---

## What the app does

**RN Simulation Game** — browser sim of a fast-paced ~12-hour nursing shift. Player manages patients (vitals, meds, tasks) under an accelerated military clock. Goal: complete the shift without overtime by prioritizing timed work.

Multi-patient census (6 packs), declarative tasks + 3-slot execution with FIFO waiting queue, shell chrome, TimelineJS past hx, markdown Help. Challenges: med identity, bed-prep gather (win-to-complete), IVPB hang sequence, Code Blue (E4 escalate). Scenario + optional chaos incident packs; CSS unit scene themes; scoring/debrief at shift end.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Runtime | Static HTML + ES6 modules (no required bundler) |
| UI libs | Tailwind CDN, Font Awesome, jQuery 2.x, jQuery contextMenu, js-signals, markdown-it + Mermaid + KaTeX (Help/Docs) |
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
├── AGENTS_POSSIBLE_DECISIONS_INDEX.md   # decision doc routing by milestone
├── AGENTS_POSSIBLE_DECISIONS__*.md      # engine, context menu, mini-game specs
├── EPIC_MAP.md / IMPLEMENTATION_STORIES.md / .agents/state.json
├── index.html                         # repo root stub (game lives under game/)
├── game/
│   ├── index.html                     # shell chrome (#shell regions + hour tabs + history)
│   ├── app.config.js                  # unused-by-app presets (~53)
│   ├── assets/js/
│   │   ├── app.js                     # GameApplication entry (~355)
│   │   ├── game-config.js             # GameConfig constants (~69)
│   │   ├── game-state.js              # state + actions (~173)
│   │   ├── timer_ingame.js            # shift clock (~276)
│   │   ├── timer_utils.js             # HHMM / 15-min helpers (~69)
│   │   ├── task-system.js             # tasks (~261)
│   │   ├── patients.js                # census loader (~263)
│   │   ├── modal.js                   # modals (GAME_OVER UI owned by app/debrief)
│   │   ├── debrief.js                 # E6.M0/M2 practice outcome debrief + by-patient notes
│   │   ├── scoring.js                 # E6.M1–M2 score hooks, live cues, outcome bands
│   │   ├── scenario-pack.js           # E4.M1 JSON scenario pack loader
│   │   ├── event-drip.js              # E4.M2 events + deterioration; defer/skip admit-held targets
│   │   ├── challenges/                # E5 perform mini-games (see challenges/README.md)
│   │   │   ├── challenge-gate.js      # pause + modal routing
│   │   │   ├── registry.js            # kind → skills|emergencies paths
│   │   │   ├── shared/copy-config.js  # pause banner / pass copy
│   │   │   ├── skills/<id>/           # config.js (author) + challenge.js
│   │   │   │                          # ivpb-hang, med-identity, bed-prep, accucheck, iv-check, admission
│   │   │   └── emergencies/code-blue/ # config.js (author) + challenge.js
│   │   ├── *-challenge.js / med-identity-quiz.js / admission-quiz.js / challenge-gate.js
│   │   │                              # thin re-exports → challenges/ (deprecated import paths)
│   │   ├── admission-system.js        # E9 open-to-admit schedule + checklist / MD callback
│   │   ├── task-class-interactions.js # E3.M4 batch/context-switch duration
│   │   ├── scene-backdrop.js          # E7.M1 unit theme + situation still hooks
│   │   ├── availability-windows.js    # E3.M3 window phases + Perform gate
│   │   ├── doctor-orders.js           # E4.M3 hourly check + E11 carryover / ≤1 procedure
│   │   ├── right-menu.js              # E10 Orders + Tools right rail
│   │   ├── dynamic-tasks.js           # E3.M5 weighted dynamic/urgent spawn + incident tabs
│   │   ├── slot-system.js             # 3 slots + FIFO waiting queue
│   │   ├── skill-focus.js             # Test skill: blank census + challenge → landing
│   │   ├── docs.js                    # Help FAB + in-page docs viewer (ES module)
│   │   ├── shell-chrome.js            # hour tabs + shift history log
│   │   ├── markdown-renderer.js       # shared markdown-it / Mermaid / KaTeX
│   │   ├── link-popover.js            # internal-link hover Preview + Contents
│   │   └── events.js                  # legacy Signal reveal (~23)
│   ├── assets/css/                    # shell / scene / app / patients / declarative-tasks / markdown / link-popover
│   └── events/
│       ├── scenarios/*.json           # night + day packs (census, scene, incidentPackUrl)
│       ├── incidents/*.json           # E7.M2 chaos templates + events (merged into pack)
│       └── patients/*.html            # six census packs (+ optional *-past-hx.json)
├── assets/js/landing-census.js        # root picker census −1 / open-to-admit modal
├── assets/js/landing-skill.js         # skill library: start shift pack OR Test skill (?skill=&skillMode=test)
├── docs/{devs,players,learning}/      # markdown shown in docs dropdown (ABOUT.md = disclaimer + objectives)
└── prompts/                           # milestone authoring (not runtime)
```

Line counts are approximate totals to help decide whether to load a whole file.

---

## High-level code flow

1. **Boot** — `app.js` constructs `GameApplication`, runs `initialize()` on DOM ready.
2. **Scenario pack** — `ScenarioPackModule.init()` loads JSON (`?scenario=` or default), optionally merges `incidentPackUrl` / default chaos pack, stores `scenarioPack`, paints pack title/objectives (shell `#fiction-disclaimer` stays default). `scene-backdrop` applies unit theme.
3. **Patients** — `PatientsModule.init()` loads census from pack `patients[]` (fallback: all configs). With `?census=minus1|openAdmit`, holds last pack patient (`admitHold`) and boots N−1. Parses `[data-task-type]`, registers into state/DOM.
4. **Subscriptions** — `currentTime` → `taskSystem.processTasks()`; also patients refresh DOM status classes.
5. **Start** — URL params (or pack `shiftStart`) → `INITIALIZE_GAME` → pack log line → `admission.init` (schedules open-to-admit HHMM) → `GameTimerModule.start(...)`.
6. **Tick** — timer interval (scaled by speed factor) updates `#clock`, `UPDATE_TIME`, reveals scheduled tasks at 15-min poll marks (CSS + `data-status="active"`). `event-drip` fires pack events (patient-bound injects defer while target is open-admit held; `minus1` held targets are dropped); `doctor-orders` spawns a per-hour check (5 min; complete injects pack + carryover + ≤1 sudden procedure); `admission-system` may spawn held patient + checklist; overdue work bumps `clinicalStatus` / `acuityScore` and may open Code Blue via `codeBlueHook` subscribe.
7. **Interact** — contextMenu Perform → `challenge-gate` (pause `challenge`; med quiz / IVPB hang sequence / bed-prep gather / admission quizzes / safety; bed-prep + admission steps must win to `completeTask`) → pass → slot (most types) or complete (bed-prep / admission). Find-nurse + admitting call/callback follow critical-lab-style recall.
8. **End** — timer seconds exhausted → `GAME_OVER` → finalize score → practice **outcome** debrief (bands + by-patient notes + ethics framing) + dimmed shell.

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

**Next planned product work** (from `.agents/state.json`): Later order largely complete; **E8.M2** auth/friends only if explicitly re-approved.
