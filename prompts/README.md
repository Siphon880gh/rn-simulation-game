# Prompts — Epic-Based Planning & Self-Tracking

This folder holds prompts for planning and implementing the product in **epics**, then **milestones**, with resume state in `.agents/state.json`.

| File | When to use |
|------|-------------|
| [`GUIDELINES_MILESTONE_PROMPTS.md`](./GUIDELINES_MILESTONE_PROMPTS.md) | Discover/confirm epics (Epic 0 first). Always update state. |
| [`MILESTONE_AUTHORING.md`](./MILESTONE_AUTHORING.md) | After epic approval: write 5-block milestone prompts and keep state in sync. |
| [`MILESTONE_LOOP.md`](./MILESTONE_LOOP.md) | Autonomous continue loop: AUTO verify + advance; stop only for HUMAN_REQUIRED / fix budget / blocked. |

## Living artifacts (repo root)

| File | Role |
|------|------|
| [`EPIC_MAP.md`](../EPIC_MAP.md) | Approved/draft epic map |
| [`IMPLEMENTATION_STORIES.md`](../IMPLEMENTATION_STORIES.md) | Stories & milestone checkoff |
| [`.agents/state.json`](../.agents/state.json) | Self-tracking resume point |

## Workflow

1. Run the epic plan generator → refresh `EPIC_MAP.md` + `.agents/state.json`.
2. **Stop** and get user confirmation.
3. Break confirmed epics into stories/milestones in `IMPLEMENTATION_STORIES.md`.
4. Implement one milestone at a time using `MILESTONE_AUTHORING.md`; update state at start/end.

Do not execute milestones until the epic map is confirmed.
