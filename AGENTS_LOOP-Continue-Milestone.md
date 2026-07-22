# AGENTS_LOOP — Continue Milestone

Autonomous continue loop for the RN Simulation Game milestone backlog.

Each tick = one **continue** cycle (implement → AUTO verify → advance). Outer iterations are infinite; you stop the agent/process when you want. Inner fix budget is 10 rounds per failure cluster.

Canonical autonomy rules: [`AGENTS-MILESTONES-TURNS.md`](AGENTS-MILESTONES-TURNS.md) (Step 3b + Step 6), [`AGENTS.md`](AGENTS.md) Session Continuation Rule. This file is the pasteable loop body plus how to run it.

---

## How to run

### Recommended (Cursor `/loop`, dynamic)

1. Open this repo in Cursor Agent.
2. In chat, start a loop with **no interval** (dynamic self-pacing) and point at this file:

```text
/loop Read AGENTS_LOOP-Continue-Milestone.md and execute one continue tick from the Loop prompt section. After PASS, schedule the next tick immediately (dynamic). Stop only on STOP_* labels in that file.
```

3. On the first tick the agent should:
   - read `.agents/state.json`
   - continue `current_milestone_id`
   - AUTO-verify and advance when possible
   - emit a short tick report
4. Leave the session running. Stop the loop when you want (ask the agent to stop, or stop the chat/process).
5. If you see `STOP_HUMAN`, `STOP_FIX_BUDGET`, or `STOP_BLOCKED`, read the handoff and take over; restart `/loop` after you unblock.

**Why dynamic (no `5m`):** milestone work is bursty. Fixed intervals waste idle wakes or cut off long implement/fix ticks. Dynamic mode re-arms after each tick finishes.

### Alternative: fixed interval

Use only if you want a heartbeat while something else is waiting (e.g. long install):

```text
/loop 10m Read AGENTS_LOOP-Continue-Milestone.md and execute one continue tick from the Loop prompt section.
```

Prefer dynamic for normal milestone grinding.

### Alternative: manual continue (no `/loop`)

Paste once per turn (or say **continue**):

```text
Follow AGENTS_LOOP-Continue-Milestone.md. Run one continue tick now.
```

Without `/loop`, you must send the next message yourself each time.

### Before you start

- Working tree should be clean enough that the agent will not mix unrelated WIP (or tell it which files are off-limits).
- Commit permission: by default the loop **suggests** commits only; say explicitly if it may `git commit` / `git push`.
- Optional: allow creating/updating skills under `.agents/skills/*` when the same fix/verify pattern repeats.

### When it should stop (expected)

| Label | Meaning |
|-------|---------|
| `STOP_HUMAN` | True HUMAN_REQUIRED checks, or `blocked_waiting_user` |
| `STOP_FIX_BUDGET` | Same failure cluster failed 10 fix rounds |
| `STOP_BLOCKED` | Locked constraint / unapproved stack swap / missing critical info |

It should **not** stop merely because status is `verification_ready` if AUTO checks can pass.

---

## Loop prompt

```markdown
# OBJECTIVE
Advance the RN Simulation Game through the milestone backlog until every implementable
milestone in `decisions.implementation_order` (excluding Later / `mvp_exclusions`) is
complete — or until a STOP condition fires.

**Done (outer loop):** no remaining implementable milestones in `.agents/state.json`
(including post-MVP **E10** Right rail when present).
**Done (single tick):** one continue cycle finished with AUTO verification; advanced or STOP.

# CONTEXT
- Follow `AGENTS.md` reading priority and `AGENTS-MILESTONES-TURNS.md` (Step 3b autonomous continue).
- Start each tick: `.agents/state.json` → stories/maps → implement notes → stamped `decisions.*`.
- Code maps: `AGENTS_CODE_REFERENCE.md` + companions before source; refresh maps only at commit points.
- Do not commit/push unless the user explicitly allowed it this session.
- Optional skills: `.agents/skills/*` — create/adapt when the same continue/verify/fix pattern repeats.
  On skill failure, try a bounded hypothesis, then update the skill once it works; fork a new skill
  when adapting for a different purpose.

# STEP-BY-STEP CADENCE (one tick)
1. Orient from `.agents/state.json` and resolve status via `AGENTS-MILESTONES-TURNS.md`.
2. Continue `current_milestone_id` only (no future-milestone scope). Batch coherent edits.
3. Classify checklist items AUTO vs HUMAN_REQUIRED; run all AUTO checks.
4. On AUTO PASS and no HUMAN_REQUIRED: mark complete, start next milestone in-session.
5. On AUTO FAIL: inner fix loop up to 10 rounds (new errors count); then STOP_FIX_BUDGET handoff.
6. Update state/stories; suggest commit at good points; do not idle on `verification_ready` for AUTO items.
7. Short tick report; if not STOP’d, continue to the next tick.

# VERIFICATION RUBRIC
- PASS (tick): slice done + AUTO checks pass + state updated as needed.
- PASS (milestone): all required AUTO items pass; no HUMAN_REQUIRED left.
- FAIL: AUTO check fails after patches, or required AUTO check cannot be run.

Tick labels: `PASS` | `FAIL` | `STOP_HUMAN` | `STOP_FIX_BUDGET` | `STOP_BLOCKED`.

# STOP CONDITIONS / ESCAPE HATCHES
- Outer max iterations: Infinite (human stops the process).
- STOP_FIX_BUDGET: 10 failed fix rounds on the same failure cluster → handoff (commands, stderr,
  files touched, hypotheses, recommended next human step).
- STOP_HUMAN: true HUMAN_REQUIRED items, or `blocked_waiting_user`.
- STOP_BLOCKED: locked-constraint violation, unapproved stack swap, or missing critical info.
- Do not stop for ordinary `verification_ready` when AUTO coverage is enough.
- Do not alter unexpected third-party dependency sets unless the milestone + decisions require it.
- Do not reintroduce liveQuery/DOM-scraping task loops.

# TICK REPORT
### Loop tick
- Epic/Milestone/Status: …
- Action taken: …
- Auto verify: PASS/FAIL (commands + result)
- error_fix_round: n/10 (if fixing)
- Skills used/updated: … (or none)
- State change: …
- Next: continue <id> | STOP_<REASON>
```
