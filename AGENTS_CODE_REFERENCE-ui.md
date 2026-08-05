# AGENTS_CODE_REFERENCE-ui.md

Shell UI, modal, docs, and styling for AI assistants.

**Approximate location cues are intentional.** Exact line numbers drift.

Parent: [`AGENTS_CODE_REFERENCE.md`](AGENTS_CODE_REFERENCE.md)

---

## Role

Browser chrome around the sim: locked shell regions (E1.M2), patient main mount, modal overlay, Docs FAB, task-queue slots, shift history log, and status CSS.

| File | ~Lines | Role |
|------|--------|------|
| `game/index.html` | ~170 | DOM shell + CDN scripts + module entry |
| `game/assets/js/shell-chrome.js` | ~ESM | Hour tabs, shift log, lean pause, mobile slots/log FABs |
| `game/assets/js/right-menu.js` | ~ESM | E10 Orders + Tools + E13 Delegate rail + mobile rail accordion |
| `game/assets/js/delegation.js` | ~ESM | E13 CCT/CNA availability + turn assist helpers |
| `game/assets/js/modal.js` | ~210 | Modal configs + open/close/promise helpers |
| `game/assets/js/debrief.js` | ~ESM | E6 end screen: short Won/Lost + performance meter; optional “Show debrief” teaching expand |
| `game/assets/js/docs.js` | ~ESM | Help FAB + markdown viewer |
| `game/assets/css/shell.css` | ~180 | Shell grid / chrome layout |
| `game/assets/css/scene.css` | ~80 | E7.M1 unit themes + situation still + light motion |
| `game/assets/js/scene-backdrop.js` | ~80 | Apply theme/image; situation stills on modal |
| `game/assets/js/media-placeholders.js` | ~ESM | Catalog + titled placeholders (data-url or PHP); challenge/slot/critical-lab mounts |
| `game/assets/js/media-placeholder-catalog.json` | — | Asset ids, dimensions, prompts, `replaceWith` |
| `assets/js/landing-media.js` | ~classic | Landing department tile media (`dept-*`) |
| `assets/css/landing.css` | — | Front-door unit tiles + muted challenge games expand |
| `placeholders/` | PHP | Optional `image.php` / `video.php` titled SVG service |
| `game/assets/css/declarative-tasks.css` | ~150 | Task status + type styles (+ `.task-slot-media*`) |
| `game/assets/css/app.css` | — | App-level + `.challenge-media-wrap` |
| `game/assets/css/patients.css` | — | Patient + clinical-status badge CSS |

---

## Shell regions (`game/index.html`)

| Region | Selector / id | Notes |
|--------|---------------|--------|
| Shell root | `#shell` | CSS grid: top primary → top secondary → body → bottom |
| Top primary | `#shell-top-primary` | Brand, `#fiction-disclaimer`, clock, pause |
| Top secondary | `#shell-top-secondary` / `#shell-hour-tabs` | Hour strip (E4.M2 fills content) |
| Left menu | `#shell-left-menu` | Placeholder for patient nav (E2) |
| Main | `#shell-main` / `#patients` | Clinical panels mount |
| Right menu | `#shell-right-menu` | Orders/Tools/Delegate inside `[data-rail-accordion]`; `right-menu.js` |
| Bottom | `#shell-bottom` | History log + slots only (desktop); mobile uses FABs + floating panels — no live status/score strip |
| History log | `#shift-history-log` | Append-only via `APPEND_SHIFT_LOG` |
| Task queue | `#task-queue-bar` / `#slot-waiting-queue` | 3 slots + FIFO wait (slot-system.js); exclusive → `.task-slot--disabled`; busy slots show type thumbs via `slotByTaskType` (`slot-med`, …) with `slot-perform` fallback |
| Critical lab media | `#shell-critical-lab-media` | Placeholder host for critical-lab spawn still |
| Clock / Pause | `#clock` / `#pause` / `#shell-lean-pause` | Timer module; lean chip on mobile collapsed chrome |
| Slots / log toggles | `#shell-slots-toggle` / `#shell-log-toggle` | Mobile FABs; body classes `shell-slots-visible` / `shell-log-visible` |
| Modal | `#modal`… | Overlay; dims `#shell`; challenge heroes via `challengeMediaHtml`. Tall panels: `.modal-panel` max-height uses `svh`/`dvh`; `#modal-content` scrolls; title/footer pinned (`shell.css`) |
| Docs FAB | `#docs-container` | Fixed bottom-right |
| Reveal style | `#reveal-scheduled-tasks` | Empty `<style>` filled by timer |

Selectors centralized in `GameConfig.selectors` (`game-config.js`).

---

## Mobile shell (`shell.css` `@media max-width: 900px`)

- Super-collapsed clock: `#shell-lean-pause` shows time + pause; full clock chrome hidden.
- Brand copy condensed; Read more opens disclaimer/objectives modal.
- Right rail: accordion sections (one open at a time on narrow); badges from `right-menu.js`.
- Patient tabs: horizontal scroll row with abbreviated names (`.patient-tab-name--abbrev` from `patients.js`).
- Bottom chrome lean: event log + slot cluster float via FABs; `--shell-bottom-height` ~0 (no status strip).
- Slot cluster visibility: `body.shell-slots-visible` (also gated in `declarative-tasks.css` so it does not force-flex on mobile).

---

## Modal (`modal.js`)

Declarative `modalConfigs` near top: `gameOver`, `taskDetails`, `medicationConfirm`.

API: `openModal(typeOrConfig)`, `closeModal()`, `modifyModal(title, content, footer)`, `showGameOver`, `showTaskDetails`, `showMedicationConfirmation` (promise), `showModalWithPromise`.

- Persistent `gameOver` refuses `closeModal` (kept as fallback).  
- `window.confirmAction` used by medication confirm footer.  
- Does **not** auto-open on `GAME_OVER`; `app.handleGameOver` → `debrief.showPrioritizationDebrief()`.  
- End UI (`debrief.js`): short **Game Over — Won/Lost** with 4-tier meter (Off pace / Getting by / Steady charge / Sharp shift; average-or-below = lost), score + too-late / completed / missed / cheated counts; **Show debrief** expands teaching lists + perform challenge fail/pass counts. Score lives only here (no live `#shell-score`).  
- QA seed path: `game-over-test.js` + `?game-over=<preset>` when `config/test.json` has `"testGameOver": true` (homepage section `#landing-game-over-tests` via `assets/js/landing-game-over-test.js`). App skips census/timer and opens the debrief immediately. Presets cover perfection / near-perfection / lots-of-cheats / lots-of-late / few-late / no-late / getting-by / off-pace. `SET_SCORE` + `testSeeded` skip miss rewrites in `finalizeShiftScore`. ≥3 late demotes one meter tier. AUTO: `node scripts/verify-game-over-test.mjs`.
- Globals also exposed from `app.exposeGlobals`: `openModal`, `closeModal`, `modifyModal`.

---

## Landing challenge games (`index.html`)

Muted expand under Unit assignment: **I want something more challenging** → `.landing-challenge__games` grid of `.landing-challenge-game` cards (reasons always visible + **Start**). First card: six-patient night → `night-shift-default.json` (Med-Surg + Lyle ICU acuity). Single card spans full width via `:has(:only-child)`.

---

## Docs (`docs.js` + markdown stack)

ES module. `docsStructure` near top registers `devs` / `players` / `learning` files. Fetch stays `../docs/{category}/{file}`; render goes through `markdown-renderer.js` (`markdown-it` + texmath/KaTeX + Mermaid enhance). Opens in-page `#docs-viewer` (not a popup). Internal `[[wiki]]` / relative `.md` links + `link-popover.js` hover Preview/Contents.

Adding a doc: place under `docs/{devs,players,learning}/` **and** list it in `docsStructure`.

---

## Task CSS (`declarative-tasks.css`)

- Base `[data-task-type]` transitions  
- Status: `not-yet` (dim), `active`, `completed`, `overdue` (pulse)  
- Type-specific / slot-label rules further down the file
- `.task-slot--disabled` + `.task-queue-bar--exclusive` when an exclusive slot task is active  
- `.task-slot-media-btn` / `.task-slot-media` for busy-slot placeholder thumbs  

---

## Media placeholders

- Config: `GameConfig.mediaPlaceholders` (`enabled`, `source: data-url|php`, `mounts.*`, `challenges` map, `slotByTaskType` / `slotFallbackId`, optional `assets` overrides).
- Catalog: `media-placeholder-catalog.json`; inventory doc: `PLACEHOLDER_ASSETS.md`.
- Default source is client **data-url** SVG (works on static servers); PHP under `placeholders/` when `source: 'php'`.
- Mounts: landing departments, situation stills, critical-lab toast, busy slots (per `task.type`), in-modal challenge heroes.
- Slot thumbs: `resolveSlotAssetId` → `slotByTaskKind` first (`shift-assessment` / `chart-assessment` / `turn-patient` / `chair-alarm` / `bed-alarm` / `call-light` / `med-pills` / `med-shot` / `med-ivpb` / `med-iv-push`), then med-form inference (`data-route` / challenge / name), then `slotByTaskType` (`med`→`slot-med`, …; **not** raw `assessment`); unmapped → `slot-perform`.
- Challenge map: `imageId`/`videoId` = **before** (during quiz); `afterImageId` = after-pass still. `revealChallengeAfterMedia(key)` runs from `showPassedAcknowledge` in `challenge-gate.js` (after last question, before Continue closes). CSS: `.challenge-media-wrap--after` / `.challenge-media-phase-label` in `app.css`.
- Final art: set catalog/`assets.<id>.replaceWith` (e.g. `assets/media/dept-tele.webp`); agent skills `scan-placeholder-assets` / `replace-placeholder-assets`.
- Disable: `enabled: false` or `?placeholders=0`.

---

## Safe-edit notes

- Prefer Tailwind utility classes already used in shell; keep clinical panels readable (product constraint: panels-first).  
- Do not remove `#reveal-scheduled-tasks` or modal footer hooks without updating timer/modal callers.  
- Keep shell region ids stable — E2/E4/E6 mount into these landmarks.  
- Keep `#shell-critical-lab-media` when touching critical-lab UI.  
- CDN Tailwind in production is acceptable for current MVP; bundling would be a stack decision.
