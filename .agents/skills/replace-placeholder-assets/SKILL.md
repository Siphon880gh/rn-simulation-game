---
name: replace-placeholder-assets
description: >-
  Replaces titled image/video placeholders in the RN Simulation Game with real
  media files. Use when the user supplies art, asks to swap a placeholder id,
  mentions PLACEHOLDER_ASSETS.md, data-asset-prompt, or dept/code-blue/critical
  lab/slot media.
---

# Replace placeholder assets

Swap catalog placeholders for real stills/clips without changing mount wiring.

## Paths

| Artifact | Role |
|----------|------|
| [`PLACEHOLDER_ASSETS.md`](../../../PLACEHOLDER_ASSETS.md) | Human inventory + handoff list |
| [`game/assets/js/media-placeholder-catalog.json`](../../../game/assets/js/media-placeholder-catalog.json) | Canonical ids / prompts / `replaceWith` |
| [`game/assets/js/game-config.js`](../../../game/assets/js/game-config.js) → `mediaPlaceholders` | Enable/source/mounts + optional per-id overrides |
| [`placeholders/`](../../../placeholders/) | PHP `image.php` / `video.php` + `partials/media-tag.php` |
| [`progress.json`](progress.json) | Loop queue of pending replacements |
| [`AGENTS_LOOP-Replace-Placeholder-Assets.md`](../../../AGENTS_LOOP-Replace-Placeholder-Assets.md) | `/loop` body (user-supplied file) |
| [`AGENTS_LOOP-Higgsfield-Fill-Placeholders.md`](../../../AGENTS_LOOP-Higgsfield-Fill-Placeholders.md) | `/loop` body (Higgsfield generate → download → `replaceWith`) |

## Hard rules

1. **One id per loop tick** — finish copy → `replaceWith` → inventory row → verify for a single asset before advancing.
2. **Stable ids** — never rename `id` / `mount` unless the user asks; mounts wire landing, situations, slots, critical lab.
3. **Prefer catalog `replaceWith`** — set the real URL/path there; mirror into `GameConfig.mediaPlaceholders.assets.<id>` only when overriding without editing JSON.
4. **Keep prompts** — leave `prompt` / `data-asset-prompt` text unless the user rewrites the brief.
5. **Fictional education only** — no real patient photos / PHI.
6. **No new mounts** unless the user asks — add catalog row + `PLACEHOLDER_ASSETS.md` + mount code together.
7. **Code Blue priority** — `challenge-code-blue-video` (in-modal, default) + `challenge-code-blue` / `situation-code-blue` (still/backdrop). Prefer delivering the video when the user supplies Code Blue art.

## Replace steps (single id)

1. Confirm **id** from user or next `pending` row in `progress.json`.
2. Place file under `game/assets/media/` (create dir if needed), name preferred: `<id>.webp|png|jpg|mp4|webm`.
3. Set catalog entry `replaceWith` to a path the page can load:
   - Landing: `game/assets/media/<file>` (from repo root)
   - In-game modules: prefer root-absolute `/game/assets/media/<file>` **or** path relative to `game/` such as `assets/media/<file>` — match how other static assets are referenced from `game/index.html` (`assets/...`).
4. Update `PLACEHOLDER_ASSETS.md` inventory `replaceWith` cell for that id.
5. Mark `progress.json` entry `done`.
6. AUTO: `node scripts/verify-placeholder-assets.mjs` (from repo root).

### Path convention (in-game)

From `game/index.html`, use:

```text
assets/media/<id>.webp
```

From landing `index.html`, use:

```text
game/assets/media/<id>.webp
```

If one file must serve both, set landing tiles via catalog `replaceWith` to `game/assets/media/...` and put the same path override for game mounts under `GameConfig.mediaPlaceholders.assets` with `assets/media/...`, **or** keep files only under `game/assets/media/` and use root-absolute `/game/assets/media/...` when the server root is the repo.

## Add a new placeholder (only if asked)

1. Add row to `media-placeholder-catalog.json`.
2. Add inventory row in `PLACEHOLDER_ASSETS.md`.
3. Wire mount (landing script / `media-placeholders.js` / situation key / slot).
4. Gate behind `GameConfig.mediaPlaceholders.mounts.*`.

## /loop

```text
/loop 2m Read AGENTS_LOOP-Replace-Placeholder-Assets.md and execute one tick. Stop on STOP_* labels.
```

Or:

```text
@replace-placeholder-assets Replace dept-icu with the attached image.
```

## Progress shape

```json
{
  "status": "active",
  "queue": [
    { "id": "dept-tele", "status": "pending", "file": null },
    { "id": "situation-code-blue", "status": "done", "file": "assets/media/situation-code-blue.webp" }
  ]
}
```
