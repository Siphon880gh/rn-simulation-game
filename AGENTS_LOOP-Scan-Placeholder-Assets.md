# AGENTS_LOOP — Scan Placeholder Assets

One tick = propose **one** new image/video placeholder opportunity (or wire one approved id).

Skill: [`.agents/skills/scan-placeholder-assets/SKILL.md`](.agents/skills/scan-placeholder-assets/SKILL.md)  
Replace companion: [`AGENTS_LOOP-Replace-Placeholder-Assets.md`](AGENTS_LOOP-Replace-Placeholder-Assets.md)

---

## How to run

```text
/loop 2m Read AGENTS_LOOP-Scan-Placeholder-Assets.md and execute one tick from the Loop prompt section. Stop on STOP_* labels.
```

---

## Loop prompt

On each tick:

1. Read `.agents/skills/scan-placeholder-assets/SKILL.md`, `reference.md`, `memory.json`, `progress.json`.
2. Run `node .agents/skills/scan-placeholder-assets/scripts/audit.mjs` (optionally `--write-progress` if queue empty).
3. Pick next `pending` candidate (or next hunt gap not excluded / not in catalog).
4. Present the yes/no gate with **id, kind, mount, w×h, subject prompt**, and a **resolved prompt preview** that includes `Dimensions:` and `Style (fun medical simulation):`.
5. **STOP_BLOCKED** until the user answers yes/no (do not invent art files).
6. On **yes**: wire catalog + inventory + mount; set replace-skill progress pending; verify with `node scripts/verify-placeholder-assets.mjs`.
7. On **no**: append to `memory.json` → `excluded`; mark progress skipped.
8. If no candidates remain → `STOP_DONE`.

### STOP labels

| Label | Meaning |
|-------|---------|
| `STOP_DONE` | No remaining candidates |
| `STOP_BLOCKED` | Waiting for user yes/no on the current candidate |
| `STOP_FIX_BUDGET` | Verify failing after fix rounds |
| `STOP_HUMAN` | Ambiguous mount / size — need user choice |

---

## Prompt reminder

Every `data-asset-prompt` must resolve to: **subject → Dimensions (w×h) → Style (fun medical simulation)**. Catalog stores subject + `w`/`h` only.
