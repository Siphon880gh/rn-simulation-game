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

**Generate via Higgsfield MCP:** [`AGENTS_LOOP-Higgsfield-Fill-Placeholders.md`](AGENTS_LOOP-Higgsfield-Fill-Placeholders.md) — reads `data-media-kind` + `data-asset-prompt` (or catalog equivalent), generates, downloads to `game/assets/media/`, sets `replaceWith`

---

## Inventory

| id | kind | title | mount | description | replaceWith |
|----|------|-------|-------|-------------|-------------|
| `dept-tele` | image | Telemetry unit | Landing Tele tile | Tele nursing station / central monitor bank for the assignment picker | `game/assets/media/dept-tele.webp` |
| `dept-medsurg` | image | Med-Surg unit | Landing Med-Surg tile | Floor hallway / nurses station + med cart mood | `game/assets/media/dept-medsurg.webp` |
| `dept-icu` | image | ICU unit | Landing ICU tile | ICU bay with vents/pumps, higher acuity | `game/assets/media/dept-icu.webp` |
| `situation-code-blue` | image | Code Blue | Code Blue challenge modal still | Crash cart / defibrillator emergency backdrop | `assets/media/situation-code-blue.webp` |
| `situation-critical-lab` | image | Critical lab | Critical-lab spawn toast + still key | Lab call urgency at the nurses station | `assets/media/situation-critical-lab.webp` |
| `situation-bed-prep` | image | Bed prep | Bed-prep challenge modal still | Empty bed being made / wall O2-suction | `assets/media/situation-bed-prep.webp` |
| `slot-perform` | image | Performing care | Busy task slot thumb | Small bedside-care thumb while a patient task runs in a slot | `assets/media/slot-perform.webp` |
| `slot-perform-video` | video | Performing care | Busy slot (optional video) | Short silent loop for slot; enable via `slotPreferVideo: true` | `assets/media/slot-perform-video.mp4` |
| `challenge-code-blue` | image | Code Blue | Code Blue quiz modal hero | Wide still above Code Blue questions (also uses modal situation still) | `assets/media/challenge-code-blue.webp` |
| `challenge-code-blue-video` | video | Code Blue | Code Blue quiz modal hero (default) | Short silent loop preferred in-modal (`preferVideo: true`) | `assets/media/challenge-code-blue-video.mp4` |
| `challenge-bed-prep` | image | Bed prep | Bed-prep mini-game modal | Wide still above gather-items game | `assets/media/challenge-bed-prep.webp` |
| `challenge-med-identity` | image | Med identity | Med identity quiz modal | Med cart / vial still above brand↔generic quiz | `assets/media/challenge-med-identity.webp` |
| `challenge-ivpb-hang` | image | IVPB hang | IVPB hang sequence modal | Secondary bag / pump still | `assets/media/challenge-ivpb-hang.webp` |
| `challenge-accucheck` | image | Accucheck | Accucheck quiz modal | Glucometer / sliding-scale still | `assets/media/challenge-accucheck.webp` |
| `challenge-admission` | image | Admission | Admission quiz modal | Clipboard / wristband still | `assets/media/challenge-admission.webp` |
| `challenge-icp` | image | ICP | ICP quiz modal | ICP waveform / EVD still | `assets/media/challenge-icp.webp` |
| `challenge-iv-check` | image | IV check | IV check / titration / heparin-PTT modal | IV site + infusion pump still (**before**) | `assets/media/challenge-iv-check.webp` |
| `challenge-code-blue-after` | image | Code Blue — resolved | Code Blue modal after pass | Calm/stable bedside after successful response | `assets/media/challenge-code-blue-after.webp` |
| `challenge-bed-prep-after` | image | Bed prep — ready | Bed-prep modal after pass | Made bed ready for admission | `assets/media/challenge-bed-prep-after.webp` |
| `challenge-med-identity-after` | image | Med identity — verified | Med identity after pass | Verified med package | `assets/media/challenge-med-identity-after.webp` |
| `challenge-ivpb-hang-after` | image | IVPB hang — running | IVPB hang after pass | Secondary bag running | `assets/media/challenge-ivpb-hang-after.webp` |
| `challenge-iv-check-after` | image | IV check — confirmed | IV check after pass | Confirmed pump rate | `assets/media/challenge-iv-check-after.webp` |
| `challenge-accucheck-after` | image | Accucheck — logged | Accucheck after pass | Result logged | `assets/media/challenge-accucheck-after.webp` |
| `challenge-admission-after` | image | Admission — complete | Admission after pass | Checklist complete | `assets/media/challenge-admission-after.webp` |
| `challenge-icp-after` | image | ICP — monitored | ICP after pass | Controlled ICP waveform | `assets/media/challenge-icp-after.webp` |

Toggle challenge heroes: `GameConfig.mediaPlaceholders.mounts.challenges`. Per-game map: `mediaPlaceholders.challenges.<key>` (`imageId`/`videoId` = **before** during quiz; `afterImageId` swaps in after the last question / challenge-level target, on the Continue screen before the modal closes).

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
