# Milestone continue loop

Use with Cursor `/loop` (dynamic pacing — no interval). Each tick runs one continue cycle. Outer iterations are infinite; the human stops the process.

Canonical autonomy rules live in [`AGENTS-MILESTONES-TURNS.md`](../AGENTS-MILESTONES-TURNS.md) (Step 3b + Step 6) and [`AGENTS.md`](../AGENTS.md) Session Continuation Rule. This file is the pasteable loop body.

## Loop prompt

```markdown
# OBJECTIVE
Advance the RN Simulation Game through the milestone backlog until every implementable
milestone in `decisions.implementation_order` (excluding Later / `mvp_exclusions`) is
complete — or until a STOP condition fires.

**Done (outer loop):** no remaining implementable milestones in `.agents/state.json`.
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

## Invoke

```text
/loop
<paste the Loop prompt fenced block above>
```
