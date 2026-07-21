# vis-timeline (vis.js)

Companion detail for [`AGENTS_POSSIBLE_DECISIONS__TIMELINE.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE.md). Use only when **TimelineJS is a poor fit** (dense intervals, many overlapping events on one axis). Default stamp remains **`timelinejs`**.

**Docs:** [vis-timeline examples](https://visjs.github.io/vis-timeline/examples/timeline/) · [GitHub](https://github.com/visjs/vis-timeline)

---

## When to pick vis-timeline over TimelineJS

| Signal | vis-timeline | TimelineJS |
|--------|--------------|------------|
| Many events on one horizontal axis | ✅ | ⚠️ cramped |
| Sub-day / minute-level ranges | ✅ | ⚠️ narrative-oriented |
| Groups (e.g. by category) | ✅ | ❌ |
| Headline + story + optional media per event | ⚠️ custom templates | ✅ native |
| CDN, no bundler, teaching narrative | ⚠️ heavier setup | ✅ default |

**Agent rule:** Prefer TimelineJS unless pack design **requires** dense axis navigation; then stamp `decisions.timeline_library = "vis-timeline"` and explain why in the report.

---

## Installation (CDN)

```html
<link
  href="https://unpkg.com/vis-timeline@7.7.3/styles/vis-timeline-graph2d.min.css"
  rel="stylesheet"
>
<script src="https://unpkg.com/vis-timeline@7.7.3/standalone/umd/vis-timeline-graph2d.min.js"></script>
```

Pin version in production; unpkg `latest` is not recommended.

---

## Basic panel embed

```html
<div id="patient-past-hx-vis" class="min-h-[280px] w-full"></div>
```

```javascript
function pastHxToVisItems(patientPack) {
  return (patientPack.pastHx || []).map((entry) => ({
    id: entry.id,
    content: entry.headline,
    start: entry.start,
    end: entry.end || entry.start,
    title: entry.text || ""
  }));
}

function renderPastHxVisTimeline(containerId, patientPack) {
  const container = document.getElementById(containerId);
  if (!container || !window.vis) return null;

  const items = new window.vis.DataSet(pastHxToVisItems(patientPack));
  const options = {
    stack: true,
    zoomMin: 1000 * 60 * 60 * 24,
    orientation: { axis: "top" }
  };

  return new window.vis.Timeline(container, items, options);
}
```

Lazy-init on tab open; destroy on patient switch (`timeline.destroy()`).

---

## Adapter from pack `pastHx[]`

Same normalized pack shape as TimelineJS (see main timeline doc). Add optional `end` for range bars:

```json
{
  "id": "hx-002",
  "start": "2024-03-10",
  "end": "2024-03-14",
  "headline": "ICU stay",
  "text": "Teaching summary."
}
```

---

## Clinical panel notes

- Style `.vis-timeline` inside panel chrome; default look is generic, not chart-native.
- Fiction disclaimer (E0.M4) stays in shell/tab header — vis does not provide it.
- Do not use for **shift clock**, slot queue, or hour tabs — those are separate surfaces.

---

## Key points

* Second-choice library; **TimelineJS remains default** for E2.M1.
* Better for **density and ranges**, worse for **story/media** out of the box.
* Requires version-pinned CDN or bundler; more CSS integration work than TimelineJS.
