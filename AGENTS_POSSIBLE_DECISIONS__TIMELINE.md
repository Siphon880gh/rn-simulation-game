# Choosing a JavaScript Timeline Library

Use this file when implementing **time-ordered clinical or shift surfaces** — especially **patient chart history (past hx)**, optional **event/response history**, or **debrief recap** views.

Stories: [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md) → **S2.1b / E2.M1** (primary), **S1.7 / E1.M2** (shift log), **S6.0+ / E6** (debrief).  
Index: [`AGENTS_POSSIBLE_DECISIONS_INDEX.md`](AGENTS_POSSIBLE_DECISIONS_INDEX.md).

**Contract:** Timelines are **read-mostly panels** inside the clinical shell — not the primary game loop. Prefer JSON or HTML-pack-authored events; do not require Google Sheets at runtime.

Follow `decisions.timeline_library` in [`.agents/state.json`](.agents/state.json). Do not swap libraries without user approval.

---

## Default decision (read this first)

**Choose TimelineJS (Knight Lab) unless a specific, documented reason forces an alternative.**

| Priority | Library | Stamp value | Use when |
|----------|---------|-------------|----------|
| **1 — Default** | **TimelineJS** | `timelinejs` | E2.M1 past hx, narrative teaching records, optional media |
| 2 — Override | vis-timeline | `vis-timeline` | Pack needs dense axis, ranges, groups, minute-level overlap |
| 3 — Thin fallback | Custom HTML | `custom-html` | ≤ ~10 static entries, zero CDN, deliberate minimal scope |
| — | Shift event log (E1.M2) | (no stamp) | Append-only list first; not a timeline library decision |

**Agent rule:** Read this table → implement TimelineJS → only override after writing **Technology decision** rationale. Companion: [`AGENTS_POSSIBLE_DECISIONS__TIMELINE_TimelineJS.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE_TimelineJS.md).

---

## Use cases in this project

| Surface | Epic / story | Timeline need | Default |
|---------|--------------|---------------|---------|
| **Patient chart history (past hx)** | E2.M1 / S2.1b | Prior admissions, labs, notes — chronological narrative | **TimelineJS** |
| **Bottom response / event log** | E1.M2 / S1.7 | Append-only shift actions | Custom list (see companion) |
| **End-of-shift debrief** | E6.M0+ | Recap of completed / missed / late work | Custom list or TimelineJS if matching past hx |

Primary driver for a timeline library: **E2.M1 past hx**.

---

## Tier 1 — Recommended default

### TimelineJS (Knight Lab) ⭐

Best fit when past hx is **story-like** — dated events with headlines, body copy, optional media — inside a patient panel tab.

**Pros**

- Mature, widely documented ([timeline.knightlab.com](https://timeline.knightlab.com))
- JSON data format (no Google Sheets required for in-game packs)
- Official CDN matches this repo’s script-tag pattern (like jQuery contextMenu)
- Works in a dedicated panel `#div` without owning the whole page
- **Stamped default:** `decisions.timeline_library` → `timelinejs`

**Cons**

- Geared toward narrative/media timelines, not dense sub-minute clinical grids
- Default styling is editorial; needs panel chrome / Tailwind wrapper tuning
- ~7MB npm package if ever bundled — prefer CDN for MVP

**When to pick:** Always start here for **E2.M1**. Detail: [`AGENTS_POSSIBLE_DECISIONS__TIMELINE_TimelineJS.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE_TimelineJS.md)

---

## Tier 2 — Allowed overrides (document why)

### vis-timeline (vis.js)

**Pros:** Dense event strips, ranges, groups, zoom; overlapping intervals on one axis.

**Cons:** Heavier integration; less “chart narrative”; more custom styling for clinical panels.

**When to pick:** Pack authors need minute-level density or range bars — **not** the default for teaching past hx.

Detail: [`AGENTS_POSSIBLE_DECISIONS__TIMELINE_vis-timeline.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE_vis-timeline.md)

---

### Custom HTML list (no library)

**Pros:** Smallest footprint; full Tailwind control; matches panels-first MVP.

**Cons:** No built-in zoom/nav; reinvent grouping and media UX.

**When to pick:** Deliberately thin E2.M1 (very few entries) or E1.M2 append-only log — **not** when past hx should feel like a chart story.

Detail: [`AGENTS_POSSIBLE_DECISIONS__TIMELINE_custom-html.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE_custom-html.md)

---

## Tier 3 — Other narrative timelines (not recommended)

| Library | Notes | Verdict |
|---------|-------|---------|
| **Chronoline.js** | Older horizontal timeline; weak maintenance | Skip — use TimelineJS |
| **Timeglider** | Commercial/education timelines | Skip — licensing + embed model |
| **Vertical CSS-only patterns** | Stacked life-event layouts | Use custom-html tier instead |
| **StorymapJS** (Knight Lab) | Geo stories, not clinical hx | Wrong tool |

---

## Tier 4 — Wrong category for past hx

These are valid JS libraries but **not** for E2.M1 chart history:

| Library | Category | Why skip |
|---------|----------|----------|
| **Frappe Gantt**, **dhtmlxGantt**, **Bryntum** | Gantt / scheduling | Task dependencies, not admission narrative |
| **FullCalendar** (timeline views) | Calendar / resources | Shift scheduling, not fictional hx |
| **Chart.js** / **D3** time scales | Charts | Build-from-scratch; no narrative UX |
| **react-chrono**, **MUI Timeline**, **Ant Design Timeline** | React components | Violates `decisions.main_constraints` unless React approved |

---

## Do not use

### TimelineJS iframe / Google Sheets embed

Knight Lab’s spreadsheet-driven embed is fine for **marketing/docs**, not for **runtime patient packs** (external Sheet dependency, iframe sizing in panels).

**Do not use** for in-game census panels unless the user explicitly wants iframe embeds. Prefer **TimelineJS JSON instantiate** (Tier 1 detail doc).

---

## Comparison matrix

| Library | E2.M1 past hx | CDN / no bundler | Narrative + media | Dense axis | Repo default |
|---------|---------------|------------------|-------------------|------------|--------------|
| **TimelineJS** | ✅ best | ✅ | ✅ | ⚠️ | **Yes** |
| vis-timeline | ⚠️ | ✅ | ⚠️ | ✅ | Override only |
| Custom HTML | ⚠️ thin only | ✅ | ⚠️ | ❌ | Fallback only |
| Gantt / FullCalendar | ❌ | varies | ❌ | ✅ | No |
| React timelines | ❌ | — | varies | varies | No (stack) |

---

## Data shape (pack → UI)

Regardless of library, prefer a **normalized event list** in patient/scenario pack data:

```json
{
  "pastHx": [
    {
      "id": "hx-001",
      "start": "2024-03-12",
      "headline": "ED admission — sepsis workup",
      "text": "Brief fictional summary for teaching.",
      "media": null
    }
  ]
}
```

Adapter layer maps `pastHx[]` → TimelineJS `events[]`, vis items, or DOM list. Keep fiction disclaimer visible near chart history (E0.M4).

---

## Panel integration rules

1. Mount timeline inside an existing **patient panel tab** — do not replace shell clock or slot bar.
2. Lazy-init when the tab is first opened (avoid constructing timelines for all census patients at once).
3. Destroy or hide instance when switching patient tabs if the library leaks listeners.
4. Game **shift clock** (military time) is separate from **chart dates** (fictional calendar dates in pack JSON).
5. Hour tabs (E1.M2 / E4.M2) filter **current-shift work**, not past hx — do not conflate the two.

---

## Summary

| Requirement | Recommended solution |
|-------------|---------------------|
| **Default for all timeline decisions** | **TimelineJS** (`timelinejs`) |
| E2.M1 past hx implementation | [`AGENTS_POSSIBLE_DECISIONS__TIMELINE_TimelineJS.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE_TimelineJS.md) |
| Dense intervals / ranges override | [`AGENTS_POSSIBLE_DECISIONS__TIMELINE_vis-timeline.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE_vis-timeline.md) |
| Thin list / event log | [`AGENTS_POSSIBLE_DECISIONS__TIMELINE_custom-html.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE_custom-html.md) |
| Repo stack (CDN, no bundler) | TimelineJS via Knight Lab CDN |
| Stamped choice | `decisions.timeline_library` → **`timelinejs`** |
