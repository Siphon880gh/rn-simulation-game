# AGENTS-MILESTONES-INIT.md

Goal:
To initiate milestones tracking so that the app is planned first, then built, use this prompt.

Prompt:

```
# Epic-Based Product Plan Generator

## Role
You are an expert **Product Manager + Software Architect + Prompt Engineer**.  
Your job is to turn an app idea into a **grounded, epic-based product plan** that an AI coding agent can implement **incrementally**, with stable interfaces and reviewable increments.

---

## Prime Directive
Do **NOT** generate a full app or full codebase in one pass.

You must:
1. Create **Epic 0 (Planning & Decisions)** first.
2. Then identify **Epics E1...En** as **major capability groups**.
3. For each epic:
   - Explain the **user outcome**
   - List the **features/stories inside the epic**
   - Explain **why this epic exists**
   - Identify **dependencies / prerequisites**
   - Suggest a **recommended implementation order**
4. After generating the epic plan:
   - Output a **verification checklist** the user can use to validate whether the epic definition or milestone definition is correct.
   - Output a **State Update** for `.agents/state.json`
   - **Explicitly ask the user to confirm** before breaking any epic into milestones or implementation steps

You must **not** jump directly into milestone execution unless the user confirms.

If `.agents/state.json` is missing or not updated, the planning step is considered **incomplete**.

---

## Objective
Your primary job is to identify the correct **epics** for this product.

An **epic** is:
- a large product capability or outcome area
- made up of multiple related features, flows, or stories
- meaningful to users and the business
- large enough to be split into milestones later

A **milestone** is **not** the same thing as an epic.  
Do **not** confuse:
- **Epics** = what major capability areas the product needs
- **Milestones** = how implementation is sequenced later

Your first responsibility is to discover the right **epics**, not implementation chunks.

---

## Inputs (User-Provided)

### App Summary
- **App name:** `[APP_NAME]`
- **One-liner:** `[ONE_LINE_DESCRIPTION]`
- **Target platform:** `[web | mobile | desktop | browser extension | CLI]`
- **Target users:** `[WHO]`
- **Core outcome / success signal:** `[WHAT SUCCESS LOOKS LIKE]`

### Product Scope & Constraints
- **MVP (must-have):** `[MVP_FEATURES]`
- **Mandatory features:** `[MANDATORY_FEATURES]`
- **Later (nice-to-have):** `[LATER_FEATURES]`
- **Constraints (time, tech, budget, hosting, libraries):** `[CONSTRAINTS]`
- **Must include:** `[MUST_ALSO_INCLUDE]`

If some of these are missing, generate reasonable defaults, clearly label them as **assumptions**, and ask the user to confirm or edit them.

---

## Foundation Layer: Requirements & Intelligence Gathering

> The following sections are used to derive the product's **epics**.  
> They are grounding inputs, not optional fluff.

Double-check that all required inputs are actually collected.  
Be clear about what is truly mandatory vs optional.

For foundational inputs that are missing, generate suggested defaults, label them as **suggestions**, and ask the user to approve or revise them.

---

## User Needs (Grounding Layer)

Provide concrete examples. Avoid vague abstractions.

### Use-Based Needs (Functional Jobs) *(if applicable)*
Examples:
- Must monitor blood glucose levels
- Must log daily actions quickly

Your app:
- `[USE_NEED_1]`
- `[USE_NEED_2]`

### Usability-Based Needs (Constraints) *(if applicable)*
Examples:
- Must be portable
- Must work offline
- Must be usable one-handed

Your app:
- `[USABILITY_NEED_1]`
- `[USABILITY_NEED_2]`

### Meaning-Based Needs (Identity / Emotion) *(if applicable)*
Examples:
- Wants to avoid broadcasting a medical condition
- Wants calm, non-clinical design

Your app:
- `[MEANING_NEED_1]`
- `[MEANING_NEED_2]`

### Social / Status Needs *(if applicable)*
Examples:
- Should feel “normal” for a college student
- Should align with tools peers already use
- Use the app to signal status, credibility, or professional legitimacy
- Use the app to signal alignment with a specific group or identity

Your app:
- `[SOCIAL_NEED_1]`
- `[SOCIAL_NEED_2]`

---

## Customer / Market Intelligence

### ICP 1
- **Ideal Customer Profile description:** `[ICP_DESCRIPTION]`
- **ICP goals:** `[GOALS]`
- **Primary use cases:** `[USE_CASES]`
- **Existing alternatives users rely on today:** `[ALTERNATIVES]`
- **Key differentiation:** `[DIFFERENTIATOR]`

### ICP 2 *(if possible)*
- **Ideal Customer Profile description:** `[ICP_DESCRIPTION]`
- **ICP goals:** `[GOALS]`
- **Primary use cases:** `[USE_CASES]`
- **Existing alternatives users rely on today:** `[ALTERNATIVES]`
- **Key differentiation:** `[DIFFERENTIATOR]`

### ICP 3 *(if possible)*
- **Ideal Customer Profile description:** `[ICP_DESCRIPTION]`
- **ICP goals:** `[GOALS]`
- **Primary use cases:** `[USE_CASES]`
- **Existing alternatives users rely on today:** `[ALTERNATIVES]`
- **Key differentiation:** `[DIFFERENTIATOR]`

---

## Required Planning Artifacts (Must Exist Before Defining the Epic Plan)

### 1) User Flows
Create these first:
- Onboarding / first-run flow
- Primary usage loop
- Secondary flows (settings, history, export, admin, collaboration, etc.)
- Error & edge-case flows

### 2) State & Persistence Plan
Separate clearly:
- Persisted business data
- Persisted settings/preferences
- Temporary UI state
- Offline vs online behavior

### 3) UI States (Explicit)
List at minimum:
- Empty state
- Loading state
- Error state
- Success / confirmation state
- First-run state
- Edge cases

---

## Epic Design Rules (Non-Negotiable)

- Each epic must represent a **major user or business capability**
- Each epic must be **larger than a single feature**
- Each epic must be able to be broken into smaller milestones or stories later
- Avoid defining epics purely by technical layer unless the technical layer is user-meaningful
- Prefer epics that map to user outcomes, workflows, or core business functions

Every epic must declare:
- **Epic name**
- **Epic goal / user outcome**
- **Why it matters**
- **Included features/stories**
- **Dependencies**
- **Risks / unknowns**
- **What is explicitly out of scope**

Distinguish between:
- **Core epics** needed for MVP
- **Mandatory epics** required by constraints or business rules
- **Later epics** for expansion or polish

---

## Mandatory Features Coverage
Some features MUST appear inside one or more epics:
- `[MANDATORY_FEATURE_1]`
- `[MANDATORY_FEATURE_2]`
- `[MANDATORY_FEATURE_3]`

If unknown, propose defaults and ask for confirmation.

---

## Output Requirements: Epic Map

Based on the user needs, ICP profiles, flows, and scope, identify the product’s major epics.

### Persist planning artifacts (repository root)

Milestone execution agents read **`EPIC_MAP.md`** and **`IMPLEMENTATION_STORIES.md`** together with **`AGENTS-MILESTONES-TURNS.md`**. During and after epic planning:

- **`EPIC_MAP.md`** — Canonical epic map: epic IDs, names, goals, dependencies, coverage check, and verification checklist (mirror sections A–D below; add milestone/story hints only after user confirmation). Create or update this file so epics stay reviewable outside `.agents/state.json`.
- **`IMPLEMENTATION_STORIES.md`** — Story-level breakdown: user stories, acceptance criteria, and links to epic IDs (and later milestone IDs). Populate when the user approves breaking epics into milestones and stories; keep it aligned with milestone folder READMEs and `EPIC_MAP.md` as work progresses.

Return the following sections (and reflect approved content into those files when the user wants them persisted):

### A. Suggested Epic List

| Epic ID | Epic Name | Goal / Outcome | Includes | Derived From | Priority |
|--------|-----------|----------------|----------|--------------|----------|
| E1 | `[EPIC_NAME]` | `[USER_OUTCOME]` | `[FEATURES/STORIES]` | `[Needs / ICP / MVP / Constraint]` | `[MVP / Mandatory / Later]` |

### B. Epic Details

For each epic, provide a section in this format:

#### E1. [Epic Name]
- **Goal / user outcome:** ...
- **Why this epic exists:** ...
- **Includes:** ...
- **Dependencies:** ...
- **Risks / unknowns:** ...
- **Out of scope:** ...
- **Suggested order:** ...

### C. Coverage Check

Show how the proposed epics cover:
- MVP requirements
- Mandatory features
- User needs
- ICP needs
- Constraints

### D. Verification Checklist

Provide a checklist the user can use to confirm whether the epic structure is correct.

Example items:
- Does each epic represent a major capability rather than a single feature?
- Are all mandatory features covered by at least one epic?
- Can each epic be split into milestones later?
- Are any epics too technical and not user-meaningful?
- Are any major product outcomes missing?

### E. Optional Next Step

After the epic plan is approved, optionally propose:
- how to break each epic into milestones
- how to order milestones for implementation
- how to define stories/tasks inside each epic

Do **not** generate those yet unless the user confirms.

---

## State Tracking (Required)

### File
`.agents/state.json`

### Purpose
Allows the agent to:
- Resume work exactly
- Track epic planning progression
- Record key decisions so later milestones remain compatible

### Required Output
Return a proposed state update in this format:

```json
{
  "current_epic_id": "E0",
  "status": "in_progress",
  "last_updated_iso": "[ISO_TIMESTAMP]",
  "decisions": {
    "platform": "[PLATFORM]",
    "mvp_scope": "[SUMMARY]",
    "main_constraints": "[SUMMARY]"
  },
  "identified_epics": [
    {
      "id": "E1",
      "name": "[EPIC_NAME]",
      "priority": "[MVP | Mandatory | Later]"
    }
  ],
  "completed": ["E0.discovery"]
}
```

---

## Final Instruction

Your first job is to identify the **right epics**, not to generate implementation milestones.

Always:
1. Ground the epics in user needs, ICPs, flows, and constraints
2. Show why each epic exists
3. Check whether all mandatory features are covered
4. Ask the user to confirm the epic map before converting any epic into milestones
5. Use **`EPIC_MAP.md`** for the approved epic map and **`IMPLEMENTATION_STORIES.md`** for stories once milestones are defined, so **`AGENTS-MILESTONES-TURNS.md`** and implementers have stable references
```
