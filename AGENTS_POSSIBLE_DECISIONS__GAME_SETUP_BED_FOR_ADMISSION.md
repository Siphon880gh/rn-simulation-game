# Possible Decision — Bed Setup for Admission (Perform Mini-Game)

Agent design reference for the **get a bed ready for an admission** perform challenge.  
Stories: [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md) → **S5.4 / E5.M3**.  
Scoring hooks: **S6.6 / E6.M1**. Scene art defaults: **S7.2+ / E7.M1**.

**Contract:** Player must **win** this mini-game to **complete** the bed-prep / admission task. Fail or overtime does not complete the task (highlight wrong items, dock points, teaching copy with correct answers).

Use this file for challenge rules and content shape. Do not invent alternate win conditions without updating stories.

---

## Framing

You’re getting a bed ready for an admission.

---

## Target sequence (mnemonic)

Content-authored correct order (example letters):

| Step | Letter | Example label (pack content may refine spelling/names) |
|------|--------|--------------------------------------------------------|
| 1 | **C** | Chux (aka “Chuts” in draft notes) |
| 2 | **S** | Socks |
| 3 | **B** | Thick blanket (draft also listed “Think Blanket” as distractor) |
| 4 | **B** | *(second B — pack-defined linen item)* |
| 5 | **B** | *(third B — pack-defined linen item)* |
| 6 | **C** | *(second C — pack-defined item)* |
| 7 | **L** | Lifting sheet |

Mnemonic string: **C S B B B C L**

Exact item names and distractors are pack/content data; letters above are the stable teaching mnemonic.

---

## Hint / flash loop

1. After Perform opens the challenge, flash a **randomized loop** of linen labels (targets + distractors), e.g.  
   `Chuts, Socks, Think Blanket, Thick Blanket, Bed sheet, Chuts, Lifting sheet`
2. Loop continues until the player clicks **Ready**.
3. **Difficulty = hint chances:** how many times the player may watch the flashing loop before committing — typically **3 down to 1** (harder = fewer views).

---

## Perform / resolve

| Outcome | Behavior |
|---------|----------|
| **Submit (Perform resolve)** | Highlight what is wrong; **dock points** (E6). |
| **Win** | Task may **complete** (required gate for this task type). |
| **Lose / time reached (overtime)** | Task does **not** complete; copy explains overtime/fail **because** of the mistakes and shows **correct answers**. |

Timer pause during the challenge follows the shared E5.M1 perform-challenge contract.

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

- Full label list for each letter in **CSBBBCL**
- Distractor pool for the flash loop
- Difficulty → exact hint-view counts
- Whether fail allows immediate retry in-modal vs dismiss and re-Perform
