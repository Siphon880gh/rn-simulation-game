# Placeholder media — Higgsfield model log

Track which Higgsfield models produced in-game placeholder art so later quality passes can step up deliberately.

Related:

- Inventory: [`PLACEHOLDER_ASSETS.md`](PLACEHOLDER_ASSETS.md)
- Catalog: [`game/assets/js/media-placeholder-catalog.json`](game/assets/js/media-placeholder-catalog.json)
- Fill loop: [`AGENTS_LOOP-Higgsfield-Fill-Placeholders.md`](AGENTS_LOOP-Higgsfield-Fill-Placeholders.md)
- Progress queue: [`.agents/skills/replace-placeholder-assets/progress.json`](.agents/skills/replace-placeholder-assets/progress.json)

---

## Current models (latest wired pass)

| Kind | Model id | Params | Reference input |
|------|----------|--------|-----------------|
| **Image** | `cinematic_studio_2_5` | `resolution: "4k"`, `aspect_ratio: "21:9"`, `count: 1` | Uploaded media_id as `medias[].role: "image"` |
| **Video** | `seedance_2_0` | `duration: 5` (when set) | Still job id as `medias[].role: "start_image"` |

**Scope of latest pass:** Code Blue stills only (`challenge-code-blue`, `challenge-code-blue-after`, `situation-code-blue`). Other catalog assets remain on pass 3 (`gpt_image_2`).

**Concurrency note:** pro plan max **4** concurrent Higgsfield jobs.

**Aspect note:** `cinematic_studio_2_5` supports `21:9` natively (Catalog Code Blue heroes are wide).

---

## Pass history

Append a new row after each full (or partial) regen. Newest pass first.

| Pass | Date (UTC) | Image model | Image params | Video model | Video params | Notes |
|------|------------|-------------|--------------|-------------|--------------|-------|
| 4 — Code Blue style fix | 2026-08-05 | `cinematic_studio_2_5` | 4k / 21:9 + image ref | (unchanged) | — | Closed crash-cart drawers on BEFORE; AFTER rematched to photoreal cinematic (was 3D illustrated); jobs `b2af40eb…` / `aeb0deda…` |
| 3 — quality pass 2 | 2026-08-01 | `gpt_image_2` | high / 2k + image ref | `seedance_2_0` | start_image from still | 38 non-dept assets; skipped `dept-*`; anti-artifact / anti-scrambled-text prompts |
| 2 — quality pass 1 | 2026-08-01 | `nano_banana_pro` | resolution `2k` + image ref | `kling3_0` | start_image | Higher than initial fill; still showed AI artifacts / scale / text issues |
| 1 — initial fill | ~2026-08-01 | `soul_2` | default (~1 credit) | `kling3_0_turbo` | turbo | First real media fill into `game/assets/media/` |

---

## Starting another quality round

1. Read **Current models** above — do not reuse the same tier if the user reports bad quality.
2. Call Higgsfield `models_explore` (`action: "recommend"` / `"get"`) and pick a **higher-tier** image and/or video model than the last pass.
3. Reset/queue non-dept ids in `progress.json` (`status: "active"`, pending rows), stamp `models` there to match this file.
4. Prefer reusing the previous pass job id as image / `start_image` reference when the model supports it.
5. After the pass wires files: update **Current models**, prepend a **Pass history** row, and set `progress.json` → `models` + `note`.

### Quality complaints to address in prompts

When regenerating for quality, keep prompts explicit about:

- Sharp, correctly spelled caption/signage (no scrambled or melted letters)
- Realistic object scale / perspective (no oversized props)
- Clean edges, coherent lighting, minimal AI artifacts

---

## Progress.json mirror

Latest pass also records:

```json
{
  "models": {
    "image": "cinematic_studio_2_5",
    "imageResolution": "4k",
    "video": "seedance_2_0"
  }
}
```

Keep this file and `progress.json` → `models` in sync when the locked pair changes. For partial passes, stamp per-queue-row `model` / `higgsfieldJobId` even if global `models` still lists the prior full-pass pair.
