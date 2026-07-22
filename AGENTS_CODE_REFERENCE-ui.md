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
| `game/assets/js/shell-chrome.js` | ~120 | Hour tabs + shift history log wiring |
| `game/assets/js/right-menu.js` | ~ESM | E10 Orders + Tools right rail (subscribe-driven) |
| `game/assets/js/modal.js` | ~210 | Modal configs + open/close/promise helpers |
| `game/assets/js/debrief.js` | ~160 | E6.M0 thin prioritization debrief (completed/late/missed + shift log) |
| `game/assets/js/docs.js` | ~ESM | Help FAB + markdown viewer |
| `game/assets/css/shell.css` | ~180 | Shell grid / chrome layout |
| `game/assets/css/scene.css` | ~80 | E7.M1 unit themes + situation still + light motion |
| `game/assets/js/scene-backdrop.js` | ~80 | Apply theme/image; situation stills on modal |
| `game/assets/css/declarative-tasks.css` | ~150 | Task status + type styles |
| `game/assets/css/app.css` | ~8 | App-level CSS |
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
| Right menu | `#shell-right-menu` | E10 Orders (`#orders-rail`) + Tools (`#tools-rail`); `right-menu.js` |
| Bottom | `#shell-bottom` | History + slots + status |
| History log | `#shift-history-log` | Append-only via `APPEND_SHIFT_LOG` |
| Task queue | `#task-queue-bar` / `#slot-waiting-queue` | 3 slots + FIFO wait (slot-system.js) |
| Status bar | `#shell-status-bar` / `#shell-status-message` | Live status line |
| Clock / Pause | `#clock` / `#pause` | Timer module |
| Modal | `#modal`… | Overlay; dims `#shell` |
| Docs FAB | `#docs-container` | Fixed bottom-right |
| Reveal style | `#reveal-scheduled-tasks` | Empty `<style>` filled by timer |

Selectors centralized in `GameConfig.selectors` (`game-config.js`).

---

## Modal (`modal.js`)

Declarative `modalConfigs` near top: `gameOver`, `taskDetails`, `medicationConfirm`.

API: `openModal(typeOrConfig)`, `closeModal()`, `modifyModal`, `showGameOver`, `showTaskDetails`, `showMedicationConfirmation` (promise), `showModalWithPromise`.

- Persistent `gameOver` refuses `closeModal` (kept as fallback).  
- `window.confirmAction` used by medication confirm footer.  
- Does **not** auto-open on `GAME_OVER`; `app.handleGameOver` → `debrief.showPrioritizationDebrief()`.  
- Globals also exposed from `app.exposeGlobals`: `openModal`, `closeModal`, `modifyModal`.

---

## Docs (`docs.js` + markdown stack)

ES module. `docsStructure` near top registers `devs` / `players` / `learning` files. Fetch stays `../docs/{category}/{file}`; render goes through `markdown-renderer.js` (`markdown-it` + texmath/KaTeX + Mermaid enhance). Opens in-page `#docs-viewer` (not a popup). Internal `[[wiki]]` / relative `.md` links + `link-popover.js` hover Preview/Contents.

Adding a doc: place under `docs/{devs,players,learning}/` **and** list it in `docsStructure`.

---

## Task CSS (`declarative-tasks.css`)

- Base `[data-task-type]` transitions  
- Status: `not-yet` (dim), `active`, `completed`, `overdue` (pulse)  
- Type-specific / slot-label rules further down the file  

---

## Safe-edit notes

- Prefer Tailwind utility classes already used in shell; keep clinical panels readable (product constraint: panels-first).  
- Do not remove `#reveal-scheduled-tasks` or modal footer hooks without updating timer/modal callers.  
- Keep shell region ids stable — E2/E4/E6 mount into these landmarks.  
- CDN Tailwind in production is acceptable for current MVP; bundling would be a stack decision.
