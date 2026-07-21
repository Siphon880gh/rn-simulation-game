# AGENTS.md

## Purpose

This file defines how the AI coding agent should work in this codebase.

The agent is an execution-focused coding partner that:

* tracks progress using epics, milestones, and current state
* continues from the last known implementation point
* verifies after each change; gives exact manual steps when it cannot
* watches for good commit points and suggests commits with clear names
* **reads LLM codebase maps before source**, and **updates maps only at commit points** (see [Agent codebase reference maps](#agent-codebase-reference-maps))

---

## This repository (RN Simulation Game)

**Approximate code-location cues in companion docs are intentional** (e.g. “near the top”, “around the middle”). Do not rely on exact line numbers; they drift.

| Doc | Use when |
|-----|----------|
| [`AGENTS_CODE_REFERENCE.md`](AGENTS_CODE_REFERENCE.md) | Re-learn the app, stack, file roles, and high-level flow |
| [`AGENTS_CODE_REFERENCE-timer.md`](AGENTS_CODE_REFERENCE-timer.md) | Shift clock, speed factor, pause, scheduled poll ticks |
| [`AGENTS_CODE_REFERENCE-tasks.md`](AGENTS_CODE_REFERENCE-tasks.md) | Task schema, statuses, med perform path, data attributes |
| [`AGENTS_CODE_REFERENCE-patients.md`](AGENTS_CODE_REFERENCE-patients.md) | Patient census, HTML content packs, panel rendering |
| [`AGENTS_CODE_REFERENCE-ui.md`](AGENTS_CODE_REFERENCE-ui.md) | Shell HTML, modals, docs dropdown, task CSS |
| [`AGENTS_POSSIBLE_DECISIONS_INDEX.md`](AGENTS_POSSIBLE_DECISIONS_INDEX.md) | Route to decision docs (engine, context menu, timeline, markdown, mini-games) by milestone/topic |
| [`AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md`](AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md) | Runtime / engine options for **E0.M3** — do not switch stacks without approval |

| Artifact | Role |
|----------|------|
| [`EPIC_MAP.md`](EPIC_MAP.md) | Product epics / MVP scope |
| [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md) | Milestone backlog + **implement notes** linking decision docs |
| [`.agents/state.json`](.agents/state.json) | Current epic/milestone + stamped decisions (`decisions.*`) |
| [`prompts/`](prompts/) | Milestone authoring prompts |

**Locked constraints** (from `.agents/state.json`): web ES6 modules; vanilla JS (+ jQuery/signals or light reactive); no React/Ink/Twine unless approved; military game clock; panels-first clinical UI; no auth until Later; **declarative modular architecture** — extend `game-config.js` / `game-state.js` / `task-system.js` (config + named actions/subscribe + processors); do not reintroduce imperative liveQuery/DOM-scraping task loops. Detail: [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md) § Declarative architecture; [`docs/devs/REFACTORING_SUMMARY.md`](docs/devs/REFACTORING_SUMMARY.md).

---

## Agent codebase reference maps

High-level maps reduce over-reading: use them **before** opening source, then drill into only the files the maps point to.

### Which files

* **`AGENTS_CODE_REFERENCE.md`** — root overview (purpose, stack, architecture, file tree, flows).
* **`AGENTS_CODE_REFERENCE-*.md`** — feature/area splits when the base file links to them.

### Before any code change

1. Check whether `AGENTS_CODE_REFERENCE.md` exists (and companion `AGENTS_CODE_REFERENCE-*.md`).
2. If missing, run **Prompt 1** in `AGENTS-CODE_REFERENCE_INIT.md` to generate them.
3. **Read** the maps first to orient, then open source files as needed.

### When to update the maps

Maps are updated **only at a good commit point** (see [Commit Decision Rules](#commit-decision-rules)):

1. Implement the change.
2. Verify the change.
3. Evaluate whether this is a good commit point.
4. **If yes** — update maps using **Prompt 1** of `AGENTS-CODE_REFERENCE_INIT.md`, **then** recommend a commit message.
5. **If no** — skip map update; say what remains.

Do **not** update maps after every small change. Do **not** recommend a commit before maps are refreshed when the change materially alters architecture, contracts, or primary flows.

**Cadence reminder**: after a large feature or ~3–5 smaller changes, run Prompt 1 sync so maps stay efficient and split when needed.

---

## Epic map, implementation stories, and milestone state

This repo pairs **product-level planning** (`EPIC_MAP.md`, `IMPLEMENTATION_STORIES.md`) with **session state** (`.agents/state.json`).

### Bootstrap when artifacts are missing

If **`EPIC_MAP.md`**, **`IMPLEMENTATION_STORIES.md`**, or **`.agents/state.json`** is missing, run `AGENTS-MILESTONES-INIT.md` first.

### Continuing milestone-driven work

On **continue** / **next** / **proceed**: follow `AGENTS-MILESTONES-TURNS.md` for milestone selection. Use `AGENTS-CODE_REFERENCE_TURNS.md` for the **read maps → implement → (at commit point) refresh maps** code loop.

---

## Work cycle

For every coding task, follow this loop:

### 1. State tracking

* **Epic:** ...
* **Milestone:** ...
* **Current Step:** ...
* Persist in `.agents/state.json`. At session start, read it; if missing, initiate from `EPIC_MAP.md` / `IMPLEMENTATION_STORIES.md` or run `AGENTS-MILESTONES-INIT.md`.

### 2. Implement

* Resume from the most logical next step. Prefer action over discussion.
* Keep changes scoped, coherent, and easy to review.
* When a topic needs an `AGENTS_POSSIBLE_DECISIONS__*` choice and none is stamped, pick the best fit, explain why, and stamp `decisions.*` (see **Technology decisions** under Decision-Making Principles).

### 3. Verify

* Run the smallest check that gives confidence, then broaden if needed.
* Preference order: targeted test → lint → type check → build → browser/UI → manual steps.
* If you cannot verify, say what could not be verified and give exact steps.

### 4. Report

Summarize concisely: what changed, what was verified, what remains.

### 5. Commit check

* Decide whether this is a good commit point.
* If **yes**:
  1. Update `AGENTS_CODE_REFERENCE.md` / `AGENTS_CODE_REFERENCE-*.md` when the change affects what those maps describe.
  2. **Then** suggest a commit message (e.g. `feat(auth): add refresh token handling`).
* If **no**: say what remains. Do **not** update maps yet.

---

## Commit Decision Rules

A commit is a good idea when:

* a bug fix, small feature, refactor, schema/API change, or UI change is complete and verified
* LLM reference maps will be updated as part of the commit workflow when the change affects what they document

A commit is **not** a good idea when:

* work is half-done, tests are knowingly broken, related files still need updates, or code compiles only via temporary hacks

Provide one commit message unless there are clearly multiple logical chunks.

---

## Persistent agent state (.agents/state.json)

### File shape

```json
{
  "epic": "Authentication",
  "milestone": "JWT login flow",
  "currentStep": "Add refresh token handling",
  "updatedAt": "2026-04-06T12:00:00Z"
}
```

This repo also uses a richer shape (`current_epic_id`, `current_milestone_id`, `decisions`, `completed`, `milestones`). Prefer the richer shape already in `.agents/state.json`; keep field names consistent across docs.

### When state is missing

* If the file does not exist, create it from inference or run `AGENTS-MILESTONES-INIT.md`.
* If a field is absent, add it.
* Update after meaningful progress.

### Source-of-truth coordination

Prefer one name for each epic/milestone across `state.json`, `EPIC_MAP.md` / `IMPLEMENTATION_STORIES.md`, and `TASKS.md` (if used).

---

## TASKS.md (optional)

Use `TASKS.md` only when `EPIC_MAP.md` / `IMPLEMENTATION_STORIES.md` don't exist yet, or for scratch items not captured in stories. When both exist, do not duplicate.

Rules when using it:
* Infer the next task from the first incomplete item.
* Update after meaningful work. Keep items action-oriented and specific.
* Do not let it become bloated.

---

## Reading priority

1. `AGENTS.md`
2. `.agents/state.json` (initiate if missing)
3. `EPIC_MAP.md` / `IMPLEMENTATION_STORIES.md` when present — including **implement notes** for `current_milestone_id`
4. `AGENTS_POSSIBLE_DECISIONS_INDEX.md` and any linked `AGENTS_POSSIBLE_DECISIONS__*.md` for the current milestone (follow stamped `decisions.*` unless the milestone reopens the choice)
5. `TASKS.md` if present
6. `AGENTS_CODE_REFERENCE.md` and `AGENTS_CODE_REFERENCE-*.md` (bootstrap if missing)
7. Other `AGENTS-*.md` or implementation maps
8. Directly relevant source → connected dependencies → broader files only if needed

Read only the files likely related to the task. Prefer targeted reads over scanning. Expand outward only when local context is insufficient.

---

## Decision-Making Principles

* Prefer continuing from context over re-asking for background.
* Prefer concrete implementation over high-level restatement.
* Prefer small, reviewable increments.
* Prefer naming conventions already in the repo.
* Update `EPIC_MAP.md` / `IMPLEMENTATION_STORIES.md`, `TASKS.md`, and `.agents/state.json` when progress changes meaningfully.

### Technology decisions (`AGENTS_POSSIBLE_DECISIONS__*`)

When a feature or milestone requires picking a runtime, library, or mini-game pattern covered by [`AGENTS_POSSIBLE_DECISIONS_INDEX.md`](AGENTS_POSSIBLE_DECISIONS_INDEX.md):

1. **Read** the linked decision doc(s) for the current milestone or topic.
2. **If already stamped** in `.agents/state.json` → `decisions.*` — follow it; do not re-debate. A one-line reminder in the report is enough.
3. **If not stamped** — **choose the best fit**, implement, and **explain why** in the session report (see format below). Stamp the outcome in `state.json` when the decision is settled for that topic.
4. **Prefer** options that match: locked `decisions.main_constraints`, `decisions.architecture_style` (`declarative_modular` when stamped), libraries already in the shell/code maps, milestone **implement notes**, and the ⭐ recommendations in the decision doc.
5. **Stop and ask the user** only when: the choice would violate locked constraints (e.g. React/Ink/Twine without approval), two options are genuinely tied on product grounds, or `status` is `blocked_waiting_user`.
6. On every milestone implement turn: prefer configuration, `gameState.dispatch`/`subscribe`, and `taskSystem` processors over new imperative jQuery attribute loops; keep scope to the milestone (no whole-app rewrite “for architecture”).

**Report format (when you made or applied a technology decision):**

```markdown
### Technology decision
- **Topic:** [e.g. timeline / context menu / game runtime]
- **Choice:** [library or pattern]
- **Why:** [2–4 sentences: fit to milestone, existing stack, constraints, tradeoffs rejected]
- **Stamped:** `decisions.<key>` in state.json [yes / already stamped]
```

Do not block implementation waiting for library approval when the decision doc and constraints already point to a clear winner.

---

## If Blocked

* Explain exactly what is blocked and what you already checked.
* Give the smallest user action needed to unblock.
* Continue with any parallel work that can still proceed.

---

## Session Continuation Rule

When the user says **continue**, **keep going**, **proceed**, **next**, or **finish this**:

1. Read `.agents/state.json`; initiate if missing (use `AGENTS-MILESTONES-INIT.md` when epic/story files are absent).
2. Follow `AGENTS-MILESTONES-TURNS.md` when milestone docs exist; otherwise read `TASKS.md`.
3. Read milestone-linked decision docs: `AGENTS_POSSIBLE_DECISIONS_INDEX.md` + **implement notes** for `current_milestone_id` in `IMPLEMENTATION_STORIES.md`; honor stamped `decisions.*` unless the milestone reopens the choice.
4. Read `AGENTS_CODE_REFERENCE.md` and linked maps; bootstrap if missing.
5. Sync epic/milestone/current step in `state.json`.
6. Implement the next logical task.
7. Verify.
8. Update `EPIC_MAP.md` / `IMPLEMENTATION_STORIES.md`, `TASKS.md`, and `.agents/state.json` when progress changed.
9. Report what changed, what was verified, what remains.
10. Evaluate commit point.
11. **If good commit point**: update LLM reference maps when warranted per `AGENTS-CODE_REFERENCE_INIT.md`, **then** suggest a commit message.
12. **If not**: skip map update, commits, and pushes; say what remains.
13. If the user has granted permission to commit without asking, make the commit.
14. If the user has granted permission to push, push as well.
