# AGENTS_CODE_REFERENCE-timer.md

Timer / shift-clock subsystem for AI assistants.

**Approximate location cues are intentional.** Exact line numbers drift.

Parent: [`AGENTS_CODE_REFERENCE.md`](AGENTS_CODE_REFERENCE.md)

---

## Role

Accelerated military clock for one shift: tick display, pause/resume, scheduled 15-minute poll marks that reveal tasks, and game-over when real-time shift budget runs out.

| File | ~Lines | Role |
|------|--------|------|
| `game/assets/js/timer_ingame.js` | ~276 | IIFE module: start/pause/resume/stop, tick, reveal |
| `game/assets/js/timer_utils.js` | ~69 | HHMM math: round to 15, add minutes, list poll marks |
| `game/assets/js/game-config.js` | ~69 | `timer.*` defaults, `#clock` / `#pause` selectors |
| `game/assets/js/events.js` | ~23 | Legacy `signals.Signal` reveal (largely superseded) |
| `game/app.config.js` | ~53 | Presets / `CALCULATED_SPEED_FACTOR` — **not imported by app.js** |

---

## Public API (`timer_ingame.js`)

Exported default object near end of file:

- `start(clockSelector, pauseSelector, speedFactor, gameMinutesPerShift, shiftStart, gameOverCallback)`
- `pollTime()` → `{ currentTime, secondsLeft, isPaused, progress }`
- `pause` / `resume` / `stop` / `getState`

Called from `app.js` `startGame()` with `GameConfig.selectors` and URL-parsed config.

---

## Flow

1. **`initialize` (inside module)** — stores shift start, `secondsLeft = gameMinutesPerShift * 60`, `timePerDay = gameMinutesPerShift * 60`, builds `pollTaskTimes` via `list15MinTimemarksFromHHMM`.
2. **`start`** — `setInterval` every `1000 / speedFactor` ms; skips tick when paused.
3. **`tickTimer`** — decrement `secondsLeft`; `calculateCurrentTime()` → HHMM + seconds; update `#clock`; `gameState.dispatch('UPDATE_TIME', { time: hours })`; `checkScheduledEvents`.
4. **Poll hit** — when elapsed HHMM reaches next poll mark, `dispatchScheduledTaskEvent`: append CSS rule into `#reveal-scheduled-tasks`, set matching `li[data-scheduled]` to `active`, dispatch `ACTIVATE_SCHEDULED_TASKS`.
5. **Exhaustion** — stop interval, `GAME_OVER`, invoke callback (app opens game-over modal).

Pause button: near middle of file (`setupPauseButton`) — clones node to clear listeners; toggles label Pause/Resume; dispatches `TOGGLE_PAUSE`.

---

## Time model

- **Display / schedule keys:** military HHMM integer (`1900` = 19:00).
- **Speed:** larger `speed-factor` → shorter real session (interval fires faster). App defaults currently use a large factor (e.g. 1440) unless URL overrides.
- **URL params** (parsed in `app.js`): `speed-factor`, `shift-starts`, `shift-duration`.
- **Utils** (`timer_utils.js`): `roundDownTo15`, `timemarkPlusMinutes`, `divideBy15Mins`, `list15MinTimemarksFromHHMM` — all HHMM-oriented; midnight wrap handled in add/list helpers.

### Snippet — poll reveal (around middle of `timer_ingame.js`)

```js
// On poll hit: inject CSS li[data-scheduled="${hhmm}"] { opacity: 1 !important; }
// Set DOM data-status to GameConfig.tasks.statuses.ACTIVE
// gameState.dispatch('ACTIVATE_SCHEDULED_TASKS', { time: hhmm })
```

---

## Safe-edit notes

- Keep HHMM integer math consistent with `task-system` comparisons (`currentTime >= task.scheduled`).
- `#reveal-scheduled-tasks` is an empty `<style>` in `game/index.html` — required for CSS reveal path.
- Prefer fixing/extending `timer_ingame.js` over reactivating `events.js` unless syncing both on purpose.
- Product next step (E1.M1): audit/lock clock & speed contracts — `app.config.js` vs `GameConfig` vs URL defaults may need consolidation.
