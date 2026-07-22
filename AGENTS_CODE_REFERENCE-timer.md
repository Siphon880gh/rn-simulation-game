# AGENTS_CODE_REFERENCE-timer.md

Timer / shift-clock subsystem for AI assistants.

**Approximate location cues are intentional.** Exact line numbers drift.

Parent: [`AGENTS_CODE_REFERENCE.md`](AGENTS_CODE_REFERENCE.md)

---

## Role

Accelerated military clock for one shift: tick display, pause/resume with **owned pause sources**, scheduled 15-minute poll marks that reveal tasks, and game-over when real-time shift budget runs out.

| File | ~Lines | Role |
|------|--------|------|
| `game/assets/js/timer_ingame.js` | ~280 | IIFE module: start/pause/resume/stop, tick, reveal |
| `game/assets/js/timer_utils.js` | ~69 | HHMM math: round to 15, add minutes, list poll marks |
| `game/assets/js/game-config.js` | ~90 | `timer.*` defaults, pause source ids, `#clock` / `#pause` selectors |
| `game/assets/js/game-state.js` | ~200 | `SET_PAUSE` / `UPDATE_TIME` / `INITIALIZE_GAME` / `GAME_OVER` |
| `game/assets/js/event-drip.js` | ~220 | E4.M2: pack events on `currentTime` (pause-safe); thin deterioration |
| `game/assets/js/events.js` | ~23 | Legacy `signals.Signal` reveal (largely superseded) |
| `game/app.config.js` | ~53 | Presets / `CALCULATED_SPEED_FACTOR` — **not imported by app.js** (legacy) |

---

## Contracts (E1.M1 locked)

### Speed / shift bounds

- **Canonical defaults:** `GameConfig.timer` (`defaultSpeedFactor`, `defaultShiftStart`, `defaultShiftDuration`).
- **URL overrides** (`GameConfig.urlParams`): `speed-factor`, `shift-starts`, `shift-duration` — parsed in `app.js` `parseURLParameters()`.
- **Display / schedule keys:** military HHMM integer (`1900` = 19:00).
- **Speed:** interval = `1000 / speedFactor` ms; larger factor → shorter real session.
- Do **not** reintroduce parallel defaults in `AppConfig` — they read from `GameConfig.timer`.

### Pause ownership matrix

| Source id | Who | Behavior |
|-----------|-----|----------|
| `user` | `#pause` button | Toggle adds/removes only this source |
| `modal` | Blocking modals (opt-in) | Hold while modal should freeze the shift |
| `challenge` | Perform mini-games (E5) | Hold while `challenge-gate` modal is open; cleared on pass/fail/cancel |
| `system` | Bootstrap / teardown | Reserved |

- State: `pauseSources: string[]`, `isPaused = pauseSources.length > 0`.
- Action: `gameState.dispatch('SET_PAUSE', { paused: boolean, source })`.
- `TOGGLE_PAUSE` only flips the `user` source (convenience).
- Timer interval skips ticks when `isPaused`; button label syncs via `subscribe('isPaused')`.
- `GAME_OVER` status is not overwritten by later `SET_PAUSE`.

---

## Public API (`timer_ingame.js`)

- `start(clockSelector, pauseSelector, speedFactor, gameMinutesPerShift, shiftStart, gameOverCallback)`
- `pollTime()` → `{ currentTime, secondsLeft, isPaused, progress }`
- `pause(source?)` / `resume(source?)` / `stop` / `getState` — pause/resume dispatch `SET_PAUSE`

Called from `app.js` `startGame()` with `GameConfig.selectors` and URL-parsed config.

---

## Flow

1. **`initialize`** — shift start, `secondsLeft = gameMinutesPerShift * 60`, poll marks via `list15MinTimemarksFromHHMM`.
2. **`start`** — `setInterval` every `1000 / speedFactor` ms; skips tick when paused.
3. **`tickTimer`** — decrement `secondsLeft`; HHMM display; `UPDATE_TIME`; poll reveal.
4. **Exhaustion** — stop interval, `GAME_OVER`, callback (app opens game-over modal; avoids double-dispatch if already over).

---

## Safe-edit notes

- Keep HHMM integer math consistent with `task-system` comparisons.
- `#reveal-scheduled-tasks` empty `<style>` in `game/index.html` is required for CSS reveal.
- Prefer `SET_PAUSE` with an explicit source over mutating `timerState.isPaused` directly.
- Leave `game/app.config.js` unwired unless a milestone deliberately migrates presets.
