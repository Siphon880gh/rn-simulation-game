# AGENTS_CODE_REFERENCE-ui.md

Shell UI, modal, docs, and styling for AI assistants.

**Approximate location cues are intentional.** Exact line numbers drift.

Parent: [`AGENTS_CODE_REFERENCE.md`](AGENTS_CODE_REFERENCE.md)

---

## Role

Browser chrome around the sim: header/clock/pause, patient grid mount, modal overlay, floating docs button, bottom task-queue bar placeholders, and status CSS.

| File | ~Lines | Role |
|------|--------|------|
| `game/index.html` | ~132 | DOM shell + CDN scripts + module entry |
| `game/assets/js/modal.js` | ~212 | Modal configs + open/close/promise helpers |
| `game/assets/js/docs.js` | ~336 | Nested docs dropdown (non-module IIFE) |
| `game/assets/css/declarative-tasks.css` | ~150 | Task status + type styles |
| `game/assets/css/app.css` | ~8 | App-level CSS |
| `game/assets/css/patients.css` | ~3 | Patient CSS |

---

## Shell regions (`game/index.html`)

| Region | Selector / id | Notes |
|--------|---------------|--------|
| Title | header `h1` | “ICU Simulation” |
| Clock | `#clock` | Filled by timer |
| Shift ends hint | `#shift-ends` | Toggled via clock box click |
| Pause | `#pause` | Wired in timer module |
| Patients | `#patients` | Grid mount |
| Modal | `#modal`, `#modal-title`, `#modal-content`, `#modal-footer` | Hidden by default |
| Task queue | `#task-queue-bar` | Three slot placeholders — not full logic |
| Docs FAB | `#docs-container` / `#docs-button` / `#docs-list` | Fixed bottom-right |
| Reveal style | `#reveal-scheduled-tasks` | Empty `<style>` filled by timer |

Scripts (near end of body): jQuery, livequery, signals, contextMenu, then `app.js` module + `docs.js` classic script + CSS links.

Selectors centralized in `GameConfig.selectors` (`game-config.js`).

---

## Modal (`modal.js`)

Declarative `modalConfigs` near top: `gameOver`, `taskDetails`, `medicationConfirm`.

API: `openModal(typeOrConfig)`, `closeModal()`, `modifyModal`, `showGameOver`, `showTaskDetails`, `showMedicationConfirmation` (promise), `showModalWithPromise`.

- Persistent `gameOver` refuses `closeModal`.  
- `window.confirmAction` used by medication confirm footer.  
- Subscribes to `gameStatus === GAME_OVER` to show game over.  
- Globals also exposed from `app.exposeGlobals`: `openModal`, `closeModal`, `modifyModal`.

---

## Docs (`docs.js`)

Classic jQuery IIFE (not ES module). Structure near top:

```js
docsStructure = {
  devs: { files: ['MEDICATION_WINDOW_MECHANICS.md', ...] },
  players: { files: ['ABOUT.md'] }
}
```

Fetches markdown from `../docs/{category}/` relative to game page, renders with `marked` into modal. Category expand/collapse in dropdown.

Adding a doc: place file under `docs/devs/` or `docs/players/` **and** list it in `docsStructure`.

---

## Task CSS (`declarative-tasks.css`)

- Base `[data-task-type]` transitions  
- Status: `not-yet` (dim), `active`, `completed`, `overdue` (pulse)  
- Type-specific / slot-label rules further down the file  

---

## Safe-edit notes

- Prefer Tailwind utility classes already used in shell; keep clinical panels readable (product constraint: panels-first).  
- Do not remove `#reveal-scheduled-tasks` or modal footer hooks without updating timer/modal callers.  
- Slot bar is visual scaffolding only until E3 slot execution.  
- CDN Tailwind in production is acceptable for current MVP; bundling would be a stack decision.
