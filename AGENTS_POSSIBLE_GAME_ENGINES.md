# Possible Game Engines — RN Simulation Game

Agent reference for engine / runtime choices when designing or extending the game.

**Product format (ground truth):** browser **real-time shift simulation** — accelerated military clock, multi-patient clinical panels, timed tasks with availability windows, limited concurrent execution slots, scenario/event drip, optional perform mini-games, scoring/debrief. Not a classic choose-your-own-adventure as the primary loop.

**Locked stack direction** (see [`.agents/state.json`](.agents/state.json) → `decisions.main_constraints`):

- Web, ES6 modules, no required build step for MVP
- Vanilla JS (+ jQuery / signals or light reactive layer)
- **No React / Ink / Twine unless explicitly approved**
- Panels-first UI (clinical surfaces, not inventory RPG chrome)

Use this file for ideas and tradeoffs. Do not switch stacks without user approval.

---

## Fit tiers for *this* game

| Tier | Meaning |
|------|---------|
| **Most likely** | Matches current constraints and core loop (clock + panels + slots + content packs) |
| **Likely (partial)** | Useful for one subsystem (e.g. mini-games, reactivity) without replacing the shell |
| **Possible (needs approval)** | Viable if product direction changes; conflicts with current “vanilla / no React-Ink-Twine” rule |
| **Poor fit** | Wrong interaction model, heavy toolchain, or fights panels-first clinical UX |

---

## Most likely

### Custom vanilla JS runtime (current direction)

**Description:** Own the shift shell in ES6 modules: game clock, patient/task state, slot machine, DOM panel updates, scenario loader. Content as HTML data attrs → JSON/YAML packs.

**Integration:** Static/local server; modules import into the page; light reactive helpers (signals) optional for UI sync.

**Status panels:** First-class — vitals, meds, tasks, slots are the product UI, not bolted onto a story runner.

**Why it fits:** Core loop is concurrent, time-driven, and panel-dense. Narrative engines optimize for branch graphs; this product optimizes for **workload under a clock**.

---

### Scenario-as-data runtime (JSON → YAML packs)

**Description:** Not a third-party “engine,” but the content runtime epic (E4): timed unlocks, hourly orders, acuity hooks, chaos packs later.

**Integration:** Loader reads pack files; events fire against game time; UI stays in the custom shell.

**Status panels:** Packs mutate patient/task state; React-style components not required.

**Why it fits:** Educators and replay need **authored content**, not a new framework.

---

## Likely (partial — subsystem only)

### Light reactive layer (signals / jQuery bindings)

**Description:** Minimal reactivity so panel DOM stays in sync with clock, slots, and census without a SPA framework.

**Integration:** Subscribe store → patch panel regions; keep modules ES6-friendly.

**Status panels:** Natural fit for live vitals, slot progress, overdue cues.

---

### Plugin mini-game modules (custom)

**Description:** Pass/fail challenges (e.g. med identity) in a modal that pauses the shift clock; registry of mini-game types.

**Integration:** Task perform path opens modal → emit pass/fail → assign slot or block.

**Status panels:** Challenge UI is temporary; census/slots remain the main chrome.

**Why it fits:** Matches E5 without adopting a full 2D engine for the whole app.

---

### Kaplay (formerly Kaboom) — mini-games only

**Description:** Lightweight browser 2D toolkit; fast to prototype skill-check scenes.

**Integration:** Mount a canvas/scene inside the challenge modal; destroy on complete; do not drive the shift shell.

**Status panels:** Keep outside Kaplay; pass task context in, return pass/fail out.

**Fit note:** Only if a challenge needs canvas/arcade feel. Text quizzes stay DOM.

---

### Phaser — mini-games / presentation polish only

**Description:** Mature HTML5 2D framework (scenes, input, tweening).

**Integration:** Same boundary as Kaplay — isolate to perform challenges or later art-heavy moments (E7). Avoid making Phaser the app shell.

**Status panels:** Clinical panels stay HTML/CSS; Phaser is a guest viewport.

---

### XState (or small custom state machine)

**Description:** Explicit machines for shift phases, slot lifecycle, challenge pause/resume — not a game engine, but strong for timed concurrent systems.

**Integration:** Vanilla JS hosts the machine; UI listens to state/context.

**Status panels:** Derive panel copy and enabled actions from machine context.

---

## Possible (needs approval — includes user-listed narrative options)

### Ink by Inkle Studios (+ inkjs)

**Description:** Narrative scripting language from Inkle (80 Days, Heaven’s Vault). Built for complex branching text stories.

**Integration:** `inkjs` runs Ink stories in JavaScript; can sit behind React or plain DOM.

**Status panels:** Ink variables can track health, inventory, or stats for a side panel.

**Fit for RN sim:** Strong for **dialogue-heavy debriefs, patient conversations, or branching case vignettes**. Weak as the **primary** driver of multi-patient concurrent tasks and an accelerated shift clock. Requires approval (listed in stack constraints).

---

### Twine with Twison or TweeJS

**Description:** Tooling for interactive text stories with multiple paths. Twison / TweeJS export toward JavaScript-consumable formats.

**Integration:** Convert story → JS-friendly data → host in a component or vanilla view; control flow from the host.

**Status tracking:** Story variables can surface to host UI (health, inventory, flags).

**Fit for RN sim:** Good for **linear/branching educational scenarios** offline from the clock. Awkward for **simultaneous patients, slot concurrency, and continuous game time**. Requires approval.

---

### Adventure Engine

**Description:** Simpler, text-focused JavaScript framework with light setup; custom status variables; modular flow control.

**Integration:** React or vanilla for chrome; hooks/modules for game state.

**Status panels:** Host UI updates health/status from engine variables as the player advances.

**Fit for RN sim:** Fine for **stepwise case walkthroughs**. Not aligned with **real-time drip events + 3-slot execution** unless heavily customized (at which point custom runtime wins).

---

### React-based custom setup

**Description:** Custom text/sim UI via React state and conditional rendering. Optional Redux/Zustand for global state; react-transition-group or framer-motion for text/panel transitions.

**Status panels:** Health, inventory, census, slots as live React components.

**Fit for RN sim:** Technically capable of the whole product (panels, clock, slots). **Conflicts with current MVP constraint** (vanilla / no React unless approved). Consider only if the project explicitly moves to a SPA toolchain.

---

### Lit / Web Components

**Description:** Component model on the platform (Custom Elements) without a full React app.

**Integration:** Package panel widgets; still ES modules; can stay closer to “no SPA build” depending on tooling.

**Status panels:** Each clinical surface as a component updating from a shared store.

**Fit for RN sim:** Middle path if DOM complexity grows and React stays off-limits.

---

### PixiJS

**Description:** 2D WebGL renderer; not a full gameplay framework alone.

**Integration:** Overlay or challenge canvas; shell remains HTML panels.

**Fit for RN sim:** Later presentation (E7), not MVP shell.

---

## Poor fit (for primary architecture)

| Option | Why poor fit here |
|--------|-------------------|
| **Godot / Unity WebGL** | Heavy export, long iteration, wrong default UX for dense clinical HTML panels |
| **Three.js / Babylon.js as shell** | 3D-first; only relevant if a Later epic mandates 3D wards |
| **Ren’Py, Inform 7, classic parser IF** | Wrong platform or interaction model for timed multi-patient slots |
| **Construct / GDevelop as shell** | Visual builders fight versioned clinical content packs and panel UX |
| **Full Phaser/Kaplay app shell** | Canvas games bury “readable clinical panels”; overkill for DOM-first MVP |

---

## Comparison table — our format & purposes

Purposes scored against: **clock & concurrency**, **clinical panels**, **scenario packs**, **perform challenges**, **vanilla/no-build MVP**, **educator-authored content**.

| Engine / approach | Tier | Clock & slots | Clinical panels | Scenario packs | Mini-games | Vanilla / no-build | Authoring | Notes |
|-------------------|------|---------------|-----------------|----------------|------------|--------------------|-----------|-------|
| Custom vanilla JS shell | Most likely | Excellent | Excellent | Excellent (with loader) | Good (plugins) | Excellent | Code + data files | Matches locked decisions |
| JSON/YAML scenario runtime | Most likely | Excellent (hooks) | N/A (feeds shell) | Excellent | N/A | Excellent | Non-dev friendly path | E4 direction |
| Signals / light reactive | Likely partial | Good | Excellent | N/A | N/A | Excellent | Code | UI sync only |
| Custom mini-game plugins | Likely partial | Good (pause) | Good | N/A | Excellent | Excellent | Code modules | E5 direction |
| Kaplay (challenges only) | Likely partial | Fair | Poor if overused | Poor | Excellent | Good | Code | Keep sandboxed |
| Phaser (challenges only) | Likely partial | Fair | Poor if overused | Poor | Excellent | Fair (often bundled) | Code | Heavier than Kaplay |
| XState / state machines | Likely partial | Excellent | Good | Fair | Fair | Good | Code | Orchestration aid |
| Ink + inkjs | Possible | Poor–Fair | Fair (vars → UI) | Fair (story = content) | Poor | Good | Excellent for prose branches | Approval required; narrative slice |
| Twine + Twison/TweeJS | Possible | Poor | Fair | Fair | Poor | Fair | Excellent for branches | Approval required; not real-time sim |
| Adventure Engine | Possible | Poor–Fair | Fair | Fair | Poor | Good | Simple text flows | Weak concurrency model |
| React custom app | Possible | Excellent | Excellent | Excellent | Excellent | Poor (toolchain) | Code | Approval required; stack change |
| Lit / Web Components | Possible | Good | Excellent | Good | Good | Good–Fair | Code | If components needed without React |
| PixiJS | Possible / Later | Fair | Poor as shell | Poor | Good | Fair | Code | Render guest only |
| Godot / Unity WebGL | Poor fit | Fair | Poor | Fair | Good | Poor | Editor-centric | Wrong primary shell |
| Three/Babylon shell | Poor fit | Fair | Poor | Poor | Fair | Poor | Code | Later 3D only |

### Pros / cons vs our gaming format

| Approach | Pros for RN shift sim | Cons for RN shift sim |
|----------|----------------------|------------------------|
| **Custom vanilla JS** | Matches constraints; panels + clock + slots are native; easy static host; full control of military time & pause rules | You own tooling, content schema, and edge cases |
| **Scenario-as-data** | Replay, educator packs, drip events without rewriting UI | Need a clear schema and loader; not a “story editor” out of the box |
| **Signals / light reactive** | Live panels without React; small surface area | Not a content or narrative solution |
| **Mini-game plugins** | Scalable challenges; timer pause boundary is clear | Each new challenge is custom work |
| **Kaplay / Phaser (partial)** | Richer skill checks / motion later | Easy to accidentally canvas-ify the whole product; bundling vs no-build |
| **XState** | Clear shift/slot/challenge states under concurrency | Learning curve; still need custom game rules |
| **Ink** | Best-in-class branching prose; variables for simple stats | Branch graph ≠ multi-patient workload; approval gate |
| **Twine family** | Fast narrative prototyping; familiar to educators | Export/host glue; poor real-time concurrent sim |
| **Adventure Engine** | Low ceremony text flow | Underspecified for slots, windows, urgents |
| **React custom** | Excellent for dense interactive panels and global state | Violates current MVP stack unless approved; usually implies build step |
| **Lit** | Components without React brand/stack | Still a framework commitment; less “game engine” than UI kit |
| **Heavy 3D / big engines** | Spectacle, portfolio punch later | Fights panels-first clinical readability and light web delivery |

---

## Agent guidance

1. **Default:** extend the **custom vanilla shell** + **scenario packs** + **plugin challenges**.
2. **Narrative engines (Ink / Twine / Adventure Engine):** only for an approved slice (e.g. conversation or case vignette), never as the shift clock/slot authority.
3. **React:** treat as a product decision, not a quiet dependency add.
4. **2D engines (Kaplay / Phaser / Pixi):** guest inside perform challenges or Later presentation — not the census/task chrome.
5. When proposing an engine, map it to epics in [`EPIC_MAP.md`](EPIC_MAP.md) (E1 clock, E2 panels, E3 slots, E4 scenarios, E5 challenges) and say which tier above it belongs to.

---

## Related artifacts

| Artifact | Role |
|----------|------|
| [`.agents/state.json`](.agents/state.json) | Locked platform/stack decisions |
| [`EPIC_MAP.md`](EPIC_MAP.md) | Product capabilities and constraints |
| [`IMPLEMENTATION_STORIES.md`](IMPLEMENTATION_STORIES.md) | Milestone backlog |
| [`prompts/v1/02b_MILESTONE_MINIGAME_CHALLENGE.md`](prompts/v1/02b_MILESTONE_MINIGAME_CHALLENGE.md) | Plugin mini-game shape |
