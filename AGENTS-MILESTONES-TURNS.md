# AGENTS-MILESTONES-TURNS.md

## Instructions for AI Agent

You are continuing development on an app project organized by milestones.

Where to refer to for milestones etc:
`EPIC_MAP.md` and `IMPLEMENTATION_STORIES.md`

Where to read code:
`AGENTS_CODE_REFERENCE*.md` which are high level overviews with approximate location cues

### Step 1: Read Current State

First, read the state file to understand where we are:

```
.agents/state.json
```

The state file contains:
- `current_milestone_id` — The milestone currently being worked on
- `status` — Current status (see table below)
- `completed` — Array of finished milestone IDs
- `app_name` / `decisions.app_name` — The application being built
- `decisions` — Tech stack and architectural decisions already made

### Step 2: Read Project Overview

Read the root `README.md` to understand:
- The app's purpose and target users
- The complete milestone list and order
- Folder structure mapping milestone IDs to folders (when used)

Also read `EPIC_MAP.md` and `IMPLEMENTATION_STORIES.md` for the epic/milestone backlog used in this repo.

### Step 3: Determine Action Based on Status

| Status | Action |
|--------|--------|
| `blocked_waiting_user` | **STOP.** Tell user what confirmation is needed. Do not proceed without explicit approval. |
| `in_progress` / `ready_to_implement` | Continue implementing the current milestone. Check `IMPLEMENTATION_STORIES.md` (and any milestone README) for remaining work. |
| `verification_ready` | Present the verification checklist to the user. Wait for confirmation before marking complete. |
| `complete` | Move to the next milestone. Update `current_milestone_id` and set status to `in_progress`. |

### Step 4: Locate Milestone Documentation

Prefer `IMPLEMENTATION_STORIES.md` for milestone goals/non-goals/stories. If a folder matching `current_milestone_id` exists, its `README.md` may include:
- **Deliverables** — What must be working when done
- **Interfaces/Contracts** — Types and APIs to implement
- **Files to Create** — Exact file paths and purposes
- **Verification Checklist** — All items must pass before completion

Also read any **implement notes** block for `current_milestone_id` in `IMPLEMENTATION_STORIES.md` (e.g. `**E0.M3 implement notes:**`).

### Step 4b: Read decision docs for the current milestone

Before implementing, read decision material linked from:

1. `IMPLEMENTATION_STORIES.md` → **implement notes** for `current_milestone_id`
2. [`AGENTS_POSSIBLE_DECISIONS_INDEX.md`](AGENTS_POSSIBLE_DECISIONS_INDEX.md) → row or milestone lookup for `current_milestone_id`
3. `.agents/state.json` → `decisions.decision_docs` (if present) for the current milestone

**Rules:**

- If `decisions.*` already stamps a choice (e.g. `game_runtime`, `context_menu_library`), follow the stamp — do not re-debate libraries or engines unless the milestone or user explicitly reopens the decision.
- If **no stamp exists** for the topic, read the decision doc, **pick the best fit**, implement, and **explain why** in the completion report (see [`AGENTS.md`](AGENTS.md) → Technology decisions). Stamp `decisions.<key>` in `state.json` when settled.
- Read only docs relevant to the **current** milestone; do not load every `AGENTS_POSSIBLE_DECISIONS__*` file every session.
- Do not violate locked constraints in `decisions.main_constraints` (e.g. no React/Ink/Twine unless user approved). Among allowed options, decide — do not stall for approval.
- Do not **swap away** from an stamped library or runtime without user approval.

When a decision milestone completes, stamp the outcome in `state.json` → `decisions` and add an entry to `decisions.decision_docs`.

### Step 5: Implement the Milestone

**Implementation Rules:**
1. Use the tech stack from `state.json` decisions
2. Create files one at a time, allowing human review between files
3. Follow existing code patterns if the codebase already has code
4. Do not skip ahead to future milestones
5. Do not implement features from later milestones
6. Reference `IMPLEMENTATION_STORIES.md` / milestone README for exact specifications
7. Read `AGENTS_CODE_REFERENCE.md` (and linked maps) before opening source

### Step 6: Update State When Complete

After all verification checklist items pass, update `.agents/state.json`:

**When code is ready for verification:**

```json
{
  "current_milestone_id": "<current>",
  "status": "verification_ready",
  "last_updated_iso": "<current ISO timestamp>"
}
```

**Ask user to verify the work:**
- Output a **verification checklist** the user can follow.
- Each verification item should include:
  - the exact page or route to visit
  - the exact button, link, tab, or control to click
  - the exact value or text to enter
  - the exact expected result
  - what to compare against
  - what the user should report back
- Where useful, include optional **DevTools Console** commands.
- Remind user they can ask for help with a specific verification step.

**When user confirms verification passed:**

```json
{
  "current_milestone_id": "<next milestone>",
  "status": "in_progress",
  "last_updated_iso": "<current ISO timestamp>",
  "completed": ["<all completed milestones including current>"]
}
```

And recommend a git commit message for these updates, but do not commit unless the user asks (or has granted commit permission).

---

## Completion Report Format

When you finish work on a milestone (or a work session), report to the user:

```markdown
## Work Completed

**Milestone:** [ID] - [Name]
**App:** [app_name from state.json]
**Status:** [new status]

### Files Created/Modified
- `path/to/file.ts` — Brief description
- ...

### What's Working Now
- Feature 1 is functional
- ...

### Technology decision *(include when this work picked or applied an `AGENTS_POSSIBLE_DECISIONS__*` choice)*

- **Topic:**
- **Choice:**
- **Why:**

### Verification Steps for Human

Please test the following:

1. [ ] [First verification item]
2. [ ] [Second verification item]
...

### Next Steps

Once you confirm the verification checklist passes:
- Reply "verified" to proceed to [next milestone]
- Or report any issues that need fixing
```

---

## Human Validation Checklist Template

### Quick Smoke Test
1. [ ] Application starts without errors
2. [ ] No console errors in browser DevTools (if web app)
3. [ ] New feature is accessible

### Functional Testing
- Follow the verification checklist items from the milestone docs
- Test each feature manually
- Try edge cases (empty inputs, invalid data, rapid interactions)

### Visual/UX Check
1. [ ] Layout matches expected design patterns
2. [ ] Responsive behavior is reasonable (if applicable)
3. [ ] Loading states are visible where appropriate
4. [ ] Error states are clear and helpful

### Code Quality (Optional)
1. [ ] No type errors (if using TypeScript)
2. [ ] Code follows project conventions
3. [ ] No obvious security issues

---

## Status Responses

### If `blocked_waiting_user`:

```
Development is paused at **[Milestone ID] - [Name]** awaiting your confirmation.

Please review the following and confirm:
[List items awaiting confirmation]

Reply with your confirmations or modifications to proceed.
```

### If `in_progress` / `ready_to_implement`:

```
Continuing development on **[Milestone ID] - [Name]**.

Current progress:
- [List what's done]
- [List what remains]

Proceeding with: [Next file or feature to implement]
```

### If `verification_ready`:

```
**[Milestone ID] - [Name]** is ready for verification.

Please test:
[Verification checklist]

Reply "verified" to proceed or describe any issues found.
```

---

## Quick Start Command

Copy and paste this to an AI agent to begin:

```
Read .agents/state.json, then EPIC_MAP.md and IMPLEMENTATION_STORIES.md.
Find the current milestone from current_milestone_id.
Read implement notes for that milestone and AGENTS_POSSIBLE_DECISIONS_INDEX.md (linked decision docs only).
Follow stamped decisions in state.json unless the milestone reopens them.
Read AGENTS_CODE_REFERENCE.md as needed.
Tell me the current status and either continue development or tell me what confirmation you need.
```

---

## State File Schema

```json
{
  "current_milestone_id": "string — ID of current milestone (e.g., E0.M3, E3.M2)",
  "status": "string — blocked_waiting_user | in_progress | ready_to_implement | verification_ready | complete",
  "last_updated_iso": "string — ISO 8601 timestamp",
  "app_name": "string — Name of the application being built",
  "decisions": {
    "key": "value — Architectural and tech stack decisions"
  },
  "completed": ["array — List of completed milestone IDs"]
}
```

---

## Milestone README Expected Structure

Each milestone README (when used) should contain:

```markdown
# [Milestone ID]: [Name]

> **Status:** [Current status]
> **Depends On:** [Previous milestone]
> **Unlocks:** [Next milestone]

## Deliverables
[What must be working when this milestone is complete]

## Interfaces / Contracts
[Types, API contracts, data structures]

## Files to Create
[Table of files with paths and purposes]

## Verification Checklist
[Checkbox list of testable requirements]

## UI States Covered (if applicable)
[List of states: empty, loading, error, success, etc.]

## Notes
[Any additional context or constraints]
```

---

## Error Recovery

| Situation | Action |
|-----------|--------|
| `state.json` missing | Create via `AGENTS-MILESTONES-INIT.md` or seed from `EPIC_MAP.md` / `IMPLEMENTATION_STORIES.md` |
| Milestone docs not found | Use `IMPLEMENTATION_STORIES.md`; ask user if still unclear |
| Verification checklist item fails | Report the failure, suggest fix, do not mark complete |
| Unclear requirements | Ask user for clarification before implementing |
| Conflicting instructions | Prioritize `IMPLEMENTATION_STORIES.md` / milestone README over general assumptions |
