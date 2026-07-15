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
| **One-liner** | Experience a fast-paced 12-hour nursing shift: manage patients, timed tasks, and emergent load without slipping into overtime. |
| **Platform** | Web (browser, ES6 modules, no required build step) |
| **Target users** | Nursing students, early-career RNs, educators exploring prioritization practice; also portfolio / demo viewers |
| **Success signal** | Player completes (or fails) a shift with clear feedback on prioritization, timeliness, and task handling — feels like a real workload, not an RPG |

### Scope (assumptions — edit if wrong)

| Tier | Contents |
|------|----------|
| **MVP** | Accelerated shift clock; patient census + clinical panels; task schema with availability/expiry; 3 execution slots; at least one perform challenge; scoring + end-of-shift debrief; one playable scenario pack |
| **Mandatory** | Fictional names/scenarios disclaimer; military time; panels-first UI; vanilla/light stack (no React unless approved) |
| **Later** | Chaos/incident packs, richer art, many shifts/complications, auth/friends, 3D/motion polish |

---

## User Needs (Grounding)

### Use-based
- Run a full accelerated shift and see tasks appear/expire on game time
- Manage multiple patients and know what is due for whom
- Start work that occupies limited attention (slots) for a duration
- Face emergent / urgent work that disrupts the plan
- Get a score/debrief that reflects prioritization quality

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
2. **Primary loop:** Watch game time → scan due tasks → Perform (optional challenge) → occupy slot → complete/miss → react to new orders/urgents → end shift → debrief
3. **Secondary:** Adjust speed factor / shift start; open patient tabs; task details via context menu; docs/about
4. **Errors / edges:** All slots full; task expired; challenge fail; missing patient content; timer pause during modal

### State & persistence
| Kind | Plan |
|------|------|
| Business data | Patients, tasks, scenario events (content files / HTML data attrs; later YAML) |
| Settings | Speed factor, shift start (URL/query or config) |
| Temporary UI | Active tab, open modal, slot progress, context menu |
| Offline | Fully client-side play for MVP; no server required |

### UI states
Empty · Loading · Error · Success/confirm · First-run · Edge (slots full, overdue, challenge fail)

---

## A. Suggested Epic List

| Epic ID | Epic Name | Goal / Outcome | Includes | Derived From | Priority |
|--------|-----------|----------------|----------|--------------|----------|
| E0 | Planning & Decisions | Stable product/tech decisions + tracking | Epic map, state.json, story backlog, game-runtime/engine decision | Process | Mandatory |
| E1 | Shift Shell & Clock | Player is inside a running shift with trustworthy time | Timer, speed factor, military display, panel chrome | MVP / usability | MVP |
| E2 | Patient Census & Clinical Panels | Player can see who they have and clinical status surfaces | Patient load, tabs, vitals/meds/panels, multi-patient layout | Use needs / ICP | MVP |
| E3 | Task Queue & Slot Execution | Player prioritizes timed work under concurrency limits | Schema, availability windows, slots, interactions, urgent spawn | MVP core loop | MVP |
| E4 | Scenario & Event Pipeline | Shift content can drip and vary without code rewrites | Scenario packs, event unlocks, hourly orders, acuity hooks | Content / educator ICP | MVP |
| E5 | Perform Challenges | High-stakes tasks require a focused pass/fail action | Mini-games (e.g. med quiz), timer pause, retry rules | MVP / learning | MVP |
| E6 | Scoring & Shift Debrief | Player knows how the shift went | Points, grades, live feedback, end summary | Success signal | MVP |
| E7 | Chaos, Presentation & Content Scale | Harder, richer, more replayable shifts | Art, chaos packs, incidents, more shifts/complications | Later wishlist | Later |
| E8 | Portfolio Packaging & Optional Social | Ship/share beyond local demo | Polish, packaging; optional auth/friends | Later / social | Later |

---

## B. Epic Details

### E0. Planning & Decisions
- **Goal / user outcome:** Agents and humans share one epic map and resume state.
- **Why:** Prevents full-app one-shots and architectural drift.
- **Includes:** This file, `.agents/state.json`, `IMPLEMENTATION_STORIES.md`, prompt guidelines, **E0.M3 runtime stamp**, **E0.M4 disclaimer + learning objectives**.
- **Dependencies:** None.
- **Risks / unknowns:** Scope assumptions may need user edits; engine choice affects E3+ cost.
- **Out of scope:** Implementing an engine or migrating frameworks inside E0 (decision only).
- **Suggested order:** First — always; **E0.M3 → E0.M4** before heavy E3 work.

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
- **Includes:** Patient loading, tabs (patient + global), vitals/meds/status panels, 4–6 patient layout path.
- **Dependencies:** E1 shell.
- **Risks / unknowns:** How dense panels get before art epic.
- **Out of scope:** Full scenario authoring DSL; social.
- **Suggested order:** 2 (partially exists).

### E3. Task Queue & Slot Execution
- **Goal / user outcome:** Player chooses what to do under time and concurrency pressure.
- **Why:** Core skill of the product — prioritization under load.
- **Includes:** Task class/type/duration schema; availability windows; 3 slots + progress; thin urgents; miss/overdue. **Class interactions (E3.M4) deferred to Later.**
- **Dependencies:** E1, E2.
- **Risks / unknowns:** UX when all slots full.
- **Out of scope:** Full mini-game suite; multiplayer; MVP class-interaction math.
- **Suggested order:** 3 — primary MVP epic (through M3 + M5; not M4).

### E4. Scenario & Event Pipeline
- **Goal / user outcome:** Shifts feel authored and replayable via content, not hard-coded one-offs.
- **Why:** Educators and replay need content packs and drip events.
- **Includes:** One loadable pack (JSON/HTML) with objectives + fiction disclaimer; light timed drip. **Hourly/acuity (E4.M3) deferred to Later.**
- **Dependencies:** E1–E3 for runtime hooks.
- **Risks / unknowns:** Authoring format choice; content volume.
- **Out of scope:** AI-generated shifts; full library; YAML required for MVP.
- **Suggested order:** After E3.M2 + thin E6.M0.

### E5. Perform Challenges
- **Goal / user outcome:** Some tasks demand attention (pass to start; fail blocks slot assign).
- **Why:** Reinforces safe practice moments (e.g. med identity) inside the time pressure.
- **Includes:** Challenge modal, timer pause, med quiz vertical slice, retry behavior.
- **Dependencies:** E3 perform path.
- **Risks / unknowns:** Which task types require challenges first.
- **Out of scope:** Full challenge suite for every task type.
- **Suggested order:** After E3 perform wiring.

### E6. Scoring & Shift Debrief
- **Goal / user outcome:** Clear feedback on how the shift went.
- **Why:** Success signal and learning loop closure.
- **Includes:** Points/grades, real-time feedback hooks, end-of-shift summary.
- **Dependencies:** E3 (and ideally E5 outcomes).
- **Risks / unknowns:** Scoring weights vs “feel fair.”
- **Out of scope:** Leaderboards, accounts.
- **Suggested order:** After core task loop is playable.

### E7. Chaos, Presentation & Content Scale
- **Goal / user outcome:** Harder emergent play and stronger presence.
- **Why:** Replay and teaching depth beyond the first pack.
- **Includes:** Background/art, chaos scenario pack, emergent incidents, more shifts/complications.
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

---

## C. Coverage Check

| Requirement area | Covered by |
|------------------|------------|
| Accelerated 12h shift clock | E1 |
| Multi-patient clinical panels | E2 |
| Timed tasks, windows, slots, urgents | E3 |
| Scenario / orders drip | E4 |
| Med/perform challenges | E5 |
| Scoring & debrief | E6 |
| Chaos, art, content scale | E7 |
| Auth/friends / packaging | E8 |
| Fictional disclaimer + clinical tone | Decisions + all content epics |
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
3. Resume: [`.agents/state.json`](.agents/state.json) → **E0.M3** (stamp `keep_modular_app`), then **E0.M4**

**Order:** `E0.M3 → E0.M4 → E1 → E2 → E3.M1–M2 → E6.M0 → E4.M1 → (E4.M2 ∥ E5) → E3.M3 → E3.M5 → E6.M1–M2 → Later: E3.M4, E4.M3, E7, E8`

