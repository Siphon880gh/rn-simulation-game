# Epic Map — RN Simulation Game

Living product epic map. Source of planning truth for AI agents.  
Self-tracking companion: [`.agents/state.json`](.agents/state.json)  
Stories (after confirmation): [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md)  
Planning prompt: [`prompts/GUIDELINES_MILESTONE_PROMPTS.md`](prompts/GUIDELINES_MILESTONE_PROMPTS.md)

**Status:** Approved — milestones council-finalized (**Option A**) in [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md).  
Report: [`council-report-epics-milestones.md`](council-report-epics-milestones.md)

---

## App Summary

| Field | Value |
|-------|-------|
| **App name** | RN Simulation Game |
| **One-liner** | Compressed 12-hour RN shift: triage tasks, ace clinical mini-games, stay on schedule — or overtime / miss the critical moment. |
| **Platform** | Web (browser, ES6 modules, no required build step) |
| **Target users** | Nursing students, early-career RNs, educators exploring prioritization practice; also portfolio / demo viewers |
| **Success signal** | Triage under load, pass clinical mini-games when gated, finish on schedule; failure = overtime and/or missing a critical moment that worsens patient status (practice framing, not competency claim) |

### Product focus (locked — Clinical Training)

**Clinical Training:** This RN simulator drops players into a compressed 12-hour nursing shift filled with real-world events, diverse patients, and escalating case studies. Success means triaging tasks, acing clinical mini-games, and staying on schedule; failure means clocking overtime—or worse, missing the critical moment that leads to patient injury.

All epics and milestones serve this loop. Do **not** let art, chaos packs, social, or challenge catalogue expansion displace: **triage → perform (mini-games when required) → schedule pressure → patient-status consequences → debrief**.

### Scope (assumptions — edit if wrong)

| Tier | Contents |
|------|----------|
| **MVP** | Accelerated shift clock; patient census + clinical panels (incl. chart history / past hx; panel swap + CSS transitions); task schema with availability/expiry; 3 execution slots + waiting queue (auto-assign); thin dynamic/urgent spawn; game-time emergency drip + thin deterioration; hourly check-doctor-orders task (expires end of hour); at least one perform challenge; scoring (tasks + satisfaction/status) + final outcome/debrief; one playable scenario pack; CSS motion first |
| **Mandatory** | Fictional names/scenarios disclaimer; military time; panels-first UI; vanilla/light stack (no React unless approved); **declarative modular architecture** (`game-config` / `game-state` / `task-system` — see [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md) § Declarative architecture) |
| **Later** | Chaos/incident packs, richer art, many shifts/complications, auth/friends, 3D/motion polish |

---

## User Needs (Grounding)

### Use-based
- Run a compressed accelerated 12-hour shift with real-world-style events and escalating cases
- Triage timed work across diverse patients and know what is due for whom
- Ace clinical mini-games when Perform is gated (pass/fail under a frozen shift clock)
- Start work that occupies limited attention (slots) for a duration; stay on schedule
- Queue work when all slots are busy so it starts as soon as a slot frees
- Face emergent / urgent / deteriorating work that can become a critical moment
- Get a score/debrief that reflects triage quality, mini-game outcomes, overtime risk, and patient-status harm avoided or missed

### Usability-based
- Runs in the browser with a local/static server
- Speed factor so a 12-hour shift fits a short session
- Readable clinical panels (not game-inventory chrome)

### Meaning-based
- Feels like nursing work (acuity, meds, assessments), not fantasy combat
- Safe to share: clearly fictional patients/scenarios

### Social / status *(later)*
- Credible demo for portfolio / teaching conversation
- Optional peer/auth features only after core loop ships

---

## ICP Snapshots

### ICP 1 — Nursing student
- **Goals:** Practice prioritization under time pressure without live clinical risk
- **Use cases:** Solo shift runs; review what was missed/late
- **Alternatives:** Paper case studies, LMS sims, high-fidelity lab sims
- **Differentiator:** Lightweight browser shift with real time-pressure + task concurrency

### ICP 2 — Educator / preceptor
- **Goals:** Give learners a repeatable workload scenario
- **Use cases:** Assign a scenario pack; debrief from score/summary
- **Alternatives:** Vendor sims, manikin scenarios
- **Differentiator:** Simple to host; scenario-as-content; fast iteration

### ICP 3 — Builder / portfolio viewer
- **Goals:** See a polished vertical slice of clinical UX + systems thinking
- **Use cases:** Short demo shift; read About / learning objectives
- **Alternatives:** Other indie educational games
- **Differentiator:** Honest ICU/Med-Surg framing with systems (slots, windows, drip events)

---

## Planning Artifacts

### User flows
1. **First-run:** Open game → see shift clock + empty/seeded panels → start shift
2. **Primary loop:** Watch game time → scan due tasks → Perform (optional challenge) → occupy slot (or enqueue if full) → on slot free, next queued task starts → complete/miss → react to new orders/urgents → end shift → debrief
3. **Secondary:** Adjust speed factor / shift start; open patient tabs; task details via context menu; docs/about
4. **Errors / edges:** All slots full (enqueue vs blocked); task expired while queued; challenge fail; missing patient content; timer pause during modal

### State & persistence
| Kind | Plan |
|------|------|
| Business data | Patients, tasks, scenario events (content files / HTML data attrs; later YAML) |
| Settings | Speed factor, shift start (URL/query or config) |
| Temporary UI | Active tab, open modal, slot progress, waiting queue, context menu |
| Offline | Fully client-side play for MVP; no server required |

### UI states
Empty · Loading · Error · Success/confirm · First-run · Edge (slots full / queued, overdue, challenge fail)

---

## A. Suggested Epic List

| Epic ID | Epic Name | Goal / Outcome | Includes | Derived From | Priority |
|--------|-----------|----------------|----------|--------------|----------|
| E0 | Planning & Decisions | Stable product/tech decisions + tracking | Epic map, state.json, story backlog, game-runtime/engine decision | Process | Mandatory |
| E1 | Shift Shell & Clock | Player is inside a running shift with trustworthy time | Timer, speed factor, military display, panel chrome | MVP / usability | MVP |
| E2 | Patient Census & Clinical Panels | Player can see who they have and clinical status surfaces | Patient load, tabs, vitals/meds/panels, chart history (past hx), multi-patient layout | Use needs / ICP | MVP |
| E3 | Task Queue & Slot Execution | Player prioritizes timed work under concurrency limits | Schema, availability windows, slots, waiting queue, interactions, urgent spawn | MVP core loop | MVP |
| E4 | Scenario & Event Pipeline | Shift content can drip and vary without code rewrites | Scenario packs, event unlocks, hourly check-doctor-orders task | Content / educator ICP | MVP |
| E5 | Perform Challenges | Ace clinical mini-games at critical Perform moments | Mini-games (med quiz MVP; bed-prep + Code Blue Later), timer pause, retry rules | MVP / learning | MVP |
| E6 | Scoring & Shift Debrief | Player knows how the shift went | Points, grades, live feedback, end summary | Success signal | MVP |
| E7 | Chaos, Presentation & Content Scale | Harder, richer, more replayable shifts | Art, chaos packs, incidents, more shifts/complications | Later wishlist | Later |
| E8 | Portfolio Packaging & Optional Social | Ship/share beyond local demo | Polish, packaging; optional auth/friends | Later / social | Later |
| E9 | Open Admit & Admission Workflow | Choose lighter census / open bed; run a full admission checklist when an admit arrives | Census choice, mid-shift admit spawn, Admitting tab, quizzes, find-nurse retries, admitting MD callback | Post-MVP clinical loop | Post-MVP |
| E10 | Right rail: Orders & Tools | Always-visible unit Orders + Tools glance without opening Global | Doctor-orders checks rail, injected-order cues, awaiting-MD / IV / admit tools, narrow-layout access | Post-MVP shell UX | Post-MVP |

---

## B. Epic Details

### E0. Planning & Decisions
- **Goal / user outcome:** Agents and humans share one epic map and resume state.
- **Why:** Prevents full-app one-shots and architectural drift.
- **Includes:** This file, `.agents/state.json`, `IMPLEMENTATION_STORIES.md`, prompt guidelines, **E0.M3 runtime + architecture stamp** (`keep_modular_app` + `declarative_modular`), **E0.M4 disclaimer + learning objectives**, **E0.M5 markdown-it Help/learning renderer** (authored `.md`, Mermaid, LaTeX math, internal-link hover — see [`AGENTS_POSSIBLE_DECISIONS__MARKDOWN.md`](AGENTS_POSSIBLE_DECISIONS__MARKDOWN.md)).
- **Dependencies:** None.
- **Risks / unknowns:** Scope assumptions may need user edits; engine choice affects E3+ cost.
- **Out of scope:** Implementing an engine or migrating frameworks inside E0 (decision only); greenfield re-architecture; DevBrain PHP/cache port.
- **Suggested order:** First — always; **E0.M3 → E0.M4 → E0.M5** before heavy E3 work.

### E1. Shift Shell & Clock
- **Goal / user outcome:** Player trusts game time and has a place to work.
- **Why:** Every other loop depends on military shift time ≠ wall clock.
- **Includes:** In-game timer, speed factor, shift bounds, primary panel chrome.
- **Dependencies:** E0 decisions.
- **Risks / unknowns:** Pause rules during modals/challenges.
- **Out of scope:** Full task logic, scoring, auth.
- **Suggested order:** 1 (foundation partially exists in repo).

### E2. Patient Census & Clinical Panels
- **Goal / user outcome:** Player manages a census, not a single card demo forever.
- **Why:** RN workload is multi-patient; panels carry clinical framing.
- **Includes:** Patient loading, tabs (patient + global), vitals/meds/status panels, **patient chart history (past hx)**, 4–6 patient layout path; **efficient panel swap** on patient change with **dynamic per-patient content** and **graceful CSS transitions**.
- **Dependencies:** E1 shell.
- **Risks / unknowns:** How dense panels get before art epic.
- **Out of scope:** Full scenario authoring DSL; social; GSAP-required motion (CSS first; optional polish in E7).
- **Suggested order:** 2 (partially exists).

### E3. Task Queue & Slot Execution
- **Goal / user outcome:** Player chooses what to do under time and concurrency pressure.
- **Why:** Core skill of the product — prioritization under load.
- **Includes:** Task class/type/duration schema; availability windows; 3 slots + progress (**CSS** progress/status motion); waiting queue that auto-assigns to the next free slot (**E3.M6**); **dynamic/urgent mid-shift spawn from templates (E3.M5)**; miss/overdue. **Class interactions (E3.M4) deferred to Later.**
- **Dependencies:** E1, E2.
- **Risks / unknowns:** Expire/cancel while queued; how visible the waiting line should be.
- **Out of scope:** Full mini-game suite; multiplayer; MVP class-interaction math; wall-clock spawn that ignores pause/speed.
- **Suggested order:** 3 — primary MVP epic (through M2 + M6 + M3 + M5; not M4).

### E4. Scenario & Event Pipeline
- **Goal / user outcome:** Shifts feel authored and replayable via content, not hard-coded one-offs.
- **Why:** Educators and replay need content packs and drip events.
- **Includes:** One loadable pack (JSON/HTML) with objectives + fiction disclaimer; light **game-time** drip + **emergency events** (e.g. critical new admit); **thin patient deterioration** when overdue/critical work ages; **hourly check-doctor-orders task (E4.M3)** — spawn each game hour, expire end of that hour; complete may inject new orders (e.g. new med). Full acuity engine stays Later/E7.
- **Dependencies:** E1–E3 for runtime hooks (esp. E3.M3 windows for hour-bound expiry).
- **Risks / unknowns:** Authoring format choice; content volume.
- **Out of scope:** AI-generated shifts; full library; YAML required for MVP; chaos-scale order volume; continuous physiology sim.
- **Suggested order:** After E3.M6 + thin E6.M0; **E4.M3 after E3.M3**.

### E5. Perform Challenges
- **Goal / user outcome:** Players **ace clinical mini-games** at high-stakes Perform moments (pass to start; fail blocks slot assign); Later emergents (e.g. Code Blue) use the same focused gate.
- **Why:** Clinical Training focus — safe practice under time pressure without live patient risk.
- **Includes:** Challenge modal, timer pause, med quiz vertical slice (**E5.M2**), retry behavior; Later **E5.M3** bed-prep / admission mini-game (**win required to complete** that task) — spec [`AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md`](AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md); Later **E5.M4** Code Blue mini-game for a random deteriorating patient (trigger from E4).
- **Dependencies:** E3 perform path; Code Blue also needs E4 thin deterioration escalate.
- **Risks / unknowns:** Which task types require challenges first; Code Blue frequency vs teachable pacing.
- **Out of scope:** Full challenge suite for every task type (MVP = thin gate + one quiz). Extra mini-games must still serve triage/schedule pressure — not become the whole product.
- **Suggested order:** After E3 perform wiring; E5.M3 / E5.M4 after MVP.

### E6. Scoring & Shift Debrief
- **Goal / user outcome:** Clear feedback on how the shift went.
- **Why:** Success signal and learning loop closure.
- **Includes:** Points/grades from task handling + thin patient satisfaction/status; real-time feedback hooks; **final score + outcome** at shift end.
- **Dependencies:** E3 (and ideally E5 outcomes); thin deterioration signals from E4.M2 when present.
- **Risks / unknowns:** Scoring weights vs “feel fair.”
- **Out of scope:** Leaderboards, accounts; deep satisfaction psychology model.
- **Suggested order:** After core task loop is playable.

### E7. Chaos, Presentation & Content Scale
- **Goal / user outcome:** Harder emergent play and stronger presence.
- **Why:** Replay and teaching depth beyond the first pack.
- **Includes:** Pre-generated scene art (static ICU/unit floors; optional per-situation stills; selective image→3D/motion); optional **GSAP**-level UI motion if CSS is not enough; chaos scenario pack; emergent incidents; richer acuity/deterioration; more shifts/complications.
- **Dependencies:** E4–E6 solid.
- **Risks / unknowns:** Scope creep into “full hospital sim.”
- **Out of scope:** Auth/friends (E8).
- **Suggested order:** Post-MVP.

### E8. Portfolio Packaging & Optional Social
- **Goal / user outcome:** Easy to share/demo; optional social only if approved.
- **Why:** Distribution and credibility beyond local folders.
- **Includes:** Packaging/polish; optional login/friends later.
- **Dependencies:** Stable MVP loop.
- **Risks / unknowns:** Auth complexity vs value.
- **Out of scope:** Multiplayer realtime clinical sync.
- **Suggested order:** Last.

### E9. Open Admit & Admission Workflow
- **Goal / user outcome:** At unit select, start with census −1, optionally open to admit; when the admit arrives, run a teachable admission checklist (bed prep, allergies, belongings, code status, home recon, NPO, BP, flu, skin check with nurse find retries, call admitting + MD callback/consult).
- **Why:** Extends department picker into realistic capacity + admission pressure without new patient HTML packs (held last pack patient).
- **Includes:** Landing census modal; `?census=minus1|openAdmit`; `admission-system.js` schedule (start/mid/near-end); Admitting tab badge; challenge-gate admission quizzes; find-nurse 30‑min retries (max 4); admitting call-back patterned on critical labs.
- **Dependencies:** E4.M4 picker, E5.M3 bed-prep, E5.M1 challenge gate, critical-lab callback UX.
- **Out of scope:** New patient art packs; empty-bed inventory UI; multiplayer nurse availability.
- **Suggested order:** After E4.M4 / E5.M3 (shipped post-MVP).

### E10. Right rail: Orders & Tools
- **Goal / user outcome:** Player sees hourly doctor-orders checks and unit tools (awaiting MD, IV attention, admit pipeline) in the right shell rail without hunting Global.
- **Why:** E1.M2 reserved `#shell-right-menu` as “Tools / orders (later)”; Global buries orders; unit glances belong off the left census nav.
- **Includes:** `right-menu.js` declarative rail; Orders list from `doctor-orders-check` + injected orders; click → open Global / patient; Tools: awaiting MD, IV attention, admitHold; narrow viewport keeps access (no hard hide).
- **Dependencies:** E1.M2 chrome, E4.M3 doctor orders, E2 tabs/Global, critical-labs + admission callback patterns, IV system.
- **Out of scope:** Moving sound/test/docs/slots into the rail; full order-entry EHR; scraping Global DOM as source of truth.
- **Suggested order:** After E9 (post-MVP shell fill-in).

---

## C. Coverage Check

| Requirement area | Covered by |
|------------------|------------|
| Accelerated 12h shift clock | E1 |
| Multi-patient clinical panels + chart history (past hx) | E2 |
| Efficient panel swap + dynamic per-patient content + CSS transitions | E2.M2 |
| Timed tasks, windows, slots, waiting queue, dynamic/urgent spawn | E3 |
| Slot/progress CSS motion | E3.M2 (MVP); optional GSAP polish E7.M1 |
| Scenario drip + emergency events + thin deterioration + hourly check-doctor-orders | E4 |
| Clinical Training focus (triage + mini-games + schedule / overtime / critical-moment harm) | Product focus (locked) + E1–E6 |
| Med/perform challenges (MVP quiz; Later bed-prep + Code Blue) | E5 |
| Scoring (tasks + satisfaction/status) + final outcome + debrief | E6 |
| Chaos, art, richer acuity, content scale | E7 |
| Auth/friends / packaging | E8 |
| Open-to-admit census choice + admission checklist / MD callback | E9 |
| Always-visible Orders + Tools right rail | E10 |
| Fictional disclaimer + clinical tone | Decisions + all content epics |
| Help / learning MD authoring + Mermaid + LaTeX math | E0.M5 (+ content epics author files) |
| Vanilla/light stack | Decisions in state.json |

---

## D. Verification Checklist

- [x] Each epic is a major capability (not a single function)
- [x] MVP features appear in E1–E6
- [x] Mandatory constraints are recorded in `.agents/state.json` → `decisions`
- [x] Later ideas are parked in E7–E8 (not mixed into MVP epics)
- [x] Each epic can be split into milestones later
- [x] No epic is “build the whole backend layer” without a user outcome
- [x] User confirmed this map

---

## E. Next Step

1. Report: [`council-report-epics-milestones.md`](council-report-epics-milestones.md)
2. Milestones: [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md)
3. Resume: [`.agents/state.json`](.agents/state.json) → **E10 Right rail** after E9; prior MVP + Later slices shipped except skipped E8.M2

**Order:** `E0.M3 → E0.M4 → E0.M5 → E1 → E2 → E3.M1–M2 → E3.M6 → E6.M0 → E4.M1 → (E4.M2 ∥ E5) → E3.M3 → E4.M3 → E3.M5 → E6.M1–M2 → Later: E3.M4, E5.M3, E5.M4, E7, E8 → E9 → E10`

