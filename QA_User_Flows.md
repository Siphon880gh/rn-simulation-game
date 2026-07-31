# QA User Flows — Learning Goals

Click-path scripts that map **learning goals** → **exact UI actions** in the RN Simulation Game.

**Entry:** serve the repo over HTTP, then open `game/index.html` (not `file://`).

**Recommended QA seed:**

```text
http://localhost:8765/game/index.html?speed-factor=48
```

| Control | Where | Notes |
|---------|--------|--------|
| Demo presets | Brand area links `quick night` / `quick day` | Reloads with URL params |
| Test mode | Brand **Test** flask when `game/test-mode.json` has `"enabled": true` | Opens modal to spawn incidents (critical labs, call light, bed alarm, dynamic) |
| Sound | `#shell-sound-toggle` next to Pause | Mute/unmute call-light + bed alarms (persists) |
| Clock / Pause | Top-right `#clock` / `#pause` | Pause freezes shift time |
| Hour tabs | `#shell-hour-tabs` (`19:00` …) | Hover = truncated peek; click = pause + full hour modal (does not scrub time) |
| Patient tabs | Left `#patient-tabs` | Room + name; swaps clinical panel |
| Global tab | Last tab in census list | Doctor-orders checks live here |
| Task Perform | **Left-click** an active task tile | Opens menu: **Perform** / **Details** (not right-click) |
| Slots / wait queue | Bottom `#task-queue-bar` / `#slot-waiting-queue` | Max 3 concurrent; overflow FIFO |
| Shift log | Bottom `#shift-history-log` | Append-only event history |
| Score | `#shell-score` | Practice score live cue |
| Docs FAB | Bottom-right Docs chip | Players / Learning / Developers MD |
| Debrief | Auto at shift end | Modal: outcome bands + by-patient notes |

**Fiction disclaimer** stays in `#fiction-disclaimer` (pack note is separate under the title).

---

## Learning goals (canonical)

Aligned with [`docs/players/ABOUT.md`](docs/players/ABOUT.md) and scenario pack `learningObjectives`.

| ID | Learning goal |
|----|----------------|
| **LG-1** | Orient to the accelerated military clock, pause, and fiction/educational framing |
| **LG-2** | Prioritize timed work under limited concurrent task slots |
| **LG-3** | Triage multi-patient workload by switching clinical panels |
| **LG-4** | Use chart history (past hx) to support safe sequencing |
| **LG-5** | Complete a medication identity check before high-risk med execution |
| **LG-6** | Respect availability windows (cannot Perform outside the open window) |
| **LG-7** | Complete hourly doctor-orders checks from the Global panel |
| **LG-8** | Win the bed-prep admission challenge to complete that task |
| **LG-9** | Respond to emergent drip / Code Blue practice when it fires |
| **LG-10** | Use Help/Docs learning content (markdown + wiki links) |
| **LG-11** | Reflect on prioritization via end-of-shift practice debrief |
| **LG-12** | Compare night vs day scenario packs (demo presets) |

---

## Flow index

| Flow | Goals | Seed URL | Approx wall time |
|------|-------|----------|------------------|
| [UF-01 Orient shell](#uf-01--orient-shell--disclaimer) | LG-1 | `?speed-factor=48` | 1 min |
| [UF-02 Med perform + slot](#uf-02--med-perform--identity--slot) | LG-2, LG-5 | `?speed-factor=48` | 2–4 min |
| [UF-03 Multi-patient triage](#uf-03--multi-patient-panel-triage) | LG-3, LG-2 | `?speed-factor=48` | 3–5 min |
| [UF-04 Chart history](#uf-04--chart-history-past-hx) | LG-4 | `?speed-factor=48` | 1–2 min |
| [UF-05 Availability window](#uf-05--availability-window-gate) | LG-6 | `?speed-factor=48` | 2 min |
| [UF-06 Doctor orders](#uf-06--hourly-doctor-orders) | LG-7 | `?speed-factor=48` | 2 min |
| [UF-07 Bed prep](#uf-07--bed-prep-admission-challenge) | LG-8 | `?speed-factor=48` | 3–5 min |
| [UF-08 Emergency / Code Blue](#uf-08--emergency-drip--code-blue) | LG-9 | `?speed-factor=48` (or wait for escalate) | variable |
| [UF-09 Docs learning](#uf-09--docs--learning-markdown) | LG-10 | any | 2 min |
| [UF-10 Shift debrief](#uf-10--end-of-shift-debrief) | LG-11, LG-2 | `?speed-factor=360` (fast end) or wait | until GAME_OVER |
| [UF-11 Day pack swap](#uf-11--day-shift-pack-swap) | LG-12 | click `quick day` | 1 min |

---

## UF-01 — Orient shell + disclaimer

**Goals:** LG-1

### Steps

1. Open `http://localhost:8765/game/index.html?speed-factor=48`.
2. Read brand **ICU Simulation** and `#fiction-disclaimer` (fictional + educational-only language).
3. Confirm scenario title shows (default: **Night Shift — Medical-Surgical Floor**).
4. Confirm **Pack learning objectives** list is visible under the title.
5. Watch `#clock` advance in military style (e.g. `19:xx`).
6. Click **Pause** → label becomes **Resume**; clock stops advancing.
7. Click **Resume** → clock resumes.
8. Click the clock tile once → **Shift ends on** detail toggles visible/hidden.
9. Hover hour tab **19:00** → truncated peek popover. Click → shift pauses and full hour-peek modal opens; **Resume shift** (or Esc) clears modal pause. Clock is not scrubbed.

### Pass criteria

- Disclaimer and pack objectives visible without opening Docs.
- Pause / Resume toggles correctly.
- Census tabs show 6 patients + **Global**.

---

## UF-02 — Med Perform → identity → slot

**Goals:** LG-2, LG-5

**Setup:** Night pack; advance to ~19:30 so Joe’s **Heparin (SQ bridge)** (`data-scheduled="1930"`) is `active`. Or use another active med with a brand↔generic identity quiz (e.g. Aspirin → Bayer/Ecotrin/Bufferin).

### Steps

1. Open quick-night seed (`?speed-factor=48`).
2. Confirm left census tab **201-A Joe Johnson** is selected (or click it).
3. In Joe’s panel, find **Medications** (list should start open).
4. Find the **Heparin (SQ bridge)** tile with green/active status and a **Click · Perform** cue (after 19:30).
5. **Left-click** the Heparin tile → context menu shows **Perform** and **Details**.
6. Click **Perform**.
7. Observe:
   - Modal **Heparin safety** (skill MCQ) opens — one clinical question by default (antidote, aPTT/platelets, HIT, or bleeding).
   - Optional: expand **I want to feel challenged** to answer more questions for boosters.
   - `#pause` shows **Resume** (challenge pause).
8. Select the correct multiple-choice answer.
9. Click the choice (or submit if prompted).
10. Observe Heparin occupying a bottom **task slot** with a progress / end timemark.
11. Wait for slot completion → task status becomes completed; score/log may update.

### Fail / retry path (also PASS if behavior matches)

1. Click **Perform** again on an active med.
2. Submit a wrong answer → feedback says task was not started; may retry Perform.
3. Click **Cancel** → modal closes; shift timer resumes; task still active (not slotted).

### Pass criteria

- Challenge pauses the shift clock.
- Correct answer → slot assignment (or waiting queue if all 3 slots full).
- Wrong answer → no slot start.

---

## UF-03 — Multi-patient panel triage

**Goals:** LG-3, LG-2

### Steps

1. From quick-night seed with Joe active.
2. Click census tab **202-B Robert Hale**.
3. Confirm Robert’s panel is foreground (Joe hidden/dimmed behind swap).
4. Open/confirm **Medications**; note **Aspirin** (1900) if still in window.
5. Click **205-C Aisha Rahman** → panel swaps to Aisha.
6. Click **Global**.
7. Confirm **Shift overview** + **Doctor orders checks** list is visible.
8. Click **201-A Joe Johnson** again → return to Joe.
9. Start enough concurrent Performs (meds/assessments) to fill **3 slots**.
10. Start one more Perform that passes its gate → task appears in **Waiting queue** (FIFO).
11. When a slot frees, waiting task auto-assigns.

### Pass criteria

- Only one patient (or Global) is interactive at a time.
- Slots max at 3; overflow enters waiting queue and drains FIFO.

---

## UF-04 — Chart history (past hx)

**Goals:** LG-4

### Steps

1. Select **201-A Joe Johnson**.
2. Click heading **Chart history (past hx)**.
3. Confirm the past-hx panel expands (was hidden).
4. Confirm a TimelineJS timeline mounts inside the panel (events for Joe load).
5. Collapse the heading again → panel hides.
6. Optional: repeat on **206-A Lin Chen** to confirm per-patient packs.

### Pass criteria

- Timeline initializes on first open (lazy), not as a blank forever-empty box.
- Toggle open/close works without breaking the patient tab.

---

## UF-05 — Availability window gate

**Goals:** LG-6

### Steps

1. On Joe, locate a med that is still **not-yet** (dimmed), e.g. **Atorvastatin** scheduled `2100` while clock is ~19xx.
2. Left-click it → either no Perform menu, or **Perform** disabled / labeled outside window.
3. Locate an **active** med inside its window (Heparin early shift, or wait until scheduled).
4. Confirm **Perform** is enabled.
5. Optional: open **Details** on an active task → alert shows duration + expire.

### Pass criteria

- Outside window: cannot start Perform.
- Inside window: Perform enabled; phase cue may show on the tile (`data-window-phase`).

---

## UF-06 — Hourly doctor orders

**Goals:** LG-7

### Steps

1. At ~19:00 hour, click **Global**.
2. Under **Doctor orders checks**, find **Check doctor orders (H1)** (window for the hour).
3. Left-click the active orders tile → menu **Check orders** (or Perform).
4. Click **Check orders**.
5. Confirm task completes (no med-identity quiz; no slot occupancy for this type).
6. Confirm a line appears in **shift history log** and/or status messaging about the orders check.

### Pass criteria

- Orders check is reachable from Global.
- Completing it does not open the med identity quiz.

---

## UF-07 — Bed prep admission challenge

**Goals:** LG-8

**Setup:** Wait until ~19:30 game time (or keep watching Lin), or use a slower speed if you need more wall time to react.

### Steps

1. Click census tab **206-A Lin Chen**.
2. Under **Admission / bed prep**, find **Bed prep for admission** when status is `active`.
3. Left-click the tile → **Perform**.
4. Complete the bed-prep **Gather these items** challenge (watch flash, select required items — order does not matter — **Submit gather**).
5. On win: task completes (win-to-complete; not a normal slot finish path).
6. On fail / cancel: task remains incomplete; may retry Perform later while still in window.

### Pass criteria

- Fail does not mark bed prep completed.
- Win marks completed and logs the event.

---

## UF-08 — Emergency drip + Code Blue

**Goals:** LG-9

**Notes:** Timed drip events (e.g. rapid response ~20:00, labs ~21:30) and deterioration → Code Blue are scenario/chaos driven. Use `speed-factor=48` and watch the **shift history log** + **Incidents** list.

### Steps

1. Run quick-night; leave clock running (or Pause only when inspecting UI).
2. Watch `#shift-history-log` for drip messages (rapid response / lab / chaos lines).
3. When an injected assessment appears (e.g. Maria rapid-response), click that patient’s tab.
4. Left-click the new **assessment** tile when active → **Perform** → confirm it takes a slot (no med quiz).
5. If **Code Blue** challenge opens (from escalate hook):
   - Confirm challenge pause (Resume on pause button).
   - Order the BLS priority items → **Submit order**.
   - Pass/fail feedback matches practice framing (not a real competency cert).

### Pass criteria

- Drip messages appear in the log without manual spawn.
- Assessment Perform uses slots, not med identity.
- Code Blue, when it fires, is modal + pause-gated.

**HUMAN_REQUIRED:** exact Code Blue fire time can vary with deterioration; do not fail the whole suite if escalate did not trigger in one short run — record `SKIP_TIMING` and re-run with longer observation or lower speed only if debugging that hook.

---

## UF-09 — Docs + learning markdown

**Goals:** LG-10

### Steps

1. Click the bottom-right **Docs** FAB (expands on hover; click to open dropdown).
2. Under **Players**, open **ABOUT**.
3. Confirm disclaimer + learning objectives render in the in-page viewer.
4. Under **Learning**, open **PRIORITIZATION BASICS**.
5. Confirm markdown renders (headings, mermaid flowchart, KaTeX if present).
6. Hover an internal wiki link (e.g. `[[About]]`) → Preview / Contents popover appears.
7. Close the docs viewer and return to the shell (clock still running or paused as left).

### Pass criteria

- Docs open in-page (not a blocked popup).
- Learning MD renders; wiki hover preview works.

---

## UF-10 — End-of-shift debrief

**Goals:** LG-11, LG-2

**Fast seed (optional):**

```text
http://localhost:8765/game/index.html?speed-factor=360
```

(~3 minutes wall for a 12h shift). Or let `speed-factor=48` finish (~15 min).

### Steps

1. Open a seed and optionally complete a few tasks (meds / orders) so debrief lists are non-empty.
2. Wait until the shift timer exhausts → `GAME_OVER`.
3. Confirm modal **Shift debrief — practice outcome** opens.
4. Read outcome band, score block, counts (Completed / Late / Missed).
5. Skim **By patient**, task lists, **Teaching notes**, and **Recent shift log**.
6. Click **Close**.

### Pass criteria

- Debrief opens automatically at shift end (not a bare empty game-over stub).
- Practice / ethics framing language is present (training, not certification).

---

## UF-11 — Day shift pack swap

**Goals:** LG-12

### Steps

1. From any loaded night shift, click Demo link **quick day**.
2. Confirm URL includes `scenario=events/scenarios/day-shift-medsurg.json` and `speed-factor=48`.
3. Confirm scenario title / objectives update for the day pack.
4. Confirm census still loads patient tabs.
5. Optional: click **quick night** to return to default night pack.

### Pass criteria

- Pack swap reloads content without a blank shell.
- Fiction disclaimer remains present.

---

## Suggested teaching path (single sitting)

Run in order for a ~20 minute portfolio demo:

1. UF-01 Orient  
2. UF-09 Docs (ABOUT + prioritization)  
3. UF-02 Med identity + slot  
4. UF-03 Panel triage + slot pressure  
5. UF-06 Doctor orders  
6. UF-04 Past hx  
7. UF-07 Bed prep (when Lin’s window opens)  
8. UF-10 Debrief (use `speed-factor=360` if short on time)

---

## QA notes for agents

- **Perform is left-click**, not right-click (`jquery-contextMenu` `trigger: 'left'`).
- Medications lists are opened by default after patient init; headings still toggle.
- Active performable tiles show a **Click · Perform** badge.
- Prefer AUTO checks via browser automation + DOM assertions; mark timing-sensitive escalate paths HUMAN_REQUIRED / `SKIP_TIMING` when the event did not fire in-window.
- Do not treat this file as a runtime Help doc unless later wired into `docs.js`.

### Related

- Player objectives: [`docs/players/ABOUT.md`](docs/players/ABOUT.md)
- Loop runner: [`AGENTS_LOOP_QA_User_Flows.md`](AGENTS_LOOP_QA_User_Flows.md)
- Code maps: [`AGENTS_CODE_REFERENCE.md`](AGENTS_CODE_REFERENCE.md)
