# AGENTS_POSSIBLE_DECISIONS — Index

Routing table for **architecture / library / mini-game** decision docs. Agents must consult this (and milestone **implement notes** in [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md)) before implementing work that touches these topics.

**When to read:** On **continue milestones** (see [`AGENTS-MILESTONES-TURNS.md`](AGENTS-MILESTONES-TURNS.md) Step 4b) and before any change that picks or replaces a runtime, context menu, timeline UI, markdown renderer, or perform mini-game.

**When not to re-debate:** If [`.agents/state.json`](.agents/state.json) → `decisions.*` already stamps a choice for the topic, follow the stamp unless the milestone explicitly reopens the decision or the user overrides.

**When no stamp exists:** Read the relevant decision doc, **make the best choice**, implement, and **explain why** in the agent report. Stamp `decisions.<key>` when the topic is settled. See [`AGENTS.md`](AGENTS.md) → Technology decisions.

**When to ask the user:** Only if the choice violates `decisions.main_constraints`, two allowed options are equally valid on product grounds, or milestone `status` is `blocked_waiting_user`.

---

## Decision docs

| Topic | Primary doc | Detail / companion | Milestone(s) | Stamp key in `state.json` |
|-------|-------------|-------------------|--------------|---------------------------|
| Game runtime / engine | [`AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md`](AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md) | — | **E0.M3** | `decisions.game_runtime` |
| Context menu library | [`AGENTS_POSSIBLE_DECISIONS__CONTEXT_MENU.md`](AGENTS_POSSIBLE_DECISIONS__CONTEXT_MENU.md) | [`AGENTS_POSSIBLE_DECISIONS__CONTEXT_MENU_jQuery ContextMenu.md`](AGENTS_POSSIBLE_DECISIONS__CONTEXT_MENU_jQuery%20ContextMenu.md) when using jQuery-contextMenu | **E3.M2**, **E3.M3**, **E2.M1** (med perform UX), any context-menu work | `decisions.context_menu_library` |
| Timeline / chart history UI | [`AGENTS_POSSIBLE_DECISIONS__TIMELINE.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE.md) | [`AGENTS_POSSIBLE_DECISIONS__TIMELINE_TimelineJS.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE_TimelineJS.md) (**default**); [`…_vis-timeline.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE_vis-timeline.md), [`…_custom-html.md`](AGENTS_POSSIBLE_DECISIONS__TIMELINE_custom-html.md) if overriding | **E2.M1** (past hx), optional **E1.M2** (event log), **E6** (debrief recap) | `decisions.timeline_library` → default **`timelinejs`** |
| Bed-prep / admission mini-game | [`AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md`](AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md) | — | **E5.M3** (Later) | (behavior spec; no library stamp) |
| Markdown / help / learning MD | [`AGENTS_POSSIBLE_DECISIONS__MARKDOWN.md`](AGENTS_POSSIBLE_DECISIONS__MARKDOWN.md) | [`…_MARKDOWN_markdown-it.md`](AGENTS_POSSIBLE_DECISIONS__MARKDOWN_markdown-it.md) (**default**: Mermaid + LaTeX/KaTeX); [`…_MARKDOWN_hover-preview.md`](AGENTS_POSSIBLE_DECISIONS__MARKDOWN_hover-preview.md) for internal-link hover | **E0.M5** (primary); **E0.M4** consumes shared renderer | `decisions.markdown_renderer` → default **`markdown-it`** |

---

## Milestone → docs (quick lookup)

| Milestone | Read before implementing |
|-----------|--------------------------|
| **E0.M3** | `AGENTS_POSSIBLE_DECISIONS__GAME_ENGINES.md` |
| **E0.M4** | Markdown docs if About/objectives should use the shared MD renderer early; otherwise plain shell copy until E0.M5 |
| **E0.M5** | `AGENTS_POSSIBLE_DECISIONS__MARKDOWN.md` (+ markdown-it + hover-preview companions); reference `context-devbrain/` for port snippets |
| **E2.M1** | `AGENTS_POSSIBLE_DECISIONS__TIMELINE.md` (+ TimelineJS detail if stamped); context menu docs if changing med perform / task details menus |
| **E3.M2** | Context menu docs (details + perform path) |
| **E3.M3** | Context menu docs if menu gates availability / perform |
| **E5.M3** | `AGENTS_POSSIBLE_DECISIONS__GAME_SETUP_BED_FOR_ADMISSION.md` |

---

## After a decision milestone completes

1. Stamp the outcome in `.agents/state.json` → `decisions` (see keys above).
2. Add or extend `decisions.decision_docs` with `{ "<milestone_id>": "<primary doc path>" }`.
3. Record brief rationale in the agent completion report (**Technology decision** section).
4. Do **not swap away** from a stamped library or runtime without user approval (see locked constraints in `state.json` → `decisions.main_constraints`).

---

## Related agent docs

| Doc | Role |
|-----|------|
| [`AGENTS.md`](AGENTS.md) | Entry; session continuation rule |
| [`AGENTS-MILESTONES-TURNS.md`](AGENTS-MILESTONES-TURNS.md) | Continue-milestones workflow (Step 4b) |
| [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md) | Per-milestone **implement notes** (preferred link target) |
| [`AGENTS_CODE_REFERENCE.md`](AGENTS_CODE_REFERENCE.md) | What is already wired in code (e.g. jQuery contextMenu in shell) |
