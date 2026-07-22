# Skipped milestones / epics

Intentional skips (not “todo later”). Agents must not resume these unless the user explicitly reopens them.

Related: [`.agents/state.json`](.agents/state.json) → `skipped`, [`EPIC_MAP.md`](EPIC_MAP.md), [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md).

---

## Skipped

| ID | Epic | Name | Skipped | Why |
|----|------|------|---------|-----|
| **E8.M2** | E8 — Portfolio Packaging & Optional Social | Optional auth/friends | 2026-07-22 | User chose to skip after Later backlog. Auth/login + light social (friends/peers) is out of the clinical training loop; complexity vs value. Not a multiplayer clinical sync. |

Epic **E8** itself is **not** skipped: **E8.M1** (demo/portfolio packaging) shipped. Only the optional social half is parked permanently until reopened.

---

## What “auth/friends” meant

- Optional login / identity
- Light peer or friends features for share/credibility
- Explicit non-goal: realtime multiplayer clinical sync

See [`EPIC_MAP.md`](EPIC_MAP.md) → E8.

---

## Reopen rule

To resume **E8.M2** (or add another skip):

1. User says explicitly to reopen or implement auth/friends.
2. Clear the matching row from `skipped` in `.agents/state.json` (or set status off `skipped`).
3. Stamp any auth stack decision before coding (would violate current “no auth until Later / re-approve” constraint until then).

---

## Not listed here

Items that were **deferred from MVP then completed in Later** (e.g. E3.M4, E5.M3–M4, E7.*) are **done**, not skipped. Do not treat them as skips.
