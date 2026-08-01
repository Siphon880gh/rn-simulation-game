# scan-placeholder-assets — reference

## Hunt surfaces

| Surface | Where to look | Typical id / mount | Default w×h |
|---------|---------------|--------------------|-------------|
| Landing departments | `index.html` `.unit-tile--*` | `dept-*` / `landing.unit.*` | 640×360 |
| Situation stills | `GameConfig.scene.situationStills`, `scene-backdrop.js` | `situation-*` / `situation.*` | 960×540 |
| Critical lab toast | `critical-labs.js` + `#shell-critical-lab-media` | `situation-critical-lab` | 640×360 |
| Busy slots | `slot-system.js` | `slot-perform` (+ video) | 160×120 (thumb) / 320×180 video |
| Challenge heroes (before) | `challenges/**/challenge.js` `render*Html` | `challenge-<key>` / `challenge.<key>` | 720×280–320 |
| Challenge after-pass | `afterImageId` + `revealChallengeAfterMedia` in `showPassedAcknowledge` | `challenge-<key>-after` / `challenge.<key>.after` | same as before |
| Skill MCQ banks | library skills using `skill-mcq` | optional per-skill hero | 720×280 |
| Debrief / game-over | `debrief.js`, modal | `situation-debrief` (if approved) | 960×540 |

### Challenge keys already mapped

From `GameConfig.mediaPlaceholders.challenges`: `code-blue`, `bed-prep`, `med-identity`, `ivpb-hang`, `iv-check`, `accucheck`, `admission`, `icp`.

Unmapped challenge folders → candidates (new skills) unless excluded. Skip `skill-mcq` (shared engine).

## Prompt assembly

```text
{subject from catalog.prompt}
 Dimensions: {w}×{h}px — …
 Style (fun medical simulation): …
```

Implemented in:

- JS: `resolvePrompt` → `withPromptDimensions` → `withPromptStyle`
- PHP: `ph_resolve_prompt($title, $prompt, $kind, $w, $h)`
- Landing: `assets/js/landing-media.js` (same order)

## Size heuristics

| Mount role | Prefer |
|------------|--------|
| Landing tile | 640×360 |
| Modal backdrop / situation | 960×540 |
| In-modal challenge hero | 720×280 or 720×320 |
| Slot thumb | 160×120 |
| Slot / hero video | 720×320 or 320×180 (slot) |

## Related skills

| Skill | When |
|-------|------|
| `scan-placeholder-assets` | Find + propose + wire placeholders |
| `replace-placeholder-assets` | User supplied final art → set `replaceWith` |
