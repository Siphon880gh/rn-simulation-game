# Custom HTML timeline (no library)

Companion detail for [`AGENTS_POSSIBLE_DECISIONS__TIMELINE.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE.md). Use for **thin MVP** or **fallback** when TimelineJS is more than E2.M1 needs. Default stamp remains **`timelinejs`** — use custom HTML only when event count is tiny or bundle/CDN weight must be zero.

---

## When to pick custom HTML over TimelineJS

| Signal | Custom HTML | TimelineJS |
|--------|-------------|------------|
| ≤ ~10 past-hx entries per patient | ✅ enough | ✅ also fine |
| No media, no zoom, no scrubber | ✅ | overkill |
| Zero external timeline CSS/JS | ✅ | CDN scripts |
| Rich narrative + optional media | ⚠️ build yourself | ✅ default |
| Teaching polish / “chart story” feel | ⚠️ | ✅ default |

**Agent rule:** Default to TimelineJS for E2.M1 unless pack has very few static entries **and** milestone scope explicitly stays minimal; then stamp `decisions.timeline_library = "custom-html"`.

---

## Vertical list pattern (Tailwind)

```html
<section class="past-hx space-y-4 p-3" aria-label="Chart history">
  <!-- repeat per event from pack -->
  <article class="border-l-2 border-slate-300 pl-4">
    <time class="text-xs text-slate-500" datetime="2024-03-12">2024-03-12</time>
    <h4 class="font-semibold text-sm">ED admission — sepsis workup</h4>
    <p class="text-sm text-slate-700">Brief fictional summary for teaching.</p>
  </article>
</section>
```

Render from pack in patient module:

```javascript
function renderPastHxList(container, pastHx = []) {
  container.innerHTML = pastHx
    .slice()
    .sort((a, b) => String(a.start).localeCompare(String(b.start)))
    .map(
      (entry) => `
        <article class="border-l-2 border-slate-300 pl-4">
          <time class="text-xs text-slate-500" datetime="${entry.start}">${entry.start}</time>
          <h4 class="font-semibold text-sm">${entry.headline}</h4>
          <p class="text-sm text-slate-700">${entry.text || ""}</p>
        </article>
      `
    )
    .join("");
}
```

Use existing Tailwind tokens from shell; escape user/pack strings if content ever becomes dynamic HTML.

---

## Event log (E1.M2) — append-only list

Bottom shift log often **should stay a list**, not a timeline library:

```javascript
function appendEventLog(logEl, { time, text }) {
  const row = document.createElement("div");
  row.className = "text-xs border-b border-slate-200 py-1";
  row.textContent = `${time} — ${text}`;
  logEl.appendChild(row);
  logEl.scrollTop = logEl.scrollHeight;
}
```

Upgrade to TimelineJS later only if debrief needs the same visual language as past hx.

---

## Key points

* Smallest footprint; full panel control.
* Same `pastHx[]` pack shape as other adapters.
* **Not** the default for E2.M1 — TimelineJS unless scope is deliberately thin.
