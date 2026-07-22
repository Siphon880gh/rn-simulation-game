# AGENTS_LOOP — QA User Flows

Autonomous QA loop against [`QA_User_Flows.md`](QA_User_Flows.md).

Each tick = execute **one** user flow (or finish a multi-step flow already in progress), AUTO-verify, fix blockers when the flow proves a product bug, then advance. Outer iterations are infinite until STOP or all flows pass.

Canonical product rules: [`AGENTS.md`](AGENTS.md). Code maps before deep source edits: [`AGENTS_CODE_REFERENCE.md`](AGENTS_CODE_REFERENCE.md).

---

## How to run

### Recommended (Cursor `/loop`, dynamic)

```text
/loop Read AGENTS_LOOP_QA_User_Flows.md and execute one QA tick from the Loop prompt section. After PASS or SKIP_TIMING, schedule the next tick immediately (dynamic). Stop only on STOP_* labels in that file.
```

### Fixed interval (optional)

```text
/loop 8m Read AGENTS_LOOP_QA_User_Flows.md and execute one QA tick from the Loop prompt section.
```

Prefer **dynamic** — browser flows are bursty.

### Manual (no `/loop`)

```text
Follow AGENTS_LOOP_QA_User_Flows.md. Run one QA tick now.
```

### Before you start

- Serve the app over HTTP (ES modules). Example from repo root: `python3 -m http.server 8765` → `http://localhost:8765/game/index.html`.
- Ask whether the user’s existing server is already working before changing server setup.
- Working tree: avoid mixing unrelated WIP; or declare off-limits files.
- Commit permission: **suggest** commits only unless the user explicitly allows `git commit` / `git push`.
- Track progress in `.agents/qa-user-flows-state.json` (create if missing).

### When it should stop

| Label | Meaning |
|-------|---------|
| `STOP_HUMAN` | True HUMAN_REQUIRED steps (judgment/eyes), or user must operate the UI |
| `STOP_FIX_BUDGET` | Same failure cluster failed 10 fix rounds |
| `STOP_BLOCKED` | Locked constraint / missing server / cannot open game |
| `STOP_SUITE_PASS` | Every flow in the suite is `pass` or accepted `skip_timing` |

---

## Progress file

Create/update `.agents/qa-user-flows-state.json`:

```json
{
  "suite": "QA_User_Flows",
  "seed_default": "http://localhost:8765/game/index.html?speed-factor=48",
  "current_flow_id": "UF-01",
  "status": "in_progress",
  "last_updated_iso": "2026-07-22T00:00:00Z",
  "results": {
    "UF-01": { "status": "pending", "notes": "" },
    "UF-02": { "status": "pending", "notes": "" },
    "UF-03": { "status": "pending", "notes": "" },
    "UF-04": { "status": "pending", "notes": "" },
    "UF-05": { "status": "pending", "notes": "" },
    "UF-06": { "status": "pending", "notes": "" },
    "UF-07": { "status": "pending", "notes": "" },
    "UF-08": { "status": "pending", "notes": "" },
    "UF-09": { "status": "pending", "notes": "" },
    "UF-10": { "status": "pending", "notes": "" },
    "UF-11": { "status": "pending", "notes": "" }
  },
  "error_fix_round": 0,
  "notes": ""
}
```

Flow status values: `pending` | `pass` | `fail` | `skip_timing` | `blocked`.

Order: **UF-01 → UF-11** unless resuming a failed flow.

---

## Loop prompt

```markdown
# OBJECTIVE
QA the RN Simulation Game against every user flow in `QA_User_Flows.md` until
`STOP_SUITE_PASS` or a STOP_* handoff. One tick = one flow (or one focused fix
round for the current failing flow).

**Done (outer loop):** all flows `pass` or accepted `skip_timing` (UF-08 only).
**Done (single tick):** current flow verified + progress file updated + short report.

# CONTEXT
- Source of truth for steps/pass criteria: `QA_User_Flows.md`.
- Orient with `AGENTS_CODE_REFERENCE.md` (+ companions) before code fixes.
- Honor locked constraints in `.agents/state.json` → `decisions.*`
  (vanilla ES modules; declarative architecture; no React/engine swap).
- Prefer browser automation (Cursor browser MCP) + DOM/`Runtime.evaluate` assertions.
- Do not commit/push unless the user explicitly allowed it this session.
- Do not reintroduce liveQuery/DOM-scraping task activation loops.

# STEP-BY-STEP CADENCE (one tick)
1. Read `.agents/qa-user-flows-state.json` (create from template above if missing).
2. Pick `current_flow_id` (first non-pass/non-skip, or the in-progress fail).
3. Ensure HTTP server can serve `game/index.html`. If unsure the user’s server
   works, ask once; otherwise reuse an already-running local static server.
4. Open the flow’s seed URL from `QA_User_Flows.md`.
5. Execute the flow steps literally (left-click Perform, expand sections as written).
6. Classify checks:
   - AUTO: DOM presence, status attrs, modal titles, slot occupancy, pause label,
     docs render, pack title, tab selection, log lines when deterministic.
   - HUMAN_REQUIRED / SKIP_TIMING: only UF-08 escalate timing (or true visual judgment).
7. On PASS: mark flow `pass`, set next `current_flow_id`, clear `error_fix_round`.
8. On FAIL that is a product bug: patch the smallest fix; re-run the same flow;
   increment `error_fix_round` (max 10) → then `STOP_FIX_BUDGET`.
9. On FAIL that is an environment issue (no server, CDN blocked): `STOP_BLOCKED`.
10. On UF-08 with no escalate in a reasonable observation window: `skip_timing`
    (do not burn fix budget); note how to re-check.
11. Update `.agents/qa-user-flows-state.json` every tick.
12. Short tick report. If suite complete → `STOP_SUITE_PASS`.
13. At a good commit point after meaningful product fixes: refresh
    `AGENTS_CODE_REFERENCE*.md` per AGENTS.md, then **suggest** a commit message
    (do not commit unless allowed).

# VERIFICATION RUBRIC
- PASS (flow): all listed Pass criteria observed; no contradicting DOM state.
- PASS (suite): every flow `pass` or accepted `skip_timing`.
- FAIL: step cannot be completed or Pass criteria violated after patches.
- SKIP_TIMING: UF-08 only, when Code Blue/escalate did not fire in-window.

Tick labels: `PASS` | `FAIL` | `SKIP_TIMING` | `STOP_HUMAN` | `STOP_FIX_BUDGET`
| `STOP_BLOCKED` | `STOP_SUITE_PASS`.

# STOP CONDITIONS / ESCAPE HATCHES
- Outer max iterations: Infinite (human stops the process).
- STOP_FIX_BUDGET: 10 failed fix rounds on the same failure cluster.
- STOP_HUMAN: unavoidable HUMAN_REQUIRED (rare; prefer SKIP_TIMING for UF-08).
- STOP_BLOCKED: cannot serve/load game, or locked-constraint conflict.
- STOP_SUITE_PASS: suite complete.
- Do not invent new learning goals mid-loop; update `QA_User_Flows.md` only when
  a real UI contract changed and the flow steps are wrong.

# TICK REPORT
### QA loop tick
- Flow: UF-xx — title
- Action taken: …
- Auto verify: PASS/FAIL/SKIP_TIMING (evidence: selectors, modal text, slot state)
- error_fix_round: n/10 (if fixing)
- Product fix: none | files touched
- State change: results.UF-xx → …
- Next: UF-yy | STOP_<REASON>
```
