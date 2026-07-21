# Implementation Stories — RN Simulation Game

Planning source: [`EPIC_MAP.md`](EPIC_MAP.md)  
Self-tracking: [`.agents/state.json`](.agents/state.json)  
Authoring rules: [`prompts/MILESTONE_AUTHORING.md`](prompts/MILESTONE_AUTHORING.md)  
Council finalize: [`council-report-epics-milestones.md`](council-report-epics-milestones.md) (**Option A**)

**Status:** Epic map approved. Milestones **council-finalized** (Balanced Education MVP).

---

## Declarative architecture (locked — all milestones)

Every milestone must **extend** the declarative shell already in `game/assets/js/` — not reintroduce imperative jQuery DOM-scraping loops. Reference: [`docs/devs/REFACTORING_SUMMARY.md`](docs/devs/REFACTORING_SUMMARY.md), [`AGENTS_CODE_REFERENCE.md`](AGENTS_CODE_REFERENCE.md).

| Pattern | Home | Milestone rule |
|---------|------|----------------|
| **Configuration-driven** | `game-config.js` | New settings, selectors, task types, defaults → config objects; no scattered magic strings |
| **Reactive-like state** | `game-state.js` | Mutations via named actions + subscribe (Redux-like); no silent globals |
| **Declarative processes / types** | `task-system.js` (+ processors) | Create/process tasks from data (`createTask({…})`); rule-based activation, not liveQuery attr rewriting |
| **Component / module APIs** | `app.js`, `modal.js`, `patients.js`, `timer_ingame.js` | Clear init/lifecycle; inject deps; orchestrate, don’t own every concern |
| **Event-driven** | state subscribe + delegated handlers | Pub/sub or central delegation between modules; avoid one-off scattered `$().on` in unrelated files |
| **Status-driven UI** | `declarative-tasks.css` | Prefer `task-status-*` / data-driven classes over imperative style patches |

**Before (imperative — do not reintroduce):**

```js
$("[data-scheduled]").livequery((i, task) => {
  let $task = $(task);
  if (expire[0] == "+") {
    expire = timemarkPlusMinutes(scheduled, expire);
    $task.attr("data-expire", expire);
  }
});
```

**After (declarative — prefer):**

```js
taskSystem.createTask({
  name: "Medication Administration",
  type: "med",
  scheduled: "1900",
  expire: "+120",
  duration: 10,
});
```

**Agent checklist (every implement turn):** Prefer config + `dispatch`/`subscribe` + typed processors over DOM attribute mutation; put new task kinds in config/processors; wire UI from state subscriptions; keep milestone scope (do not rewrite the whole app “for architecture”).

---

## Recommended order

```
E0.M3 → E0.M4 → E0.M5 → E1.M1 → E1.M2 → E2.M1 → E2.M2 → E2.M3
  → E3.M1 → E3.M2 → E3.M6 → E6.M0
  → E4.M1 → (E4.M2 ∥ E5.M1) → E5.M2 → E3.M3 → E4.M3 → E3.M5
  → E6.M1 → E6.M2
  → Later: E3.M4, E5.M3, E7.*, E8.*
```

Next up: **E0.M3** (stamp `keep_modular_app`), then **E0.M4** (disclaimer + objectives), then **E0.M5** (markdown-it Help/learning renderer).

**MVP done when:** Multi-patient shift under slot pressure (with panel swap); thin dynamic/urgent spawn + game-time emergencies + thin deterioration; hourly doctor-order checks; score + final outcome (tasks + satisfaction/status); thin prioritization debrief; one loadable pack; fiction disclaimer visible — CSS motion first; no auth, chaos packs, full acuity engine, GSAP requirement, or class-interaction math.

---

## E0 — Planning & Decisions

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S0.1 | Epic map grounded in needs/ICPs/flows | E0.M1 | [x] |
| S0.2 | `.agents/state.json` resume point | E0.M1 | [x] |
| S0.3 | User confirms epic map | E0.M2 | [x] |
| S0.4 | Milestone backlog written | E0.M2 | [x] |
| S0.5 | Council finalize epics/milestones | E0.M2 | [x] |
| S0.6 | Decide runtime: keep modular (default) | E0.M3 | [ ] |
| S0.7 | Record `decisions.game_runtime` + rationale | E0.M3 | [ ] |
| S0.8 | Player-facing fictional + educational-use disclaimer | E0.M4 | [ ] |
| S0.9 | Learning objectives visible (About/docs/first-run) | E0.M4 | [ ] |
| S0.10 | Shared MD renderer: markdown-it + live Mermaid + LaTeX math; Help/Docs opens authored `.md` | E0.M5 | [ ] |
| S0.11 | Authoring path for learning/help MD (`docs/` roots + registry); wiki `[[links]]` | E0.M5 | [ ] |
| S0.12 | Hover preview popover for internal MD links (Preview + Contents tabs) | E0.M5 | [ ] |

**E0.M4 implement notes (locked):**
- Canonical copy in `docs/players/ABOUT.md` (Docs FAB).
- Always-on shell line under the **ICU Simulation** header in `game/index.html` so players see it without opening Docs.
- Suggested text: *Names and scenarios are fictional. Any resemblance to actual events are coincidental.*
- After **E0.M5**, About/objectives should open through the shared markdown renderer (not a second `marked` path).

**E0.M3 implement notes:** Read [`AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md`](AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md) and [`AGENTS_POSSIBLE_DECISIONS_INDEX.md`](AGENTS_POSSIBLE_DECISIONS_INDEX.md). Timeboxed decision only: stamp `decisions.game_runtime = keep_modular_app` (default) and record brief rationale in `state.json`. Also stamp `decisions.architecture_style = declarative_modular` (config + game-state actions/subscribe + task-system processors — see [Declarative architecture](#declarative-architecture-locked--all-milestones) above and [`docs/devs/REFACTORING_SUMMARY.md`](docs/devs/REFACTORING_SUMMARY.md)). Thin in-house layer only if later pain after slots; no third-party shell (Phaser/Pixi/Godot/React) unless user explicitly approves.

**E0.M5 implement notes:** Read [`AGENTS_POSSIBLE_DECISIONS__MARKDOWN.md`](AGENTS_POSSIBLE_DECISIONS__MARKDOWN.md), [`AGENTS_POSSIBLE_DECISIONS__MARKDOWN_markdown-it.md`](AGENTS_POSSIBLE_DECISIONS__MARKDOWN_markdown-it.md), [`AGENTS_POSSIBLE_DECISIONS__MARKDOWN_hover-preview.md`](AGENTS_POSSIBLE_DECISIONS__MARKDOWN_hover-preview.md), and [`AGENTS_POSSIBLE_DECISIONS_INDEX.md`](AGENTS_POSSIBLE_DECISIONS_INDEX.md). Port patterns from read-only [`context-devbrain/`](context-devbrain/) (`note-opener.js`, `link-popover.js`, CDN tags + `MarkdownItLatex` in `index.php`) — do not import DevBrain PHP/cache. Default stamp: `decisions.markdown_renderer = markdown-it`. Replace Help FAB `marked` usage in `docs.js` with a shared `markdown-renderer` module; live-render ` ```mermaid ` fences; render LaTeX math (`$…$` / `$$…$$`) for dosage/equations; support `[[Note Title]]` + catalogued relative `.md` links; add internal-link hover preview (Preview + Contents) without a new fetch API. Authoring = drop `.md` under `docs/{players,devs,learning}/` and register in docs structure / config.

### Milestones

| Milestone | Goal | Non-goals |
|-----------|------|-----------|
| **E0.M1** | Planning artifacts | — |
| **E0.M2** | Epic map confirmed + backlog (+ council finalize) | — |
| **E0.M3** | Stamp runtime: **`keep_modular_app`** + architecture: **`declarative_modular`**. Timeboxed decision only. Thin in-house layer only if later pain after slots; no third-party shell. | No migration, no Phaser/Pixi/Godot/React rewrite; no greenfield re-architecture |
| **E0.M4** | Fictional scenarios disclaimer + educational-use framing + learning objectives (shell + About; see notes above) | No legal productization, auth, LMS |
| **E0.M5** | Shared **markdown-it + Mermaid + LaTeX math** renderer for Help/Docs + learning MD authoring; wiki links; internal-link hover preview | No DevBrain PHP/cache port; no external CORS link-preview markers required; no clinical HTML→MD migration; no auth/private notes |

---

## E1 — Shift Shell & Clock

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S1.1 | In-game timer with speed acceleration | E1.M1 | [~] audit |
| S1.2 | Military shift time + shift bounds | E1.M1 | [~] audit |
| S1.3 | Speed-factor / shift-start via config or query | E1.M1 | [~] audit |
| S1.4 | Pause ownership matrix (user / modal / challenge) | E1.M1 | [ ] |
| S1.4b | Clock/pause changes go through `game-state` actions + `game-config` defaults (no new imperative globals) | E1.M1 | [ ] |
| S1.5 | Primary panel chrome regions: left menu, right menu, top primary, top secondary, status bar at bottom | E1.M2 | [~] partial |
| S1.6 | Hour tabs in shell chrome (browse shift by hour; content filled by E4.M2 drip) | E1.M2 | [ ] |
| S1.7 | Bottom panel: player response / event history log (append-only during shift) | E1.M2 | [ ] |

### Milestones

| Milestone | Goal | Non-goals |
|-----------|------|-----------|
| **E1.M1** | Audit clock/speed/military display; document pause ownership; fix trust gaps | No task logic, scoring, auth |
| **E1.M2** | Lock panel chrome regions for patient + task UI (left/right menus, top primary/secondary, bottom status/history bar; hour-tab strip) | No multi-patient grid, no mini-games, no chaos incident packs |

**E1.M1 implement notes:** Keep timer integrated with `game-state.js` / `game-config.js` (`timer.*`, pause actions). Prefer subscribe-driven UI updates over ad-hoc DOM writes. See [Declarative architecture](#declarative-architecture-locked--all-milestones).

---

## E2 — Patient Census & Clinical Panels

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S2.1 | Load/render one patient’s clinical surfaces | E2.M1 | [~] partial |
| S2.1b | Patient chart history (past hx) surface for the active patient | E2.M1 | [ ] |
| S2.2 | Patient tabs + global tab shell | E2.M2 | [ ] |
| S2.3 | **Efficient panel swap** on patient change: active patient id drives which text/clinical panels show; task list stays bound to census (no orphan DOM tasks) | E2.M2 | [ ] |
| S2.3b | **Dynamic content load** per patient: vitals/meds/notes/hx (and any graphics) resolve from that patient’s pack/content id when selected | E2.M2 | [ ] |
| S2.3c | **Graceful panel transitions** on switch (CSS opacity/slide or short cross-fade); keep motion subtle and clinical — no game-HUD flash | E2.M2 | [ ] |
| S2.4 | Multi-patient census layout (**4–6**, MVP non-negotiable) | E2.M3 | [ ] |

### Milestones

| Milestone | Goal | Non-goals |
|-----------|------|-----------|
| **E2.M1** | Stabilize single-patient panels, including a place to view **patient chart history (past hx)** | No 4–6 grid, no scenario DSL |
| **E2.M2** | Patient tabs + global tab; **efficient swap + dynamic per-patient content + graceful CSS transitions** when changing the active patient | No full acuity engine; no GSAP required (CSS first) |
| **E2.M3** | **4–6 patient census** usable in a shift | No friends/login |

**E2.M1 implement notes:** Patient **past hx** tab — read [`AGENTS_POSSIBLE_DECISIONS__TIMELINE.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE.md); default library **TimelineJS** per [`AGENTS_POSSIBLE_DECISIONS__TIMELINE_TimelineJS.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE_TimelineJS.md). Follow `decisions.timeline_library` in `state.json`; lazy-init timeline when tab opens; pack JSON `pastHx[]` → adapter → TimelineJS `events`. Do not swap libraries without user approval. Context menu docs apply only if changing med perform UX on the same milestone.

**E2.M2 implement notes (panel swap — locked intent):** Multi-patient RN play means frequent tab changes. Prefer: (1) one panel shell; swap **content** from state/`patients` module keyed by active patient id; (2) subscribe-driven re-render, not tear-down of the whole chrome; (3) CSS transitions only for MVP (short fade/slide); GSAP or heavier motion libraries stay optional Later (**E7.M1** / UI polish) unless CSS cannot meet a concrete need. Task queue remains global/census-aware — switching patients must not drop in-flight slots or hide due work for other patients (filter/highlight by active patient is OK).

---

## E3 — Task Queue & Slot Execution

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S3.1 | Formal task schema (class/type/duration) via config + `taskSystem.createTask` | E3.M1 | [ ] |
| S3.2 | Lifecycle not-yet → active → completed / overdue via `game-state` actions | E3.M1 | [~] partial |
| S3.3 | Functional 3-slot execution + progress + timemark | E3.M2 | [ ] UI stub |
| S3.3b | Slot / task **progress UI motion** via CSS (smooth fill, status color changes); keep clinical and readable | E3.M2 | [ ] |
| S3.4 | Availability windows (early/late/end modes); dynamic `<style id>` rules reveal start + expire duration (incl. relative `+N` before expire) | E3.M3 | [ ] |
| S3.5 | Context-menu details + miss handling polish | E3.M2 | [~] partial |
| S3.6 | **Dynamic tasks (thin):** mid-shift spawn from config templates (e.g. pain med, call light) via `taskSystem.createTask` — weighted/random among allowed types, not hard-coded one-offs | E3.M5 | [ ] |
| S3.7 | Task class interactions (batch/context-switch) | E3.M4 | [ ] **Later** |
| S3.8 | Waiting queue: enqueue when slots full; auto-assign to next free slot | E3.M6 | [ ] |
| S3.9 | Emergent-incident tabs for thin urgents; **do not show event clock time** on the tab | E3.M5 | [ ] |

### Milestones

| Milestone | Goal | Non-goals | MVP? |
|-----------|------|-----------|------|
| **E3.M1** | Task schema + declarative state wiring end-to-end (`task-system` + `game-state`) | No slots blocking, no mini-games; no liveQuery task activation | Yes |
| **E3.M2** | Perform occupies a slot for `duration`; progress (+ **CSS** progress/status motion); full = blocked (no auto-start yet) | No interaction math; no waiting queue; no GSAP required | Yes |
| **E3.M6** | When slots full, player can enqueue; on slot free, next queued task auto-assigns and starts | No class-interaction math; no reordering UX beyond FIFO unless needed | Yes |
| **E3.M3** | Availability windows gate Perform; style-block reveal of start/expire timing | No scenario YAML pipeline | Yes |
| **E3.M5** | Thin mid-shift **dynamic/urgent** task spawn from templates + alerts; incident tabs omit event clock time | No chaos pack (E7); no wall-clock-only spawn that ignores shift pause/speed | Yes |
| **E3.M4** | Class interaction rules adjust duration | — | **Later** |

**E3.M1 implement notes:** Formalize schema on top of existing `game-config.js` task types/statuses and `task-system.js` processors. Lifecycle transitions = `game-state` actions (`REGISTER_TASK`, `ACTIVATE_TASK`, `COMPLETE_TASK`, etc.). Do not reintroduce `$("[data-scheduled]").livequery` activation. Status visuals via `declarative-tasks.css`. See [Declarative architecture](#declarative-architecture-locked--all-milestones).

**E3.M2 implement notes:** Context menu for task details and med **Perform** — read [`AGENTS_POSSIBLE_DECISIONS__CONTEXT_MENU.md`](AGENTS_POSSIBLE_DECISIONS__CONTEXT_MENU.md); if using jQuery-contextMenu (stamped default), also [`AGENTS_POSSIBLE_DECISIONS__CONTEXT_MENU_jQuery ContextMenu.md`](AGENTS_POSSIBLE_DECISIONS__CONTEXT_MENU_jQuery%20ContextMenu.md). Follow `decisions.context_menu_library` in `state.json`; do not swap libraries without user approval. Consolidate duplicate setup in `app.js` vs `patients.js` when touching perform UX (see [`AGENTS_CODE_REFERENCE-tasks.md`](AGENTS_CODE_REFERENCE-tasks.md)). Slot assign/progress should dispatch through `game-state`, not only mutate DOM attributes.

**E3.M3 implement notes:** When gating **Perform** by availability windows, keep context-menu behavior aligned with [`AGENTS_POSSIBLE_DECISIONS__CONTEXT_MENU.md`](AGENTS_POSSIBLE_DECISIONS__CONTEXT_MENU.md) (conditional menus / disabled items vs hiding Perform). Window/expire rules stay in task processors + config (`+N` relative expire), not ad-hoc liveQuery attr rewrites.

**E3.M5 implement notes (dynamic tasks — locked intent):** Spawn via declarative `taskSystem.createTask` from **config/pack templates** (type, patient scope, urgency, duration, window). Prefer **game-time** schedules or drip ticks that respect pause + speed factor (same clock as E1) — not a raw wall-clock `setInterval` that keeps firing while the shift is paused. “Random” = weighted pick among allowed templates for the current hour/census, capped so the queue stays teachable. Pure chaos floods stay **E7**.

---

## E4 — Scenario & Event Pipeline

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S4.1 | Scenario pack format + loader (JSON/HTML; fictional + pack-level disclaimer field) | E4.M1 | [ ] |
| S4.2 | Pack learning objectives metadata | E4.M1 | [ ] |
| S4.3 | Timed event unlocks / drip (authored + light random) | E4.M2 | [ ] |
| S4.3b | **Emergency events (light):** separate **game-time** event drip (cadence / windows in config or pack) that can fire alerts such as critical new admit or unit emergency and inject follow-on tasks | E4.M2 | [ ] |
| S4.3c | **Patient deterioration (thin):** if critical/overdue work for a patient lingers past config thresholds, worsen that patient’s status/acuity cue (and optionally spawn a follow-up task); feed scoring later | E4.M2 | [ ] |
| S4.4 | Every game hour: spawn a **check doctor orders** task; expires when that hour ends (miss if not done) | E4.M3 | [ ] |
| S4.4b | Completing the hourly check may inject new work (e.g. new med order) for that hour | E4.M3 | [ ] |
| S4.5 | Hour-tab strip lists/filters work unlocked in that game hour (uses S1.6 chrome) | E4.M2 | [ ] |

**E4.M1 implement notes (locked):**
- Pack metadata includes an optional disclaimer field (fictional-only flag + text).
- Shell header line + `docs/players/ABOUT.md` remain the default player-facing copy; pack field does not replace them unless explicitly shown for that pack.

**E4.M2 implement notes (events + thin deterioration — locked intent):**
- Keep a **dedicated event drip** path (scenario unlocks + optional emergency templates) scheduled on **game time**, not a second wall-clock game loop. Cadence can be “every N game minutes” or authored timestamps; both must honor pause/speed.
- Emergency examples for packs: “New patient arrived — critical,” rapid-response style alerts — inject census/task updates through `game-state` / `taskSystem`, surface in bottom history log (S1.7) and thin incident UI (E3.M5).
- **Thin deterioration only:** discrete status steps or flags when overdue/critical tasks age out — not continuous vitals simulation, not a full acuity engine (that stays **E7**). Status changes should be visible on the patient panel after swap (E2.M2) and count toward E6 outcomes.

**E4.M3 implement notes (locked):**
- Recurring hourly task, not a free-floating order drip: at the start of each game hour, player gets a **check doctor orders** task.
- Expiry = end of that game hour (uses E3.M3 availability/expire windows).
- On perform/complete, pack/content may add orders (new med, etc.) for that hour; empty check (no new orders) is allowed.
- Full acuity / chaos-scale order volume stays out of MVP (E7).

### Milestones

| Milestone | Goal | Non-goals | MVP? |
|-----------|------|-----------|------|
| **E4.M1** | One loadable pack (JSON first or HTML packs); fictional-only + pack disclaimer field (shell/About stay default) | No AI generation, no YAML required | Yes |
| **E4.M2** | Game-time event drip + **light emergencies** + **thin overdue→status deterioration**; inject work into the task system | No chaos incidents pack; no continuous physiology sim | Yes (light) |
| **E4.M3** | Hourly **check doctor orders** task (spawn each hour; expire end of hour; may inject new orders on complete) | No full acuity engine; no chaos packs | Yes |

---

## E5 — Perform Challenges

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S5.1 | Challenge gate on Perform; pause game timer | E5.M1 | [ ] |
| S5.2 | Pass → assign slot; fail → no assign, retry | E5.M1 | [ ] |
| S5.3 | Medication identity quiz vertical slice | E5.M2 | [ ] |
| S5.4 | Bed-prep / admission sequence mini-game — **must win to complete** that task. Spec: [`AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md`](AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md) | E5.M3 | [ ] Later |

**E5.M3 implement notes:** Read [`AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md`](AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md) before coding. Rules of thumb from that file: mnemonic **CSBBBCL**, flash loop until Ready, difficulty = hint views (3→1), submit highlights wrong + docks points (E6), fail/overtime does not complete the task and cites correct answers. Scene art defaults stay E7.

### Milestones

| Milestone | Goal | Non-goals | MVP? |
|-----------|------|-----------|------|
| **E5.M1** | Challenge modal + timer pause; pass/fail gates slot | No stats dashboard; no challenge catalogue | Yes (thin) |
| **E5.M2** | Med brand↔generic quiz (practice framing, not competency claim) | No full challenge suite | Yes if schedule allows |
| **E5.M3** | Bed-prep admission mini-game per [`AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md`](AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md); **win required to complete** the task | No full challenge catalogue; not a replacement for E5.M2 unless product later chooses | Later |

---

## E6 — Scoring & Shift Debrief

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S6.0 | Thin end-of-shift closure (completed / late / missed) | E6.M0 | [ ] |
| S6.1 | Scoring hooks from task completion / late / miss (+ challenge outcomes) | E6.M1 | [ ] |
| S6.1b | **Patient satisfaction / status dimension** in score (timely care, deterioration avoided or reversed; thin signals from E4.M2) | E6.M1 | [ ] |
| S6.2 | Lightweight live feedback | E6.M2 | [ ] |
| S6.3 | Teaching debrief (by patient where feasible) + grade | E6.M2 | [ ] |
| S6.3b | **Final score + outcome** screen at shift end (e.g. pass / needs practice / overtime risk framing — practice language, not competency claim) | E6.M2 | [ ] |
| S6.4 | Debrief copy: practice feedback ≠ clinical assessment | E6.M2 | [ ] |
| S6.5 | End debrief (and optional live cues) can reference bottom response/history log from S1.7 | E6.M0 | [ ] |
| S6.6 | Challenge fail/overtime feedback can dock points and cite correct answers (supports E5.M2+; E5.M3 per [`AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md`](AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md)) | E6.M1 | [ ] |

**E6.M1 / E6.M2 implement notes (scoring — locked intent):** Track score in `game-state` from declarative outcomes (complete / late / miss / challenge). Weight **task handling** and a thin **patient satisfaction/status** signal (from overdue/deterioration flags), not a deep psychology model. **E6.M2** shows a clear **final score + outcome** at shift end; live cues stay lightweight. No leaderboards/accounts in MVP.

### Milestones

| Milestone | Goal | Non-goals | MVP? |
|-----------|------|-----------|------|
| **E6.M0** | Thin prioritization debrief **immediately after E3.M6** | No leaderboards, no full grade curve | Yes |
| **E6.M1** | Score state from task/challenge + thin satisfaction/status signals (incl. dock-on-wrong; teaching cite when challenge fails/overtimes) | No accounts; no deep satisfaction sim | Yes |
| **E6.M2** | Live cues + **final score/outcome** + educator-usable end debrief + ethics framing | No social share | Yes |

---

## E7 — Chaos, Presentation & Content Scale *(Later)*

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S7.1 | Prefer incident/content packs before art | E7.M2 | [ ] Later |
| S7.2 | Default static floor/ICU (or unit) background art, pre-generated ahead of time (e.g. Midjourney); swap per scenario when authored | E7.M1 | [ ] Later |
| S7.2b | Optional per-situation / per-event still images behind the challenge or panel | E7.M1 | [ ] Later |
| S7.2c | Optional image→3D or light motion treatment for select situations (not required for all packs) | E7.M1 | [ ] Later |
| S7.2d | Optional **UI motion polish** (progress bars, health/status changes, panel swaps) via CSS first; add a light library (e.g. **GSAP**) only if CSS is insufficient — stamp if adopted | E7.M1 | [ ] Later |
| S7.3 | More shifts + complications; richer deterioration / acuity beyond E4.M2 thin flags | E7.M3 | [ ] Later |
| S7.4 | E3.M4 class interactions (if still desired) | E3.M4 | [ ] Later |

### Milestones

| Milestone | Goal | Non-goals | MVP? |
|-----------|------|-----------|------|
| **E7.M1** | Scene presence: static unit backgrounds + optional situation stills; selective motion/3D; optional GSAP-level UI polish if CSS ceiling hit | No realtime generative art; no full hospital walkaround; no GSAP until needed | Later |
| **E7.M2** | Chaos / incident content packs (prefer before heavy art spend) | No auth | Later |
| **E7.M3** | More shifts + complications (richer acuity/deterioration) | — | Later |

---

## E8 — Portfolio Packaging & Optional Social *(Later)*

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S8.1 | Demo/portfolio packaging polish | E8.M1 | [ ] Later |
| S8.2 | Optional auth/friends | E8.M2 | [ ] Later — re-approve only |

---

## Confirmation gate

- [x] User approved `EPIC_MAP.md`
- [x] Council finalized Option A
- [x] `.agents/state.json` updated
- [x] Per-epic milestone IDs assigned
