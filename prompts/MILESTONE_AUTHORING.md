# Milestone Authoring (After Epic Approval)

Use this **only after** the user confirms the epic map in [`EPIC_MAP.md`](../EPIC_MAP.md).

Epics = major capability areas.  
Milestones = sequenced implementation slices inside an approved epic.

Do **not** invent milestones for epics the user has not approved.

---

## Self-Tracking (Required)

Before starting a milestone, read `.agents/state.json`.

At session start, update:

```json
{
  "current_epic_id": "E[n]",
  "current_milestone_id": "E[n].M[k]",
  "status": "in_progress",
  "last_updated_iso": "[ISO_TIMESTAMP]"
}
```

When the milestone’s acceptance checks pass, update:

```json
{
  "status": "ready_for_review",
  "completed": ["…existing…", "E[n].M[k]"],
  "last_updated_iso": "[ISO_TIMESTAMP]"
}
```

Also append or check off the matching story in [`IMPLEMENTATION_STORIES.md`](../IMPLEMENTATION_STORIES.md).

If `.agents/state.json` is missing or stale relative to the work you claim to finish, the milestone is **incomplete**.

---

## The 5-Block Structure

Every milestone prompt should include these 5 sections:

### 1. Context + Goal

```markdown
## Context
[What exists now. What problem this solves. Why it matters.]

## Goal
[What this milestone delivers. Be specific and concrete.]
```

### 2. Non-Goals

```markdown
## Non-Goals
- ❌ Do NOT implement [future feature]
- ❌ Do NOT refactor [unrelated system]
- ❌ Do NOT add [nice-to-have]
- ❌ Do NOT change [stable component]
```

For every feature you want, write 2–3 things you explicitly don’t want yet.

### 3. Contracts / Interfaces

Define data shapes, function signatures, and stable APIs before implementation.

### 4. File Map

| File | Action | Purpose |
|------|--------|---------|
| `path/file.js` | CREATE / MODIFY | … |

Include files that must **not** be touched.

### 5. Acceptance Checks

Concrete, testable checkboxes. If you can’t verify in ~5 minutes, split the milestone.

---

## Epic Alignment Block

Every milestone prompt must also include:

```markdown
## Epic alignment
- Epic: E[n] — [epic name from EPIC_MAP.md]
- Story IDs: [from IMPLEMENTATION_STORIES.md]
- State file: .agents/state.json → set current_milestone_id
```

---

## Sequencing Rules

1. Each milestone must leave the app runnable/reviewable.
2. Dependencies flow forward only.
3. Prefer vertical slices (one capability end-to-end) over horizontal layers.
4. Ideal size: roughly one feature across a few files — not a single function, not a whole epic.

---

## Template: Minimal Milestone

```markdown
# E[n].M[k]: [Feature Name]

## Epic alignment
- Epic: E[n] — [name]
- Stories: S[…]

## Context
[1–2 sentences]

## Goal
[Specific deliverable]

## Non-Goals
- ❌ …
- ❌ …
- ❌ …

## Constraints
- Follow standing product/tech decisions in .agents/state.json → decisions
- No new dependencies unless Goal requires them

## File Map
| File | Action | Purpose |
|------|--------|---------|
| `…` | CREATE/MODIFY | … |

## Contracts
```typescript
// Key interfaces
```

## Acceptance Checks
- [ ] …
- [ ] …

## State Update
Update `.agents/state.json` and check off stories in `IMPLEMENTATION_STORIES.md`.

## Output Format
Return: file tree, code per file, test steps, proposed state.json patch.
```

---

## Standing Constraints (RN Shift Sim)

Carry these unless a milestone Goal explicitly changes a recorded decision:

- Prefer vanilla JS / jQuery or a light reactive layer (Petite-Vue / Alpine); do **not** introduce React, Ink, or Twine unless the Goal says so.
- Browser ES6 modules (`app.js` entry); loose coupling via signals or pub/sub.
- Game time ≠ wall clock; display military shift time; keep `TOTAL_DAYS` / speed-factor knobs.
- Panels over many floating windows; clinical framing (not RPG health/inventory).
- Names and scenarios are fictional.
- Do not expand into login, friends, or auth until a Later epic is approved and active.
