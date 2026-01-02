# Guidelines for Creating Milestone Prompts

A practical guide for designing AI-friendly milestone prompts that reduce scope creep, prevent architectural drift, and produce shippable increments.

---

## Why Milestone Prompts Work

When you tell an AI "build this app," it must simultaneously decide:
- Folder structure
- Naming conventions
- Libraries/dependencies
- Data models
- AND write the actual code

This cognitive overload causes drift—the AI improvises, makes inconsistent choices, and produces code that doesn't fit together.

**Milestone prompts fix this by separating decisions:**
1. You (human) define the constraints and architecture
2. AI implements within those boundaries
3. Each milestone produces something reviewable
4. Corrections are cheap before the codebase hardens

---

## The 5-Block Structure

Every milestone prompt should include these 5 sections:

### 1. Context + Goal (2-4 sentences)

```markdown
## Context
[What exists now. What problem this solves. Why it matters.]

## Goal
[What this milestone delivers. Be specific and concrete.]
```

**Good:**
> Implement a slot system where starting a task occupies one of 3 slots, 
> the slot shows progress during task duration, and releases when complete.

**Bad:**
> Make the task queue work better.

### 2. Non-Goals (Explicit Scope Boundaries)

List what the AI should NOT do. This is the most important section for preventing scope creep.

```markdown
## Non-Goals
- ❌ Do NOT implement [future feature]
- ❌ Do NOT refactor [unrelated system]
- ❌ Do NOT add [nice-to-have]
- ❌ Do NOT change [stable component]
```

**Pro tip:** For every feature you want, write 2-3 things you explicitly don't want yet.

### 3. Contracts / Interfaces

Define the shapes before implementation. This is your "anchor artifact" that prevents drift.

```markdown
## Contracts / Interfaces

### Data Shape
```typescript
interface Task {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'complete';
  duration: number;
}
```

### Function Signatures
```typescript
function assignTaskToSlot(slotIndex: number, task: Task): boolean;
function releaseSlot(slotIndex: number): void;
```

### API Routes (if applicable)
```
POST /api/tasks/:id/start
GET  /api/slots
```
```

**Why this matters:** Once these exist, the AI has a "map." Without them, it improvises differently each time.

### 4. File Map

Tell the AI exactly which files to create/modify.

```markdown
## Required File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/slot-system.js` | CREATE | Slot management logic |
| `src/game-state.js` | MODIFY | Add slots to state |
| `src/styles/slots.css` | CREATE | Slot UI styles |
```

**Include:**
- New files to create
- Existing files to modify
- Files that should NOT be touched

### 5. Acceptance Checks

Concrete, testable criteria for "done."

```markdown
## Acceptance Checks

1. **Slot Assignment**
   - [ ] Clicking "Perform" assigns task to first empty slot
   - [ ] If all slots occupied, action is disabled

2. **Progress Tracking**
   - [ ] Progress bar advances with game time
   - [ ] Time remaining displays correctly

3. **Completion**
   - [ ] Task auto-completes at 100% progress
   - [ ] Slot releases and returns to empty state
```

**Format as checkboxes** so you can verify each one.

---

## Output Format Requirements

Tell the AI exactly what to return:

```markdown
## Output Format Requirements

Return:
1. **File tree** with new/modified files marked
2. **Code per file** - full contents for new files, diff-style for modifications
3. **Test steps** - manual verification in browser/terminal
```

This prevents:
- Rambling explanations instead of code
- Partial implementations
- Missing files

---

## Milestone Sequencing Rules

### Rule 1: Each milestone should compile/run

Never create a milestone that leaves the app in a broken state. Every milestone should produce something testable.

### Rule 2: Dependencies flow forward

```
M1 → M2 → M3
     ↓
    M2 must work without M3
    M3 can assume M2 exists
```

### Rule 3: Start with data, then logic, then UI

Typical sequence:
1. Data models / schemas
2. Core logic / state management
3. UI components
4. Polish / interactions

### Rule 4: Identify the "vertical slice"

A vertical slice touches all layers but for one feature:

```
❌ Bad: "Build all the data models"
✅ Good: "Build task creation end-to-end (schema → state → UI → test)"
```

---

## Milestone Size Guidelines

| Size | Lines of Code | Scope |
|------|---------------|-------|
| Too small | <50 | Single function, not worth a milestone |
| Ideal | 100-500 | One feature, 2-5 files |
| Too large | >1000 | Multiple features, split it |

**Rule of thumb:** If you can't verify completion in 5 minutes, the milestone is too big.

---

## Common Patterns by Project Type

### Games

```
M1: Core game loop (timer, state machine)
M2: Entity definitions (players, enemies, items)
M3: Core mechanic (movement, combat, puzzle)
M4: Progression system (levels, scoring)
M5: UI/UX (menus, HUD, feedback)
M6: Polish (sound, particles, juice)
```

### CRUD Apps

```
M1: Data model + database schema
M2: API routes (create, read)
M3: API routes (update, delete)
M4: Authentication
M5: Frontend - list/read views
M6: Frontend - create/edit forms
M7: Frontend - polish
```

### CLI Tools

```
M1: Argument parsing + help text
M2: Core command implementation
M3: Configuration file support
M4: Error handling + edge cases
M5: Additional commands
M6: Output formatting options
```

---

## Anti-Patterns to Avoid

### ❌ The "Kitchen Sink" Milestone

```markdown
## Goal
Build the complete task system with slots, scoring, 
achievements, multiplayer sync, and save/load.
```

**Fix:** Split into 5+ milestones.

### ❌ The Vague Goal

```markdown
## Goal
Improve the user experience.
```

**Fix:** "Add loading spinners to all async operations and error toasts for failed requests."

### ❌ Missing Non-Goals

Without explicit boundaries, the AI will "helpfully" add:
- Extra features you didn't ask for
- Refactors to "improve" existing code
- Abstraction layers for "flexibility"

**Fix:** Always include 3-5 non-goals.

### ❌ No Contracts

```markdown
## Goal
Add a scoring system.
```

Without interfaces, you'll get different score shapes each time.

**Fix:** Define `ScoreState`, `ScoreEvent`, calculation functions upfront.

### ❌ Frozen Architecture

Sometimes early decisions are wrong.

**Fix:** Add to milestone 1-2:
> "Architecture is provisional. Refactors allowed if complexity reduces. 
> Document: what changed + why."

---

## Template: Minimal Milestone

```markdown
# Milestone X: [Feature Name]

## Context
[1-2 sentences: what exists, what's missing]

## Goal
[2-3 sentences: specific deliverable]

## Non-Goals
- ❌ [Future feature 1]
- ❌ [Future feature 2]
- ❌ [Unrelated refactor]

## Constraints
- [Tech stack limits]
- [Patterns to follow]
- [Files not to touch]

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `path/file.js` | CREATE | [Purpose] |

## Contracts

```typescript
// Key interfaces/types
```

## Acceptance Checks
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Testable criterion 3]

## Output Format
Return: file tree, code per file, test steps.
```

---

## Template: Detailed Milestone

```markdown
# Milestone X: [Feature Name]

## Context
[What exists. What this builds on.]

## Goal
[Specific, concrete deliverable]

## Non-Goals
- ❌ [Explicit exclusion 1]
- ❌ [Explicit exclusion 2]
- ❌ [Explicit exclusion 3]
- ❌ [Explicit exclusion 4]

## Constraints
- Use existing [pattern/library]
- Maintain backward compatibility with [component]
- No new dependencies
- Follow [naming convention]

## Existing File Tree (if relevant)
```
src/
├── existing-file.js    # Context
└── another-file.js     # Don't modify
```

## Required File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/new-file.js` | CREATE | [Brief purpose] |
| `src/existing.js` | MODIFY | Add [specific thing] |

## Contracts / Interfaces

### Data Types
```typescript
interface NewThing {
  id: string;
  // ...
}
```

### Functions
```typescript
function doThing(input: Input): Output;
```

### State Changes (if applicable)
```javascript
// New actions
dispatch('NEW_ACTION', { payload });
```

### CSS Classes (if applicable)
```css
.new-component { }
.new-component--variant { }
```

### HTML Structure (if applicable)
```html
<div class="new-component">
  <span class="new-component__label"></span>
</div>
```

## Acceptance Checks

1. **[Feature Area 1]**
   - [ ] [Specific testable behavior]
   - [ ] [Another behavior]

2. **[Feature Area 2]**
   - [ ] [Specific testable behavior]

3. **[Edge Cases]**
   - [ ] [Boundary condition]
   - [ ] [Error handling]

## Output Format Requirements

Return:
1. **File tree** with new/modified files marked
2. **Code per file** 
3. **Test steps** to verify manually

## Example (if helpful)
```
[Concrete example of the feature working]
```
```

---

## Iteration Tips

### After Each Milestone

1. **Verify all acceptance checks pass**
2. **Note any surprises** - things the AI did that you didn't expect
3. **Update future milestones** if architecture changed
4. **Commit to git** before next milestone

### When Things Go Wrong

**AI ignored a non-goal:**
- Add more explicit non-goals next time
- Reference specific files: "Do NOT modify src/auth.js"

**AI used wrong patterns:**
- Add a "Constraints" section with code examples
- Reference existing files: "Follow the pattern in src/existing.js"

**Output was incomplete:**
- Add stricter output format requirements
- Break milestone into smaller pieces

**Architecture doesn't fit:**
- It's okay to refactor! Add a "cleanup milestone"
- Update remaining milestones with new file structure

---

## Checklist Before Submitting a Milestone Prompt

- [ ] Goal is specific and concrete
- [ ] Non-goals list at least 3 exclusions
- [ ] Contracts define data shapes and function signatures
- [ ] File map lists all files to create/modify
- [ ] Acceptance checks are testable checkboxes
- [ ] Output format is specified
- [ ] Previous milestone's changes are committed
- [ ] Milestone can be verified in <5 minutes

