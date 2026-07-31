# Placeholder assets inventory

Titled image/video placeholders for the RN Simulation Game. Use this list when supplying final art — tell the agent which **id** to replace.

| Field | Meaning |
|-------|---------|
| **id** | Stable key in `game/assets/js/media-placeholder-catalog.json` + `GameConfig.mediaPlaceholders.assets` |
| **kind** | `image` or `video` |
| **mount** | Where it appears in the UI |
| **replaceWith** | `null` = still a placeholder; set to a URL/path when you drop in the real file |

**Service (PHP, no build):** [`placeholders/`](placeholders/) — `image.php`, `video.php`, partial [`placeholders/partials/media-tag.php`](placeholders/partials/media-tag.php) (`ph_media_tag()`). Demo: `php -S localhost:8765 -t .` → `/placeholders/`.

**Config:** `GameConfig.mediaPlaceholders` in [`game/assets/js/game-config.js`](game/assets/js/game-config.js) (`enabled`, `source: data-url|php`, `mounts.*`).

**Copy prompt:** every tag has `data-asset-prompt` — paste into a chat agent. Order is always:

1. **Subject** (catalog `prompt`)
2. **Dimensions** (`{w}×{h}px` from catalog)
3. **Style (fun medical simulation)** (`promptStyleAppendix` / PHP `ph_prompt_style_appendix()`)

**Scan for new mounts:** [`.agents/skills/scan-placeholder-assets/`](.agents/skills/scan-placeholder-assets/) · [`AGENTS_LOOP-Scan-Placeholder-Assets.md`](AGENTS_LOOP-Scan-Placeholder-Assets.md)

**Replace with real art:** [`.agents/skills/replace-placeholder-assets/`](.agents/skills/replace-placeholder-assets/) · [`AGENTS_LOOP-Replace-Placeholder-Assets.md`](AGENTS_LOOP-Replace-Placeholder-Assets.md)

---

## Inventory

| id | kind | title | mount | description | replaceWith |
|----|------|-------|-------|-------------|-------------|
| `dept-tele` | image | Telemetry unit | Landing Tele tile | Tele nursing station / central monitor bank for the assignment picker | `game/assets/media/dept-tele.webp` |
| `dept-medsurg` | image | Med-Surg unit | Landing Med-Surg tile | Floor hallway / nurses station + med cart mood | `game/assets/media/dept-medsurg.webp` |
| `dept-icu` | image | ICU unit | Landing ICU tile | ICU bay with vents/pumps, higher acuity | `game/assets/media/dept-icu.webp` |
| `situation-code-blue` | image | Code Blue | Code Blue challenge modal still | Crash cart / defibrillator emergency backdrop | `null` |
| `situation-critical-lab` | image | Critical lab | Critical-lab spawn toast + still key | Lab call urgency at the nurses station | `null` |
| `situation-bed-prep` | image | Bed prep | Bed-prep challenge modal still | Empty bed being made / wall O2-suction | `null` |
| `slot-perform` | image | Performing care | Busy task slot thumb | Small bedside-care thumb while a patient task runs in a slot | `null` |
| `slot-perform-video` | video | Performing care | Busy slot (optional video) | Short silent loop for slot; enable via `slotPreferVideo: true` | `null` |
| `challenge-code-blue` | image | Code Blue | Code Blue quiz modal hero | Wide still above Code Blue questions (also uses modal situation still) | `null` |
| `challenge-code-blue-video` | video | Code Blue | Code Blue quiz modal hero (default) | Short silent loop preferred in-modal (`preferVideo: true`) | `null` |
| `challenge-bed-prep` | image | Bed prep | Bed-prep mini-game modal | Wide still above gather-items game | `null` |
| `challenge-med-identity` | image | Med identity | Med identity quiz modal | Med cart / vial still above brand↔generic quiz | `null` |
| `challenge-ivpb-hang` | image | IVPB hang | IVPB hang sequence modal | Secondary bag / pump still | `null` |
| `challenge-accucheck` | image | Accucheck | Accucheck quiz modal | Glucometer / sliding-scale still | `null` |
| `challenge-admission` | image | Admission | Admission quiz modal | Clipboard / wristband still | `null` |
| `challenge-icp` | image | ICP | ICP quiz modal | ICP waveform / EVD still | `null` |
| `challenge-iv-check` | image | IV check | IV check / titration / heparin-PTT modal | IV site + infusion pump still | `null` |

Toggle challenge heroes: `GameConfig.mediaPlaceholders.mounts.challenges`. Per-game map: `mediaPlaceholders.challenges.<key>`.

---

## How to hand off a real file

1. Put the file under e.g. `game/assets/media/<id>.webp` (or `.mp4` / `.webm` for video).
2. Ask the agent (or edit): set `replaceWith` for that **id** in the catalog JSON **and** optionally `GameConfig.mediaPlaceholders.assets.<id>.replaceWith`.
3. Mark the row above with the path instead of `null`.
4. Keep `data-asset-id` mounts unchanged so wiring stays stable.

### Example agent ask

```text
Replace placeholder dept-icu with game/assets/media/dept-icu.webp
```

```text
@replace-placeholder-assets Replace situation-code-blue with the file I attached.
```
