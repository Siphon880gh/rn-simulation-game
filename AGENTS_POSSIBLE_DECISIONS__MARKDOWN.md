# Choosing a Markdown Rendering Stack

Use this file when implementing **authored Markdown surfaces** — help / Docs menu, learning modules, About / objectives, and any in-game panel that should open `.md` files without hand-writing HTML.

Stories: [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md) → **E0.M5** (primary). Also **E0.M4** (About / objectives consume the shared renderer), later learning packs / help content.  
Index: [`AGENTS_POSSIBLE_DECISIONS_INDEX.md`](AGENTS_POSSIBLE_DECISIONS_INDEX.md).

**Reference implementation (read-only):** [`context-devbrain/`](context-devbrain/) — another app that already ships markdown-it, Mermaid, wiki links, and link hover popovers. Prefer porting patterns and snippets from there over inventing a new pipeline. Key files:

| DevBrain file | Role |
|---------------|------|
| `assets/js/note-opener.js` | Fetch MD → preprocess → `markdownit()` → enhance DOM |
| `assets/js/link-popover.js` | Hover previews (external markers + **internal note** Preview/TOC tabs) |
| `assets/css/link-popover.css` | Popover chrome |
| `index.php` (CDN tags) | `markdown-it`, `markdown-it-anchor`, Mermaid, highlight.js |
| `AGENTS-features.md`, `AGENTS-link-preview.md`, `AGENTS-tech-stack.md` | AI-oriented contracts |

**Contract:** Authors drop `.md` files under known content roots (e.g. `docs/players/`, `docs/devs/`, future `docs/learning/`). Runtime fetches text, renders through one shared module, shows result in modal / panel / help shell. No PHP build cache required for MVP (unlike DevBrain’s `cache_data.js` pipeline).

Follow `decisions.markdown_renderer` in [`.agents/state.json`](.agents/state.json). Do not swap libraries without user approval.

---

## Default decision (read this first)

**Choose markdown-it + live Mermaid unless a specific, documented reason forces an alternative.**

| Priority | Stack | Stamp value | Use when |
|----------|-------|-------------|----------|
| **1 — Default** | **markdown-it + Mermaid + LaTeX math** | `markdown-it` | Help menu, learning MD, About, wiki links, ` ```mermaid ` fences, dosage/equation math (`$…$` / `$$…$$`) |
| 2 — Thin keep | marked (already in shell) | `marked` | Emergency only: zero plugin surface, no Mermaid/wiki/math — **not** the learning-content target |
| — | Hover preview for internal MD links | (feature of default stack) | See companion; do not treat as a separate library stamp |

**Agent rule:** Read this table → implement markdown-it + Mermaid + LaTeX math → only keep `marked` after writing **Technology decision** rationale. Companions:

- [`AGENTS_POSSIBLE_DECISIONS__MARKDOWN_markdown-it.md`](AGENTS_POSSIBLE_DECISIONS__MARKDOWN_markdown-it.md) — pipeline, CDN, wiki links, Mermaid post-render, LaTeX/KaTeX
- [`AGENTS_POSSIBLE_DECISIONS__MARKDOWN_hover-preview.md`](AGENTS_POSSIBLE_DECISIONS__MARKDOWN_hover-preview.md) — internal-link hover popover (Preview + Contents)

---

## Use cases in this project

| Surface | Epic / story | Need | Default |
|---------|--------------|------|---------|
| **Docs / Help FAB** | E0.M5 (upgrade `docs.js`) | Open authored `.md` from `docs/{category}/` | **markdown-it + Mermaid + LaTeX** |
| **Disclaimer + learning objectives** | E0.M4 | Player-facing MD (`docs/players/ABOUT.md`) via shared renderer | Shared module from E0.M5 |
| **Learning content packs** | Later / content epics | Long-form MD with diagrams, math, cross-links | Same shared module |
| **Internal link hover preview** | E0.M5 (or immediate follow-on story) | Preview + TOC without leaving the page | Companion hover-preview doc |

Primary driver: **author MD files; one renderer; help menu + learning share it.**

---

## Tier 1 — Recommended default

### markdown-it + Mermaid + LaTeX math ⭐

Best fit for Obsidian-like authoring (`[[Note Title]]`, fenced Mermaid, heading anchors, dosage/equation math) inside a vanilla JS shell that already loads jQuery/CDN scripts.

**Pros**

- Plugin model (`markdown-it-anchor`, LaTeX/KaTeX) matches DevBrain (`MarkdownItLatex`)
- Explicit control over wiki-link rewrite and fence post-processing
- Mermaid CDN already proven in `context-devbrain/index.php` (`mermaid@10.6.1`)
- Inline/block math for nursing learning content (mg/kg, drip rates, unit conversions)
- Aligns with locked stack: ES6 modules + CDN tags; no React

**Cons**

- Shell today uses `marked` in `game/assets/js/docs.js` — migration is intentional
- Mermaid must run **after** HTML insert (`mermaid.run` / init on `.language-mermaid` or `.mermaid` nodes)
- Math plugin + KaTeX CSS adds CDN weight (acceptable for Help/learning surfaces)
- `html: true` in markdown-it needs the same trust boundary as today (first-party authored docs only)

**When to pick:** Always start here for **E0.M5**. Detail: [`AGENTS_POSSIBLE_DECISIONS__MARKDOWN_markdown-it.md`](AGENTS_POSSIBLE_DECISIONS__MARKDOWN_markdown-it.md)

---

## Tier 2 — Allowed override (document why)

### marked (status quo)

**Pros:** Already wired in `game/index.html` + `docs.js`; tiny surface.

**Cons:** Weaker plugin story for wiki links / Mermaid fences; fighting the learning-content authoring goal.

**When to pick:** Only if E0.M5 is explicitly deferred and E0.M4 must ship About text with zero dependency change.

---

## Authoring model (devexp)

```
docs/
  players/     # help + About (player-facing)
  devs/        # developer notes (existing)
  learning/    # optional later: long-form modules (same renderer)
```

1. Write or edit a `.md` file in the content root.
2. Register it in the help/docs structure config (today: `docsStructure` in `docs.js`; later: `game-config` if migrated).
3. Open via Help / Docs — fetch → shared `renderMarkdown(md, { basePath, noteTitle })` → modal/panel.
4. Cross-link with `[[Other Note]]` or relative `other-note.md` links; hover preview uses the same load path.

No separate CMS. No required build step for MVP.

---

## Shared module shape (target)

Prefer one ES module (name illustrative) used by Help and any learning panel:

```js
// game/assets/js/markdown-renderer.js (target)
export function createMarkdownRenderer(options) { /* markdownit + plugins */ }
export function renderMarkdown(source, ctx) { /* preprocess → md.render → return HTML string */ }
export function enhanceMarkdownDom(rootEl, ctx) {
  // highlight optional; mermaid.run; wiki-link click handlers; linkPopover.rescan()
}
```

Wire Help (`docs.js` or successor) through this module; do not leave a second parallel `marked.parse` path after E0.M5.

---

## Out of scope for the stamp

- DevBrain PHP cache (`cache_data.js` / `cachedResPartial`) — not required
- AGE encryption / private notes — Later if ever
- External-link CORS proxy previews (`1x2.png` markers) — optional later; do not block internal-note hover
- Replacing clinical HTML patient packs with Markdown — separate content decision

---

## Stamp checklist (E0.M5)

When the milestone completes:

1. `decisions.markdown_renderer` = `markdown-it` (or documented override)
2. `decisions.decision_docs["E0.M5"]` = `AGENTS_POSSIBLE_DECISIONS__MARKDOWN.md`
3. Help / Docs opens MD via the shared renderer with live Mermaid
4. Inline/block LaTeX math renders (dosage / equation authoring)
5. Internal MD link hover preview implemented or scheduled as the next story under E0.M5 notes — see hover companion
