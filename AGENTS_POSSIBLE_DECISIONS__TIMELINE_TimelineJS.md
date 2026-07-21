# TimelineJS (Knight Lab)

Companion detail for [`AGENTS_POSSIBLE_DECISIONS__TIMELINE.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE.md) when `decisions.timeline_library` is **`timelinejs`** (default — prefer this unless an override is documented).

**Other options:** vis-timeline, custom HTML — see main timeline doc; do not switch without rationale.

**Docs:** [timeline.knightlab.com](https://timeline.knightlab.com) · [Instantiate in page](https://timeline.knightlab.com/docs/instantiate-a-timeline.html) · [JSON format](https://timeline.knightlab.com/docs/json-format.html) · [Options](https://timeline.knightlab.com/docs/options.html) · [API (partial)](https://github.com/NUKnightLab/TimelineJS3/blob/master/API.md)

---

## Installation (CDN — matches this repo)

Add to `game/index.html` (after jQuery if other panel scripts depend on load order):

```html
<link
  title="timeline-styles"
  rel="stylesheet"
  href="https://cdn.knightlab.com/libs/timeline3/latest/css/timeline.css"
>

<script src="https://cdn.knightlab.com/libs/timeline3/latest/js/timeline-min.js"></script>
```

Pin a version in production if desired, e.g. `timeline3/3.9.11/...` ([Knight Lab CDN](https://cdn.knightlab.com/)).

**License:** MPL-2.0

---

## Basic embed (patient past-hx panel)

HTML container inside a patient panel tab:

```html
<div id="patient-past-hx-timeline" class="min-h-[320px] w-full"></div>
```

Instantiate when the tab is shown (global `TL` from CDN script):

```javascript
function renderPastHxTimeline(containerId, timelineJson) {
  const container = document.getElementById(containerId);
  if (!container || !window.TL) return null;

  container.innerHTML = "";

  return new window.TL.Timeline(containerId, timelineJson);
}
```

`timelineJson` may be a URL string or an inline object (see below).

---

## Minimal JSON for pack data

Map pack `pastHx[]` to TimelineJS `events`:

```javascript
function pastHxToTimelineJs(patientPack) {
  const events = (patientPack.pastHx || []).map((entry, index) => ({
    start_date: parseIsoDateParts(entry.start),
    text: {
      headline: entry.headline,
      text: entry.text || ""
    },
    media: entry.media ? { url: entry.media, caption: entry.caption || "" } : undefined
  }));

  return {
    title: {
      text: {
        headline: `${patientPack.displayName || "Patient"} — chart history`,
        text: "Fictional teaching record."
      }
    },
    events
  };
}

function parseIsoDateParts(isoDate) {
  const [y, m, d] = String(isoDate).split("-").map(Number);
  return { year: y, month: m, day: d };
}
```

Authoring reference: [JSON configuration format](https://timeline.knightlab.com/docs/json-format.html).

---

## Useful options (panel context)

```javascript
new window.TL.Timeline("patient-past-hx-timeline", data, {
  language: "en",
  initial_zoom: 2,
  timenav_height: 120,
  scale_factor: 1,
  hash_bookmark: false
});
```

| Option | Panel note |
|--------|------------|
| `initial_zoom` | Lower = more events visible; tune per pack length |
| `timenav_height` | Keep short inside patient panel, not full-page story |
| `hash_bookmark` | Prefer `false` inside tabbed UI |
| `language` | Match shell locale when i18n exists |

---

## Lazy init on tab open

```javascript
let pastHxTimelineInstance = null;

function onPastHxTabActivated(patientPack) {
  if (pastHxTimelineInstance) {
    pastHxTimelineInstance.destroy?.();
    pastHxTimelineInstance = null;
  }

  const data = pastHxToTimelineJs(patientPack);
  pastHxTimelineInstance = renderPastHxTimeline(
    "patient-past-hx-timeline",
    data
  );
}
```

Call from patient tab switch handler (`patients.js` / panel module). Re-create when active patient changes.

---

## ES module import (only if bundler added later)

This repo’s MVP does **not** require a bundler. If one is approved:

```javascript
import { Timeline } from "@knight-lab/timelinejs";
import "@knight-lab/timelinejs/dist/css/timeline.css";

const timeline = new Timeline("patient-past-hx-timeline", data);
```

Prefer CDN until build tooling is an explicit decision.

---

## Styling in clinical panels

- Wrap `#patient-past-hx-timeline` in existing panel chrome (Tailwind padding, max-height + `overflow-auto`).
- TimelineJS ships its own CSS — avoid fighting it with global Tailwind resets on `.tl-*` classes.
- Keep fiction disclaimer (E0.M4) visible in shell or tab header; chart copy remains pack-authored fiction.

---

## What not to use TimelineJS for

| Surface | Prefer instead |
|---------|----------------|
| 3-slot queue / waiting bar | Task queue DOM (E3) |
| Military shift clock | `timer_ingame` (E1) |
| Hour tabs for **current shift** work | Shell hour strip + E4 drip |
| Append-only **player action log** (S1.7) | Simple list first; upgrade only if narrative needed |

---

## Key points

* CDN exposes `window.TL.Timeline` — not the npm `Timeline` import unless bundled.
* Feed **JSON objects** from patient packs; avoid Google Sheets at runtime.
* Lazy-init per active patient tab; destroy on patient switch when possible.
* Chart dates are **pack fiction**, independent of accelerated shift clock.
* Primary milestone: **E2.M1** past hx tab.
