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

**Model log (image/video tiers used per pass):** [`PLACEHOLDER_MEDIA_MODELS.md`](PLACEHOLDER_MEDIA_MODELS.md)

---

## Inventory

| id | kind | title | mount | description | replaceWith |
|----|------|-------|-------|-------------|-------------|
| `dept-tele` | image | Telemetry unit | Landing Tele tile | Tele nursing station / central monitor bank for the assignment picker | `game/assets/media/dept-tele.webp` |
| `dept-medsurg` | image | Med-Surg unit | Landing Med-Surg tile | Floor hallway / nurses station + med cart mood | `game/assets/media/dept-medsurg.webp` |
| `dept-icu` | image | ICU unit | Landing ICU tile | ICU bay with vents/pumps, higher acuity | `game/assets/media/dept-icu.webp` |
| `situation-code-blue` | image | Code Blue | `assets/media/situation-code-blue.webp`| Crash cart / defibrillator emergency backdrop | `assets/media/situation-code-blue.webp` |
| `situation-critical-lab` | image | Critical lab | `assets/media/situation-critical-lab.webp`| Lab call urgency at the nurses station | `assets/media/situation-critical-lab.webp` |
| `situation-bed-prep` | image | Bed prep | `assets/media/situation-bed-prep.webp`| Empty bed being made / wall O2-suction | `assets/media/situation-bed-prep.webp` |
| `slot-perform` | image | Performing care | `assets/media/slot-perform.webp`| Generic bedside-care thumb when task type has no `slotByTaskType` entry | `assets/media/slot-perform.webp` |
| `slot-perform-video` | video | Performing care | `assets/media/slot-perform-video.mp4`| Short silent loop for fallback slot; enable via `slotPreferVideo: true` | `assets/media/slot-perform-video.mp4` |
| `slot-med` | image | Pills / capsules | `assets/media/slot-med.webp`| Oral pills/capsules thumb (also type=`med` fallback) | `assets/media/slot-med.webp` |
| `slot-med-shot` | image | Injection / shot | `assets/media/slot-med-shot.webp`| SQ/IM syringe shot thumb | `assets/media/slot-med-shot.webp` |
| `slot-med-ivpb` | image | IVPB | `assets/media/slot-med-ivpb.webp`| Secondary IV piggyback bag thumb | `assets/media/slot-med-ivpb.webp` |
| `slot-med-iv-push` | image | IV push | `assets/media/slot-med-iv-push.webp`| IV push syringe-into-line thumb | `assets/media/slot-med-iv-push.webp` |
| `slot-assessment` | image | Shift assessment | `assets/media/slot-assessment.webp`| Bedside vitals / stethoscope thumb | `assets/media/slot-assessment.webp` |
| `slot-chart-assessment` | image | Chart assessment | `assets/media/slot-chart-assessment.webp`| Charting at a computer workstation (distinct from shift assess) | `assets/media/slot-chart-assessment.webp` |
| `slot-turn-patient` | image | Turn patient | `assets/media/slot-turn-patient.webp`| Q2H turn / reposition thumb | `assets/media/slot-turn-patient.webp` |
| `slot-chair-alarm` | image | Chair alarm | `assets/media/slot-chair-alarm.webp`| Chair exit-alarm thumb | `assets/media/slot-chair-alarm.webp` |
| `slot-bed-alarm` | image | Bed alarm | `assets/media/slot-bed-alarm.webp`| Bed exit-alarm thumb | `assets/media/slot-bed-alarm.webp` |
| `slot-call-light` | image | Call light | `assets/media/slot-call-light.webp`| Nurse call-light thumb | `assets/media/slot-call-light.webp` |
| `slot-iv` | image | IV check | `assets/media/slot-iv.webp`| Infusion pump / drip thumb | `assets/media/slot-iv.webp` |
| `slot-orders` | image | Orders | `assets/media/slot-orders.webp`| Doctor-orders clipboard thumb | `assets/media/slot-orders.webp` |
| `slot-criticallab` | image | Critical lab | `assets/media/slot-criticallab.webp`| Critical lab call thumb | `assets/media/slot-criticallab.webp` |
| `slot-admission` | image | Admission | `assets/media/slot-admission.webp`| Admission / wristband thumb | `assets/media/slot-admission.webp` |
| `slot-bedprep` | image | Bed prep | `assets/media/slot-bedprep.webp`| Bed-prep linens thumb | `assets/media/slot-bedprep.webp` |
| `slot-procedure` | image | Procedure | `assets/media/slot-procedure.webp`| Procedure tray thumb | `assets/media/slot-procedure.webp` |
| `slot-rhythm-strip` | image | Rhythm strip | `assets/media/slot-rhythm-strip.webp` | Central / telemetry rhythm-strip analysis busy-slot thumb | `assets/media/slot-rhythm-strip.webp` |
| `challenge-code-blue` | image | Code Blue | `assets/media/challenge-code-blue.webp`| Wide still above Code Blue questions (also uses modal situation still) | `assets/media/challenge-code-blue.webp` |
| `challenge-code-blue-video` | video | Code Blue | `assets/media/challenge-code-blue-video.mp4`| Short silent loop preferred in-modal (`preferVideo: true`) | `assets/media/challenge-code-blue-video.mp4` |
| `challenge-bed-prep` | image | Bed prep | `assets/media/challenge-bed-prep.webp`| Wide still above gather-items game | `assets/media/challenge-bed-prep.webp` |
| `challenge-med-identity` | image | Med identity | `assets/media/challenge-med-identity.webp`| Med cart / vial still above brand↔generic quiz | `assets/media/challenge-med-identity.webp` |
| `challenge-ivpb-hang` | image | IVPB hang | `assets/media/challenge-ivpb-hang.webp`| Secondary bag / pump still | `assets/media/challenge-ivpb-hang.webp` |
| `challenge-accucheck` | image | Accucheck | `assets/media/challenge-accucheck.webp`| Glucometer / sliding-scale still | `assets/media/challenge-accucheck.webp` |
| `challenge-admission` | image | Admission | `assets/media/challenge-admission.webp`| Clipboard / wristband still | `assets/media/challenge-admission.webp` |
| `challenge-icp` | image | ICP | `assets/media/challenge-icp.webp`| ICP waveform / EVD still | `assets/media/challenge-icp.webp` |
| `challenge-iv-check` | image | IV check | `assets/media/challenge-iv-check.webp`| IV site + infusion pump still (**before**) | `assets/media/challenge-iv-check.webp` |
| `challenge-code-blue-after` | image | Code Blue — resolved | `assets/media/challenge-code-blue-after.webp`| Calm/stable bedside after successful response | `assets/media/challenge-code-blue-after.webp` |
| `challenge-bed-prep-after` | image | Bed prep — ready | `assets/media/challenge-bed-prep-after.webp`| Made bed ready for admission | `assets/media/challenge-bed-prep-after.webp` |
| `challenge-med-identity-after` | image | Med identity — verified | `assets/media/challenge-med-identity-after.webp`| Verified med package | `assets/media/challenge-med-identity-after.webp` |
| `challenge-ivpb-hang-after` | image | IVPB hang — running | `assets/media/challenge-ivpb-hang-after.webp`| Secondary bag running | `assets/media/challenge-ivpb-hang-after.webp` |
| `challenge-iv-check-after` | image | IV check — confirmed | `assets/media/challenge-iv-check-after.webp`| Confirmed pump rate | `assets/media/challenge-iv-check-after.webp` |
| `challenge-accucheck-after` | image | Accucheck — logged | `assets/media/challenge-accucheck-after.webp`| Result logged | `assets/media/challenge-accucheck-after.webp` |
| `challenge-admission-after` | image | Admission — complete | `assets/media/challenge-admission-after.webp`| Checklist complete | `assets/media/challenge-admission-after.webp` |
| `challenge-icp-after` | image | ICP — monitored | `assets/media/challenge-icp-after.webp`| Controlled ICP waveform | `assets/media/challenge-icp-after.webp` |

Toggle challenge heroes: `GameConfig.mediaPlaceholders.mounts.challenges`. Per-game map: `mediaPlaceholders.challenges.<key>` (`imageId`/`videoId` = **before** during quiz; `afterImageId` swaps in after the last question / challenge-level target, on the Continue screen before the modal closes).

Busy-slot thumbs: `mediaPlaceholders.slotByTaskKind` maps `metadata.kind` first (`chart-assessment`, `shift-assessment`, `turn-patient`, `chair-alarm`, `bed-alarm`, `call-light`, `rhythm-strip`, `med-pills`, `med-shot`, `med-ivpb`, `med-iv-push`, …), then `slotByTaskType` (`med` → `slot-med`, …). Med form kinds are stamped from pack `data-route` / `data-task-kind` or inferred (`data-challenge="ivpb"`, name markers like `SQ` / `IVPB` / `IV push`). Rhythm-strip thumbs infer from `metadata.skillId=ecg-basics` or name markers (`rhythm strip`). Type `assessment` is **not** mapped (too many non-assess tasks share it). Unmapped use `slotFallbackId` (`slot-perform`).

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
