# Feature: Hover Preview Popover for Internal Markdown Links

Companion to [`AGENTS_POSSIBLE_DECISIONS__MARKDOWN.md`](AGENTS_POSSIBLE_DECISIONS__MARKDOWN.md).  
Implement with the shared markdown stack (**markdown-it**). Reference: [`context-devbrain/assets/js/link-popover.js`](context-devbrain/assets/js/link-popover.js) + [`link-popover.css`](context-devbrain/assets/css/link-popover.css) + [`AGENTS-link-preview.md`](context-devbrain/AGENTS-link-preview.md).

Milestone: **E0.M5** (same epic as the renderer; ship after base render works, or in the same milestone if capacity allows).

---

## Overview

When a user hovers over an **internal** link that opens another Markdown (`.md`) note in Help / learning content, show a floating preview popover near the link.

Internal links include:

- Wiki-style links: `[[Note Title]]` (rendered by the shared preprocessor)
- Equivalent internal note links already supported by the app (e.g. relative `*.md` hrefs resolved through the Help/learning catalog)

---

## Popover behavior

| Rule | Detail |
|------|--------|
| Show delay | ~**300ms** after pointer enters the link |
| Position | Near the hovered link; flip/clamp to stay in viewport (see DevBrain `positionPopover`) |
| Stay open | While pointer is over the **link** or the **popover** |
| Dismissal grace | ~**200ms** after leave so the pointer can travel link → popover |
| Close | After grace, when pointer has left both |
| Cache | Cache fetched note preview payloads (`Map` keyed by normalized title/path) so repeat hovers do not re-fetch |

Port the timeout / popover mouseenter-mouseleave pattern from DevBrain `LinkPopoverPreview` (`handleNoteMouseEnter`, `handleMouseLeave`, `createPopoverElement`).

---

## Popover tabs

### Preview (default)

Display:

1. The first **prose paragraph** from the target note.
2. An ellipsis (`…`) when the note has additional content after that paragraph.

When locating the first prose paragraph, **skip**:

- Frontmatter (`---` … `---`)
- Headings (`#`–`######`)
- Code fences
- Images
- List items

Strip lightweight Markdown (`*`, `_`, `` ` ``, `~`, link/image markup) before display.

If the note is missing or inaccessible, show a clear unavailable message (this game has no private-note auth in MVP; map DevBrain’s private blocked string to a generic “Preview unavailable” if needed).

**Port:** `parseNoteMarkdown`, `extractFirstParagraph` in `link-popover.js`.

### Contents

Table of contents from the target note’s Markdown headings:

- Levels `#` through `######`
- Indent by heading level
- Each item links to that heading in the target note (same navigation as a normal internal open, including hash/slug)
- Empty state when the note has no headings

**Slug rule:** Use the **same `slugify`** as markdown-it-anchor in [`AGENTS_POSSIBLE_DECISIONS__MARKDOWN_markdown-it.md`](AGENTS_POSSIBLE_DECISIONS__MARKDOWN_markdown-it.md) / DevBrain `slugifyHeading`.

**Port:** TOC build in `parseNoteMarkdown` + `showNoteContent` tab UI.

---

## States and actions

| State / action | Behavior |
|----------------|----------|
| Loading | Spinner / “Fetching…” in popover body |
| Error | User-visible error string; link click behavior unchanged |
| Footer | Action to **open the full note** (same path as clicking the internal link) |

---

## Compatibility and design

- Do **not** break external links (normal `http(s)` targets stay as today).
- Do **not** change click behavior of internal links — hover preview only.
- Match existing overlay / modal / tooltip chrome (Tailwind + game shell). Prefer adapting DevBrain `link-popover.css` class names into `game/assets/css/` rather than inventing a second popover system.
- Optional Later: DevBrain’s external excerpt markers (`1x2.png` + `start..end` / `##` custom text). **Out of scope** for E0.M5 unless already needed — do not block internal-note previews on that feature.

---

## Out of scope unless already supported

- Do **not** create a new note-fetching API.
- Use the app’s existing Help/learning load path (today: `fetch('../docs/{category}/{file}')` from `docs.js`; shared resolver once catalog grows).
- Do **not** change what happens on **click** of an internal link.
- Only add hover-preview functionality.

---

## Integration points (RN game)

```js
// After enhanceMarkdownDom inserts HTML into the help/learning root:
if (window.mdLinkPreview?.rescan) {
  window.mdLinkPreview.rescan(rootEl);
}
```

Detect internal links via:

- `a.md-internal-link` / `data-md-note`
- or href resolving to a catalogued `.md` title/path

**Do not** require DevBrain `?open=` or `local-open.php`. Resolve title → fetch URL through the game’s docs/learning registry.

---

## Snippets to port (trimmed)

### Enhance note links

```js
enhanceNoteLink(linkData) {
  const { link, title, url } = linkData;
  link.dataset.previewEnhanced = '1';
  link.classList.add('link-with-preview', 'note-link-preview');
  link.addEventListener('mouseenter', (e) => this.handleNoteMouseEnter(e, title, url));
  link.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
}

handleNoteMouseEnter(event, title, url) {
  if (this.hideTimeout) {
    clearTimeout(this.hideTimeout);
    this.hideTimeout = null;
  }
  this.hoverTimeout = setTimeout(() => {
    this.showNotePopover(event.target, title, url);
  }, 300);
}
```

### Preview + Contents body (structure)

```html
<div class="popover-tabs" role="tablist">
  <button type="button" class="popover-tab active" data-tab="preview">Preview</button>
  <button type="button" class="popover-tab" data-tab="toc">Contents</button>
</div>
<div class="popover-tab-panel active" data-panel="preview">…excerpt…</div>
<div class="popover-tab-panel" data-panel="toc" hidden>…toc or empty…</div>
<div class="popover-footer"><a class="popover-link" href="…">Open note</a></div>
```

### Cache

```js
async getNotePreview(title, url) {
  const cacheKey = `note|${title.toLowerCase()}`;
  if (this.noteCache.has(cacheKey)) return this.noteCache.get(cacheKey);
  const markdown = await loadMarkdownByTitleOrPath(title); // existing help fetch
  const content = this.parseNoteMarkdown(markdown, title, url);
  this.noteCache.set(cacheKey, content);
  return content;
}
```

---

## File map

| File | Action | Purpose |
|------|--------|---------|
| `game/assets/js/md-link-preview.js` | CREATE | Port/adapt `LinkPopoverPreview` note-link path |
| `game/assets/css/md-link-preview.css` | CREATE | Popover + tabs styling |
| `game/assets/js/markdown-renderer.js` | MODIFY | Call `rescan` after render |
| `game/index.html` | MODIFY | Script/CSS tags |

---

## Acceptance checks

- [ ] Hover ~300ms on `[[Note]]` / internal MD link → popover with Preview + Contents
- [ ] Preview shows first prose paragraph + `…` when more exists
- [ ] Contents lists heading links with correct hashes; empty state when none
- [ ] Pointer can move onto popover without flicker-close (grace ~200ms)
- [ ] Cached after first fetch; loading + error states work
- [ ] Footer opens full note; click-on-link behavior unchanged
- [ ] External links unaffected
