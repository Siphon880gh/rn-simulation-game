# AGENTS_LOOP — Replace Placeholder Assets

One tick = replace **one** catalog placeholder id with a real media file (or mark blocked).

Skill: [`.agents/skills/replace-placeholder-assets/SKILL.md`](.agents/skills/replace-placeholder-assets/SKILL.md)  
Inventory: [`PLACEHOLDER_ASSETS.md`](PLACEHOLDER_ASSETS.md)  
Progress: [`.agents/skills/replace-placeholder-assets/progress.json`](.agents/skills/replace-placeholder-assets/progress.json)

---

## How to run

```text
/loop 2m Read AGENTS_LOOP-Replace-Placeholder-Assets.md and execute one tick from the Loop prompt section. Stop only on STOP_* labels.
```

Dynamic (no interval) also fine if the user is dropping files between ticks.

Manual:

```text
Follow AGENTS_LOOP-Replace-Placeholder-Assets.md. Run one replace tick now.
```

---

## Loop prompt

On each tick:

1. Read `.agents/skills/replace-placeholder-assets/SKILL.md` and `progress.json`.
2. Read `PLACEHOLDER_ASSETS.md` + `game/assets/js/media-placeholder-catalog.json`.
3. Pick the next queue item with `"status": "pending"` (or the id the user named this turn).
4. If the user has **not** provided a file/URL for that id → emit `STOP_BLOCKED` with the id and prompt text (`data-asset-prompt` / catalog `prompt`) so they can generate or attach art. Do not invent binary assets.
5. If a file/URL is available:
   - Copy/save under `game/assets/media/` when appropriate
   - Set catalog `replaceWith`
   - Update `PLACEHOLDER_ASSETS.md` row
   - Mark progress entry `done` + `file`
   - Run `node scripts/verify-placeholder-assets.mjs`
6. Short tick report: id, file path, verify pass/fail, next pending id.
7. If queue has no pending left → `STOP_DONE`.
8. If verify fails after fixes → `STOP_FIX_BUDGET` (max 10 fix rounds).

### STOP labels

| Label | Meaning |
|-------|---------|
| `STOP_DONE` | All queued replacements done (or user said stop) |
| `STOP_BLOCKED` | Waiting for user file/URL for the current id |
| `STOP_FIX_BUDGET` | Verify still failing after fix rounds |
| `STOP_HUMAN` | Ambiguous id / conflicting paths — need user choice |

---

## Notes

- Do not change mount wiring unless adding a **new** placeholder the user requested.
- Prefer one real file per id; video ids need `.mp4` / `.webm` (or leave pending).
- PHP placeholders remain as fallback when `replaceWith` is null.
