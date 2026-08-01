# replace-placeholder-assets — reference

## PHP query contract

| Param | Role |
|-------|------|
| `title` | Text drawn on the SVG placeholder |
| `prompt` | Subject brief; runtime always appends shared fun-medical-simulation style (`promptStyleAppendix`) onto `data-asset-prompt` / `X-Asset-Prompt` |
| `w` / `h` | Size |
| `id` | Footer label / catalog id |

- Image: `/placeholders/image.php?title=…&prompt=…&id=…`
- Video poster: `/placeholders/video.php?title=…&prompt=…&id=…`
- Tag helper: `ph_media_tag($opts)` in `placeholders/partials/media-tag.php`

## JS config (`GameConfig.mediaPlaceholders`)

| Key | Role |
|-----|------|
| `enabled` | Master switch |
| `source` | `data-url` (static server) or `php` |
| `phpBase` | Default `/placeholders` |
| `mounts.landingDepartments` | Tele / Med-Surg / ICU tiles |
| `mounts.situations` | Fills null `scene.situationStills` |
| `mounts.criticalLab` | Spawn toast media |
| `mounts.slots` | Busy slot thumbs |
| `mounts.challenges` | In-modal heroes for games/quizzes |
| `challenges.<key>` | `{ imageId, videoId?, preferVideo? }` — Code Blue prefers video |
| `slotByTaskKind` | `metadata.kind` → catalog id (`chart-assessment`, `med-pills`, `med-shot`, `med-ivpb`, `med-iv-push`, …) |
| `slotByTaskType` | `task.type` → catalog id (`med` → `slot-med` pills fallback, …) |
| `slotFallbackId` | Default `slot-perform` when kind/type unmapped |
| `slotPreferVideo` | Use `slot-perform-video` for fallback only |
| `assets` | Per-id patches merged onto catalog |

Disable: `enabled: false`, `?placeholders=0`, or `localStorage.rngame.mediaPlaceholders=0`.

## Mount map

| mount | Code |
|-------|------|
| `landing.unit.*` | `assets/js/landing-media.js` |
| `situation.code-blue` / `bed-prep` / `critical-lab` | `media-placeholders.applySituationPlaceholderUrls` → `scene-backdrop` |
| `situation.critical-lab` (toast) | `showCriticalLabMedia` from `critical-labs.js` |
| `slot.busy` (+ `.med` / `.assessment` / …) | `slot-system` → `slotMediaHtml` / `resolveSlotAssetId` |
| `challenge.code-blue` (+ `.video`) | `challengeMediaHtml('code-blue')` in code-blue challenge |
| `challenge.bed-prep` / `med-identity` / `ivpb-hang` / `iv-check` / `accucheck` / `admission` / `icp` | matching `render*Html` via `challengeMediaHtml` (before) |
| `challenge.*.after` | `afterImageId` → `revealChallengeAfterMedia` in `showPassedAcknowledge` (after last q, before Continue) |
