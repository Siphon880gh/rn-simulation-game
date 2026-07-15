# Council Deliberation: Epics & Milestones Fit for RN Simulation Game

**Date:** 2026-07-15  
**Request:** Determine whether epics and milestones are appropriate for intended users and goals; finalize with a report.  
**Agents:** 12 (Research, Implementation, Risk, User/UX, Minimal-change, Scalable, Cost, Alternatives, Standards, Quick-win, Clinical-education, Skeptic)  
**Convergence:** Peer grading + 3 options synthesized  

---

## Process

1. Phase 1 — 12 agents independently assessed Knowledge / Strategy / Plan against ICPs (nursing students, educators, portfolio viewers) and repo artifacts (`EPIC_MAP.md`, `IMPLEMENTATION_STORIES.md`, `AGENTS.md`, code reality).
2. Phase 2 — Convener graded all agents and synthesized three distinct finalize options.
3. Phase 3 — Recommended **Option A** applied to planning docs (see Finalized set below). Options B and C remain available if priorities change.

---

## Verdict (shared across council)

| Question | Answer |
|----------|--------|
| Are epics E0–E8 appropriate? | **Yes** — capability spine matches ICPs |
| Is the milestone backlog appropriate as written? | **Partially** — MVP is over-dense and feedback/content arrive late |
| Main fixes | Park **E3.M4**; stamp **E0.M3** as keep-modular; add **E0.M4** disclaimer; pull **thin debrief** after slots; thin **E4**; keep **E5** thin |

---

## Grades (Phase 2)

| Agent | Knowledge | Strategy | Plan | Note |
|-------|-----------|----------|------|------|
| 1 Research | 4 | 4 | 3 | Strong ICP framing; packaging stretch |
| 2 Implementation | 4 | 5 | 5 | Best shippable sequencing |
| 3 Risk | 4 | 5 | 4 | Disclaimer + rubric gates |
| 4 User/UX | 3 | 4 | 4 | Early thin debrief |
| 5 Minimal-change | 4 | 4 | 4 | Fast cut; thin census |
| 6 Scalable | 4 | 4 | 4 | E4.M1 as architecture |
| 7 Cost | 4 | 4 | 5 | ~11–16d lean realism |
| 8 Alternatives | 4 | 5 | 4 | Teachable Shift First |
| 9 Standards | 5 | 4 | 4 | E0.M4 compliance |
| 10 Quick-win | 3 | 4 | 5 | Checkpoint 1 clarity |
| 11 Clinical-ed | 5 | 5 | 4 | 4–6 census non-negotiable |
| 12 Skeptic | 4 | 4 | 4 | Hardest MVP knife |

---

## Option A: Balanced Education MVP *(recommended — applied)*

**Summary:** Multi-patient teaching loop with slots, one thin scenario pack, thin perform gate, early debrief, and mandatory disclaimer.

**Key steps:**
1. E0.M3 — stamp `keep_modular_app` (timeboxed; no migration)
2. E0.M4 *(new)* — fictional disclaimer + learning objectives
3. E1.M1 → E1.M2 — clock + chrome
4. E2.M1 → E2.M3 — **4–6 patient census**
5. E3.M1 → E3.M3 — schema, slots, windows; **park E3.M4**
6. E6.M0 *(new)* — thin prioritization debrief **right after E3.M2**
7. E4.M1 thin pack (+ light E4.M2); **demote E4.M3**
8. E5.M1 (+ E5.M2 if schedule allows)
9. Deepen E6; E3.M5 thin urgents
10. E7 / E8 Later; auth parked

**Trade-offs:** Best ICP fit; longer than a pure demo slice.  
**Best when:** Students and educators must take the product seriously.

---

## Option B: Fastest Demo Vertical Slice

**Summary:** Checkpoint 1 = 2–3 patients + slots + thin debrief ASAP.

**Key steps:** Timebox E0.M3 → E1.M1 → thin E2 → E3.M1–M2 → E6.M0 → stop. Defer E2.M3, E4 pipeline, E5.

**Trade-offs:** Fastest visible outcome; weaker multi-patient teaching claim.  
**Best when:** Need a stakeholder/portfolio proof this sprint.

---

## Option C: Skeptic-Lean / Systems-Minimal

**Summary:** Primary ICP = student only. No E4 pipeline, no E5 in MVP. Seed HTML content + slots + thin debrief.

**Trade-offs:** Lowest risk/cost; weakest for educators and safe-practice challenges.  
**Best when:** E4/E5 keep blocking shipping.

---

## Recommendation

**Option A** — matches consensus (modular stamp, park E3.M4, early thin debrief, disclaimer, E7/E8 Later) and resolves the census fork in favor of clinical fidelity (4–6 patients). Use Option B only as a temporary checkpoint if a demo is needed before E2.M3.

---

## Finalized set (Option A — now in repo)

### Epics (unchanged IDs)

| ID | Priority | Notes |
|----|----------|-------|
| E0 | Mandatory | Includes E0.M3 + **E0.M4** |
| E1–E6 | MVP | E3.M4 and E4.M3 demoted from MVP critical path |
| E7–E8 | Later | Auth (E8.M2) only if re-approved |

### Implementation order

```
E0.M3 → E0.M4 → E1.M1 → E1.M2 → E2.M1 → E2.M2 → E2.M3
  → E3.M1 → E3.M2 → E6.M0
  → E4.M1 → (E4.M2 ∥ E5.M1) → E5.M2 → E3.M3 → E3.M5
  → E6.M1 → E6.M2
  → Later: E3.M4, E4.M3, E7.*, E8.*
```

### Runtime decision (E0.M3 intent)

Record `keep_modular_app`. Thin in-house engine layer only if tick/pause/systems pain appears after slots. No third-party shell for MVP.

### MVP done when

A student finishes a multi-patient accelerated shift under slot pressure with windows/urgents, sees a prioritization debrief; an educator can load one scenario pack; fiction disclaimer + objectives are visible — without auth, chaos packs, or class-interaction math.

---

## Artifacts updated

- [`EPIC_MAP.md`](EPIC_MAP.md)
- [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md)
- [`.agents/state.json`](.agents/state.json)
