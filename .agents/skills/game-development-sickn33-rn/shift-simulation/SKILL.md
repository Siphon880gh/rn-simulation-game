---
name: shift-simulation
description: >-
  Implements panel-first real-time nursing shift simulation: military clock,
  multi-patient census, task availability windows, concurrent execution slots,
  scenario event drip, perform challenge pause boundary, and teaching debrief.
  Use when working on E1–E6, gameState/timer/tasks/patients modules, or
  time-management / attention-manager game types in this repo.
---

# Shift simulation (RN panels-first)

> Primary product format. Not a platformer, CYOA, or inventory RPG.

---

## Game types covered

| Type | Epic | Notes |
|------|------|-------|
| Real-time shift / time-management | E1, E3 | Accelerated military clock, windows, overtime |
| Multi-entity attention manager | E2, E3 | 4–6 patients, **3 slots** |
| Scenario / content-pack sim | E4 | HTML/JSON packs; drip events |
| DOM perform challenges | E5 | Pause clock; pass → slot, fail → block |
| Scoring + teaching debrief | E6 | Prioritization feedback |
| Chaos / incident packs | E7 Later | Beyond thin urgents |

---

## Architecture rules

```
URL/config → GameApplication
              ├─ gameState (subscribe/dispatch)
              ├─ timer_ingame (game time authority)
              ├─ patients (HTML packs → census DOM)
              ├─ task-system (windows, activate, complete)
              ├─ modal (confirm / challenge / game-over)
              └─ scenario loader (E4 — packs mutate state)
```

1. **Panels are the product UI** — vitals, meds, tasks, slots in HTML/CSS.
2. **Game time ≠ wall clock** — speed factor scales ticks; display military time.
3. **Slots limit concurrency** — perform occupies a slot for `duration`; full = blocked.
4. **Content as data** — patient/`data-*` today; JSON/YAML packs for drip (E4).
5. **Challenges are guests** — modal + pause; emit pass/fail; never own the timer.

Read code maps before editing: `AGENTS_CODE_REFERENCE.md` + timer/tasks/patients/ui companions.

---

## Pause ownership matrix

| Cause | Shift timer | Notes |
|-------|-------------|-------|
| User pause control | Paused | Explicit |
| Confirm / docs modal | Per E1.M1 matrix | Document before inventing |
| Perform challenge | **Paused** | Resume on dismiss/complete |
| Canvas guest running | Still paused via shell | Guest has its own local loop only |

---

## Task lifecycle (target)

```
not-yet → active → completed
                 ↘ overdue / missed
```

Availability windows gate Perform (E3.M3). Urgents inject mid-shift (E3.M5 thin).

---

## Perform challenge contract (E5)

```
Perform click
  → if challenge required: pause shell → open modal → run plugin
  → pass  → assign slot (duration progress)
  → fail  → no assign; allow retry per rules
  → always: destroy guest UI; resume per pause matrix
```

Plugin registry: challenge type → module. Prefer **DOM quiz** for med identity. Canvas only if spatial.

---

## Scenario packs (E4)

| Concern | Guidance |
|---------|----------|
| Format | JSON first (or existing HTML packs); YAML Later OK |
| Fiction | Disclaimer + fictional-only flag in pack metadata |
| Drip | Events fire against **game time**, mutate tasks/patients |
| Authoring | Educators edit data, not shell code |
| New day/night unit census | Use [`../add-shift-patient-pack/`](../add-shift-patient-pack/) (interview → condition-aware tasks → pack) |

---

## Debrief (E6)

- Thin closure: completed / late / missed (E6.M0)
- Scoring hooks from outcomes; teaching copy ≠ clinical competency claim
- No auth/leaderboards in MVP

---

## Implementation checklist

When adding a shift-sim feature:

- [ ] Which game type + epic?
- [ ] Shell or guest?
- [ ] Touches game time / pause?
- [ ] Updates panels via store subscribe (not full redraw storms)?
- [ ] Content in pack/attrs vs hard-coded?
- [ ] Still vanilla / no unapproved React-Ink-Twine?

## Anti-patterns

| Don't | Do |
|-------|-----|
| Put census inside a canvas engine | HTML panels + optional guest modal |
| Unlock tasks on wall-clock `Date` | Unlock on game time |
| Let Ink drive slot assignment | Host narrative; shell assigns slots |
| Skip pause on challenges | Pause shell for focused perform |

## Limitations

- MVP excludes class-interaction math (E3.M4), full chaos packs, auth (E8).
- Does not choose engines — see `engine-selection`.
