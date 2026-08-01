# AGENTS_LOOP — Higgsfield Fill Placeholders

One tick = generate **one** pending placeholder via **Higgsfield MCP** (`user-higgsfield`), download the result into `game/assets/media/`, and wire `replaceWith` so the UI shows the real asset.

Companion (manual/file drop, no generation): [`AGENTS_LOOP-Replace-Placeholder-Assets.md`](AGENTS_LOOP-Replace-Placeholder-Assets.md)  
Skill (path conventions + verify): [`.agents/skills/replace-placeholder-assets/SKILL.md`](.agents/skills/replace-placeholder-assets/SKILL.md)  
Inventory: [`PLACEHOLDER_ASSETS.md`](PLACEHOLDER_ASSETS.md)  
Model log: [`PLACEHOLDER_MEDIA_MODELS.md`](PLACEHOLDER_MEDIA_MODELS.md)  
Catalog: [`game/assets/js/media-placeholder-catalog.json`](game/assets/js/media-placeholder-catalog.json)  
Progress queue: [`.agents/skills/replace-placeholder-assets/progress.json`](.agents/skills/replace-placeholder-assets/progress.json)

---

## How to run

### Recommended (Cursor `/loop`, dynamic)

Generation + download can take 10–180s per asset. Prefer **dynamic** (no fixed interval):

```text
/loop Read AGENTS_LOOP-Higgsfield-Fill-Placeholders.md and execute one tick from the Loop prompt section. After PASS, schedule the next tick immediately (dynamic). Stop only on STOP_* labels in that file.
```

### Fixed interval (optional)

```text
/loop 3m Read AGENTS_LOOP-Higgsfield-Fill-Placeholders.md and execute one tick from the Loop prompt section. Stop only on STOP_* labels.
```

Use ≥3m so video ticks are less likely to overlap a still-running generation.

### Manual (no `/loop`)

```text
Follow AGENTS_LOOP-Higgsfield-Fill-Placeholders.md. Run one Higgsfield fill tick now.
```

### Before you start

- Higgsfield MCP namespace `user-higgsfield` must be authenticated (`mcp_auth` if `needsAuth`).
- User must have explicitly asked to generate / fill placeholders (Higgsfield requires an explicit create ask).
- Credits: pass `use_unlim: true` **only** when the user explicitly said to use free-trial / unlimited generations. Otherwise omit it (credits).
- Do **not** commit unless the user asked.

---

## HTML / catalog contract (source of truth)

Placeholders expose creation metadata on the media tag (PHP `ph_media_tag` / JS `media-placeholders` / landing tiles):

| Attribute | Meaning |
|-----------|---------|
| `data-asset-id` | Stable catalog id (do not rename) |
| `data-media-kind` | `image` or `video` → choose `generate_image` vs `generate_video` |
| `data-asset-prompt` | Full creation prompt (subject + Dimensions + Style) |
| `data-asset-title` | Display title (caption hint) |

When the live DOM is not available, rebuild the same prompt from the catalog row:

1. **Subject** = catalog `prompt`
2. **Dimensions** = from `w` / `h` + kind (see `resolvePrompt` / `withPromptDimensions` in `media-placeholders.js`)
3. **Style** = `GameConfig.mediaPlaceholders.promptStyleAppendix` (fun medical simulation)

Pending = catalog `replaceWith` is `null` **or** progress queue entry `"status": "pending"`. Prefer the progress queue order; sync from catalog if queue is missing an id that still has `replaceWith: null`.

**Priority:** Code Blue video first when pending — `challenge-code-blue-video`, then `challenge-code-blue` / `situation-code-blue`.

---

## Loop prompt

```markdown
# OBJECTIVE
Fill every pending RN Simulation Game media placeholder by generating with
Higgsfield MCP, saving the file under game/assets/media/, and setting
catalog replaceWith so mounts show real art instead of titled placeholders.

**Done (outer loop):** no pending ids left (progress queue all done, and no
catalog asset with replaceWith: null that should be filled).
**Done (single tick):** one id generated → downloaded → wired → verified.

# HARD RULES
1. One id per tick — finish generate → download → replaceWith → inventory →
   progress → verify before the next id.
2. Never rename data-asset-id / catalog id / mount keys.
3. Keep catalog prompt / data-asset-prompt subject text; do not strip the
   style appendix from the generation prompt you send to Higgsfield.
4. Fictional education only — no real patient photos / PHI / gore.
5. Prefer catalog replaceWith; do not invent new mounts.
6. Image → .webp (or .png/.jpg if the download is that type). Video → .mp4 or .webm.
7. Path conventions (from replace-placeholder-assets skill):
   - Landing: game/assets/media/<id>.<ext>
   - In-game modules: assets/media/<id>.<ext> or /game/assets/media/<id>.<ext>
   Prefer storing the file at game/assets/media/<id>.<ext> and setting
   replaceWith to game/assets/media/<id>.<ext> for landing ids, and
   assets/media/<id>.<ext> (or root-absolute /game/assets/media/<id>.<ext>)
   for in-game mounts — match how other static assets load from that surface.
8. If Higgsfield returns recovery_tool, call it immediately; do not ask first.
9. Max 10 fix rounds for verify/download failures on the same id, then STOP_FIX_BUDGET.

# EACH TICK

## 0) Auth + load state
- If user-higgsfield namespaceStatus is needsAuth → call mcp_auth, then continue.
- Read in parallel:
  - .agents/skills/replace-placeholder-assets/SKILL.md
  - .agents/skills/replace-placeholder-assets/progress.json
  - game/assets/js/media-placeholder-catalog.json
  - PLACEHOLDER_ASSETS.md
  - GameConfig.mediaPlaceholders.promptStyleAppendix (game-config.js) if needed for prompt rebuild

## 1) Pick next pending id
- Next progress.json entry with "status": "pending", unless the user named an id.
- If queue empty of pending but catalog still has replaceWith: null → append those
  ids to the queue as pending, then pick the first (Code Blue video priority).
- If nothing pending → STOP_DONE.

## 2) Resolve kind + prompt
- kind = catalog.kind (must match data-media-kind: image|video).
- prompt = full data-asset-prompt equivalent:
  - Prefer rebuilding via the same contract as resolvePrompt(asset):
    subject (catalog.prompt) + Dimensions line from w×h + Style appendix.
  - If you can read a live tag with data-asset-id=<id>, you may copy
    data-asset-prompt from the DOM instead (must be non-empty).
- aspect_ratio: derive from w:h (e.g. 640×360 / 960×540 → "16:9"; 160×120 → nearest supported; pass width/height if the model prefers pixels).
- For video: short silent loop (duration ~3–5s when the model allows); no speech/PHI.

## 3) Choose model (Higgsfield)
- Call models_explore with action:"recommend", type:"image"| "video", input:"text",
  query describing: RN educational hospital UI still/loop, fun medical simulation,
  text-only, target aspect ratio, no real faces.
- Or models_explore action:"get" for a known good model id reused this session.
- Apply any adjustments the API returns on later calls.
- Optional once per session: balance — if credits are clearly exhausted → STOP_BLOCKED
  (out of credits / show_plans_and_credits only if user asks to top up).

## 4) Generate
- Image: CallDynamicTool namespace user-higgsfield toolName generate_image
  params: { model, prompt, count: 1, aspect_ratio?, use_unlim? }
- Video: toolName generate_video
  params: { model, prompt, count: 1, aspect_ratio?, duration?, use_unlim? }
- use_unlim: true ONLY if the user explicitly asked for unlimited/free-trial gens
  on this run (repeat their ask each tick — do not carry a silent default).
- Capture job id from the response.

## 5) Poll until terminal
- job_status with jobId (sync:true is OK to reduce chatter).
- Respect poll_after_seconds when sync is false / still running.
- Typical: image ~10–20s, video ~60–180s.
- On failed / rejected:
  - If recovery_tool present → invoke it, then retry once if appropriate.
  - Else mark progress note with error; STOP_BLOCKED or continue to next id only
    if the user said to skip failures (default: STOP_BLOCKED for credits/auth;
    for model errors retry once with a different recommended model, then STOP_HUMAN).

## 6) Download locally
- From the completed job results, take the primary media URL (https).
- Download with local shell curl into:
  game/assets/media/<id>.webp   # images (convert/rename only if needed)
  game/assets/media/<id>.mp4    # videos (or .webm if that is what was returned)
- Create game/assets/media/ if missing.
- Do not commit binary noise the user did not ask to commit.
- Verify file size > 0.

## 7) Swap placeholder (wire replaceWith)
Follow replace-placeholder-assets single-id steps:
1. Set catalog assets[id].replaceWith to the path the page can load.
2. Update PLACEHOLDER_ASSETS.md inventory replaceWith cell for that id.
3. Mark progress.json entry: status "done", file "<path>", optional higgsfieldJobId.
4. Do not change mount wiring / data-asset-id.

## 8) Verify
- Run: node scripts/verify-placeholder-assets.mjs
- Fix path/catalog sync issues up to 10 rounds; then STOP_FIX_BUDGET.

## 9) Tick report (short)
- id, kind, model, local file path, replaceWith, verify pass/fail, next pending id
- Do not dump full prompts unless STOP_HUMAN needs them

# STOP LABELS
| Label | Meaning |
|-------|---------|
| STOP_DONE | All pending placeholders filled |
| STOP_BLOCKED | Auth/credits/API policy blocked generation |
| STOP_FIX_BUDGET | Verify/download still failing after 10 fix rounds |
| STOP_HUMAN | Ambiguous kind/id, bad prompt, or model choice needs user |

# AFTER PASS (when driven by /loop dynamic)
Re-arm the next tick immediately so the queue drains. Stop only on STOP_*.
```

---

## Higgsfield MCP cheat sheet

| Step | Tool (`user-higgsfield`) |
|------|--------------------------|
| Auth | `mcp_auth` |
| Model pick | `models_explore` (`recommend` / `get`) |
| Still | `generate_image` |
| Clip | `generate_video` |
| Wait | `job_status` (`jobId`, optional `sync: true`) |
| Credits (optional) | `balance` / `show_plans_and_credits` |

Namespace discovery: `GetDynamicTools` → `user-higgsfield` before first generate in a session if schemas are unknown.

---

## Progress shape (shared with replace skill)

```json
{
  "status": "active",
  "queue": [
    {
      "id": "situation-code-blue",
      "status": "pending",
      "file": null
    },
    {
      "id": "challenge-code-blue-video",
      "status": "done",
      "file": "game/assets/media/challenge-code-blue-video.mp4",
      "higgsfieldJobId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  ]
}
```

Set `"status": "active"` on the progress file while the loop is draining; `"idle"` when `STOP_DONE`.

---

## Notes

- PHP / data-url titled placeholders remain the fallback while `replaceWith` is null.
- This loop **generates** art; [`AGENTS_LOOP-Replace-Placeholder-Assets.md`](AGENTS_LOOP-Replace-Placeholder-Assets.md) only installs a file the user already supplied.
- Scanning for *new* placeholder mounts is a different loop: [`AGENTS_LOOP-Scan-Placeholder-Assets.md`](AGENTS_LOOP-Scan-Placeholder-Assets.md).
