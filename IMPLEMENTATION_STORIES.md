# Implementation Stories — RN Simulation Game

Planning source: [`EPIC_MAP.md`](EPIC_MAP.md)  
Self-tracking: [`.agents/state.json`](.agents/state.json)  
Authoring rules: [`prompts/MILESTONE_AUTHORING.md`](prompts/MILESTONE_AUTHORING.md)  
Council finalize: [`council-report-epics-milestones.md`](council-report-epics-milestones.md) (**Option A**)

**Status:** Epic map approved. Milestones **council-finalized** (Balanced Education MVP).

---

## Recommended order

```
E0.M3 → E0.M4 → E1.M1 → E1.M2 → E2.M1 → E2.M2 → E2.M3
  → E3.M1 → E3.M2 → E3.M6 → E6.M0
  → E4.M1 → (E4.M2 ∥ E5.M1) → E5.M2 → E3.M3 → E4.M3 → E3.M5
  → E6.M1 → E6.M2
  → Later: E3.M4, E5.M3, E7.*, E8.*
```

Next up: **E0.M3** (stamp `keep_modular_app`), then **E0.M4** (disclaimer + objectives).

**MVP done when:** Multi-patient shift under slot pressure; hourly doctor-order checks; thin prioritization debrief; one loadable pack; fiction disclaimer visible — no auth, chaos packs, or class-interaction math.

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

**E0.M4 implement notes (locked):**
- Canonical copy in `docs/players/ABOUT.md` (Docs FAB).
- Always-on shell line under the **ICU Simulation** header in `game/index.html` so players see it without opening Docs.
- Suggested text: *Names and scenarios are fictional. Any resemblance to actual events are coincidental.*

### Milestones

| Milestone | Goal | Non-goals |
|-----------|------|-----------|
| **E0.M1** | Planning artifacts | — |
| **E0.M2** | Epic map confirmed + backlog (+ council finalize) | — |
| **E0.M3** | Stamp runtime: **`keep_modular_app`**. Timeboxed decision only. Thin in-house layer only if later pain after slots; no third-party shell. | No migration, no Phaser/Pixi/Godot/React rewrite |
| **E0.M4** | Fictional scenarios disclaimer + educational-use framing + learning objectives (shell + About; see notes above) | No legal productization, auth, LMS |

---

## E1 — Shift Shell & Clock

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S1.1 | In-game timer with speed acceleration | E1.M1 | [~] audit |
| S1.2 | Military shift time + shift bounds | E1.M1 | [~] audit |
| S1.3 | Speed-factor / shift-start via config or query | E1.M1 | [~] audit |
| S1.4 | Pause ownership matrix (user / modal / challenge) | E1.M1 | [ ] |
| S1.5 | Primary panel chrome regions: left menu, right menu, top primary, top secondary, status bar at bottom | E1.M2 | [~] partial |
| S1.6 | Hour tabs in shell chrome (browse shift by hour; content filled by E4.M2 drip) | E1.M2 | [ ] |
| S1.7 | Bottom panel: player response / event history log (append-only during shift) | E1.M2 | [ ] |

### Milestones

| Milestone | Goal | Non-goals |
|-----------|------|-----------|
| **E1.M1** | Audit clock/speed/military display; document pause ownership; fix trust gaps | No task logic, scoring, auth |
| **E1.M2** | Lock panel chrome regions for patient + task UI (left/right menus, top primary/secondary, bottom status/history bar; hour-tab strip) | No multi-patient grid, no mini-games, no chaos incident packs |

---

## E2 — Patient Census & Clinical Panels

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S2.1 | Load/render one patient’s clinical surfaces | E2.M1 | [~] partial |
| S2.1b | Patient chart history (past hx) surface for the active patient | E2.M1 | [ ] |
| S2.2 | Patient tabs + global tab shell | E2.M2 | [ ] |
| S2.3 | Switch census without breaking task binding | E2.M2 | [ ] |
| S2.4 | Multi-patient census layout (**4–6**, MVP non-negotiable) | E2.M3 | [ ] |

### Milestones

| Milestone | Goal | Non-goals |
|-----------|------|-----------|
| **E2.M1** | Stabilize single-patient panels, including a place to view **patient chart history (past hx)** | No 4–6 grid, no scenario DSL |
| **E2.M2** | Patient tabs + global tab; active patient drives panels | No full acuity engine |
| **E2.M3** | **4–6 patient census** usable in a shift | No friends/login |

---

## E3 — Task Queue & Slot Execution

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S3.1 | Formal task schema (class/type/duration) | E3.M1 | [ ] |
| S3.2 | Lifecycle not-yet → active → completed / overdue | E3.M1 | [~] partial |
| S3.3 | Functional 3-slot execution + progress + timemark | E3.M2 | [ ] UI stub |
| S3.4 | Availability windows (early/late/end modes); dynamic `<style id>` rules reveal start + expire duration (incl. relative `+N` before expire) | E3.M3 | [ ] |
| S3.5 | Context-menu details + miss handling polish | E3.M2 | [~] partial |
| S3.6 | Random/urgent spawn + alerts (thin) | E3.M5 | [ ] |
| S3.7 | Task class interactions (batch/context-switch) | E3.M4 | [ ] **Later** |
| S3.8 | Waiting queue: enqueue when slots full; auto-assign to next free slot | E3.M6 | [ ] |
| S3.9 | Emergent-incident tabs for thin urgents; **do not show event clock time** on the tab | E3.M5 | [ ] |

### Milestones

| Milestone | Goal | Non-goals | MVP? |
|-----------|------|-----------|------|
| **E3.M1** | Task schema + state wiring end-to-end | No slots blocking, no mini-games | Yes |
| **E3.M2** | Perform occupies a slot for `duration`; progress; full = blocked (no auto-start yet) | No interaction math; no waiting queue | Yes |
| **E3.M6** | When slots full, player can enqueue; on slot free, next queued task auto-assigns and starts | No class-interaction math; no reordering UX beyond FIFO unless needed | Yes |
| **E3.M3** | Availability windows gate Perform; style-block reveal of start/expire timing | No scenario YAML pipeline | Yes |
| **E3.M5** | Thin mid-shift urgents + alerts; incident tabs omit event clock time | No chaos pack (E7) | Yes |
| **E3.M4** | Class interaction rules adjust duration | — | **Later** |

---

## E4 — Scenario & Event Pipeline

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S4.1 | Scenario pack format + loader (JSON/HTML; fictional + pack-level disclaimer field) | E4.M1 | [ ] |
| S4.2 | Pack learning objectives metadata | E4.M1 | [ ] |
| S4.3 | Timed event unlocks / drip | E4.M2 | [ ] |
| S4.4 | Every game hour: spawn a **check doctor orders** task; expires when that hour ends (miss if not done) | E4.M3 | [ ] |
| S4.4b | Completing the hourly check may inject new work (e.g. new med order) for that hour | E4.M3 | [ ] |
| S4.5 | Hour-tab strip lists/filters work unlocked in that game hour (uses S1.6 chrome) | E4.M2 | [ ] |

**E4.M1 implement notes (locked):**
- Pack metadata includes an optional disclaimer field (fictional-only flag + text).
- Shell header line + `docs/players/ABOUT.md` remain the default player-facing copy; pack field does not replace them unless explicitly shown for that pack.

**E4.M3 implement notes (locked):**
- Recurring hourly task, not a free-floating order drip: at the start of each game hour, player gets a **check doctor orders** task.
- Expiry = end of that game hour (uses E3.M3 availability/expire windows).
- On perform/complete, pack/content may add orders (new med, etc.) for that hour; empty check (no new orders) is allowed.
- Acuity engine / chaos-scale order volume stays out of MVP (E7).

### Milestones

| Milestone | Goal | Non-goals | MVP? |
|-----------|------|-----------|------|
| **E4.M1** | One loadable pack (JSON first or HTML packs); fictional-only + pack disclaimer field (shell/About stay default) | No AI generation, no YAML required | Yes |
| **E4.M2** | Events unlock at game times and inject work | No chaos incidents pack | Yes (light) |
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
| S6.1 | Scoring hooks from outcomes | E6.M1 | [ ] |
| S6.2 | Lightweight live feedback | E6.M2 | [ ] |
| S6.3 | Teaching debrief (by patient where feasible) + grade | E6.M2 | [ ] |
| S6.4 | Debrief copy: practice feedback ≠ clinical assessment | E6.M2 | [ ] |
| S6.5 | End debrief (and optional live cues) can reference bottom response/history log from S1.7 | E6.M0 | [ ] |
| S6.6 | Challenge fail/overtime feedback can dock points and cite correct answers (supports E5.M2+; E5.M3 per [`AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md`](AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md)) | E6.M1 | [ ] |

### Milestones

| Milestone | Goal | Non-goals | MVP? |
|-----------|------|-----------|------|
| **E6.M0** | Thin prioritization debrief **immediately after E3.M6** | No leaderboards, no full grade curve | Yes |
| **E6.M1** | Score state + events from task/challenge outcomes (incl. dock-on-wrong; teaching cite of correct answers when challenge fails/overtimes) | No accounts | Yes |
| **E6.M2** | Live cues + educator-usable end debrief + ethics framing | No social share | Yes |

---

## E7 — Chaos, Presentation & Content Scale *(Later)*

| ID | Story | Milestone | Status |
|----|-------|-----------|--------|
| S7.1 | Prefer incident/content packs before art | E7.M2 | [ ] Later |
| S7.2 | Default static floor/ICU (or unit) background art, pre-generated ahead of time (e.g. Midjourney); swap per scenario when authored | E7.M1 | [ ] Later |
| S7.2b | Optional per-situation / per-event still images behind the challenge or panel | E7.M1 | [ ] Later |
| S7.2c | Optional image→3D or light motion treatment for select situations (not required for all packs) | E7.M1 | [ ] Later |
| S7.3 | More shifts + complications | E7.M3 | [ ] Later |
| S7.4 | E3.M4 class interactions (if still desired) | E3.M4 | [ ] Later |

### Milestones

| Milestone | Goal | Non-goals | MVP? |
|-----------|------|-----------|------|
| **E7.M1** | Scene presence: static unit backgrounds + optional situation stills; selective motion/3D polish | No realtime generative art; no full hospital walkaround | Later |
| **E7.M2** | Chaos / incident content packs (prefer before heavy art spend) | No auth | Later |
| **E7.M3** | More shifts + complications | — | Later |

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
