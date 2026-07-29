# Possible Decision — Bed Setup for Admission (Perform Mini-Game)

Agent design reference for the **get a bed ready for an admission** perform challenge.  
Stories: [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md) → **S5.4 / E5.M3**.  
Scoring hooks: **S6.6 / E6.M1**. Scene art defaults: **S7.2+ / E7.M1**.

**Contract:** Player must **win** this mini-game to **complete** the bed-prep / admission task. Fail or overtime does not complete the task (highlight wrong/missing items, dock points, teaching copy with correct answers).

Use this file for challenge rules and content shape. Do not invent alternate win conditions without updating stories.

---

## Framing

You’re getting a bed ready for an admission. There is **no linen order** — gather the right items.

---

## Gather items (not a sequence)

Content-authored **required** items (example set):

| Example label |
|---------------|
| Chux |
| Socks |
| Thick blanket |
| Bed sheet |
| Pillowcase |
| Clean gown |
| Lifting sheet |

Exact item names and distractors are pack/content data in `challenges/skills/bed-prep/config.js` (re-exported as `GameConfig.bedPrepChallenge`).

**Win condition:** selected set equals the required set (order ignored). Extra distractors selected → fail. Missing required items → fail.

---

## Hint / flash loop

1. After Perform opens the challenge, flash a **randomized loop** of linen labels (required + random distractors).
2. Loop continues until the player clicks **Ready**.
3. **Difficulty = hint chances:** how many times the player may watch the flashing loop before committing — typically **3 down to 1** (harder = fewer views).
4. Build UI copy: **Gather these items** (toggle select / deselect). Distractor count is randomized per round (`distractorCountMin`–`distractorCountMax`).

---

## Perform / resolve

| Outcome | Behavior |
|---------|----------|
| **Submit gather** | Highlight extras / missing; **dock points** (E6). |
| **Win** | Task may **complete** (required gate for this task type). |
| **Lose / time reached (overtime)** | Task does **not** complete; copy explains overtime/fail **because** of the mistakes and shows **needed items**. |

Timer pause during the challenge follows the shared E5.M1 perform-challenge contract.

---

## Related: IVPB hang sequence

IVPB meds (`data-challenge="ivpb"` or name contains IVPB) use the **ordered sequence** flash/build pattern in `challenges/skills/ivpb-hang/` (config + challenge; spike → secondary → above Y-site → backprime → drip check → troubleshoot). That is a separate skill from bed prep.

---

## Scene / background (presentation)

- Some situations/scenarios may have a dedicated picture or background (optional image→3D / light motion).
- Default: **static** ICU or other floor background.
- Art is **pre-generated ahead of time** (e.g. Midjourney), not runtime generative — see E7.M1 / S7.2+.

---

## Epic hooks

| Piece | Epic / milestone |
|-------|------------------|
| Challenge gate + pause | E5.M1 |
| This mini-game vertical slice | **E5.M3** (Later) |
| Dock points + teaching cite of correct answers | E6.M1 / S6.6 |
| Floor / situation art | E7.M1 |

---

## Open content choices (pack author)

- Full required-item list
- Distractor pool + per-round distractor count range
- Difficulty → exact hint-view counts
- Whether fail allows immediate retry in-modal vs dismiss and re-Perform
