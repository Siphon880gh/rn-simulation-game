# AGENTS-CODE_REFERENCE_INIT.md

Here Prompt 1 initializes context management via an `AGENTS_CODE_REFERENCE.md` file. Therefore, prompts to change the website can ask AI to refer to the `AGENTS_CODE_REFERENCE.md` file that is a high level explanation of the code with approximate location cues. This makes it less likely that 200 lines of code for another feature get wiped often when you’re making an unrelated code change via the prompt. Token window doesn’t run out and AI doesn’t make assumptions as much about what’s a feature or not.

Prompt 1 should be ran every so often to sync your code changes to the context files if you've been sliding from using the evergreen prompt for every feature request. However, running prompt 1 to sync the code also gives it an opportunity to make the context file more efficient (shortening explanation or splitting into context*.md files), so run Prompt 1 at:

- After 1 major feature change where a lot of files or lines got modified/created
- After 3-5 minor changes

---

## Prompt 1

```
We’ve just updated the code. Please update or generate the `AGENTS_CODE_REFERENCE.md` documentation so **AI tools** can reliably understand the project and generate code safely.

**Goal:**

Maintain `AGENTS_CODE_REFERENCE.md` and `AGENTS_CODE_REFERENCE-*.md` so any AI assistant always has a fast, accurate way to re-learn the project and answer prompts effectively—without risking accidental code loss in the context.

---

## 1. Base `AGENTS_CODE_REFERENCE.md` (High-Level Overview)

If `AGENTS_CODE_REFERENCE.md` is missing, create it as a high-level knowledge base for the AI. Begin the file with a brief note explaining its purpose—helping AI tools understand the codebase—and list any companion `AGENTS_CODE_REFERENCE-*.md` files it references. For example:

AI-oriented codebase map for safe modification, feature tracing, and implementation planning.

Provide a **high-level description** of:

- What the app does
- Tech stack
- Architecture
- File Tree – highlight relevant files and their roles
- High-level code flow

Include:

- A short **relevant file tree**
- Selective **inline code snippets** with file references

### ⚠️ Line Reference Rule (Important)

Do **NOT** reference exact line numbers when describing code.

**Reason:**

Exact line numbers are fragile and inefficient because:

- Code changes frequently
- Line numbers shift with every edit
- This creates unnecessary AI rework and increases race-condition risk
- Maintaining exact references wastes compute and token budget

**Instead, use approximate location cues**, such as:

- “Near the top of the file”
- “Roughly 25% into the file”
- “Around lines 100–150”
- “In the middle of the file”
- “Below function `X`”
- “Near the end of the file”

This level of precision is sufficient for **high-level understanding** and makes it easy to navigate the code later without brittle references.

👉 Add a short reminder note at the top of **each** `AGENTS_CODE_REFERENCE.md` and `AGENTS_CODE_REFERENCE-*.md` file stating that **approximate references are intentional**.

---

## 2. Feature-Specific Context Files (`AGENTS_CODE_REFERENCE-*.md`)

If `AGENTS_CODE_REFERENCE.md` becomes too long:

1. First, condense it.
2. If still too long, split details into feature-specific files:

- `AGENTS_CODE_REFERENCE-auth.md`
- `AGENTS_CODE_REFERENCE-ui.md`
- `AGENTS_CODE_REFERENCE-api.md`
- etc.

Each `AGENTS_CODE_REFERENCE-*.md` file should:

- Follow the same outline as `AGENTS_CODE_REFERENCE.md`
- Cover **only its own module**
- Use approximate code-location references (same rule as above)

`AGENTS_CODE_REFERENCE.md` (no suffix) must always remain the **high-level overview**, possibly paired with feature context*.md files for detail. We look into the codebase afterwards if the context files are insufficient. This keeps executions token efficient.

---

## 3. Recent Changes Awareness

You may read the git log to understand what was recently implemented based on commit message names.

---

## 4. Optimization for Context Windows

- Keep documentation **concise** to save tokens
- You may include the **total line count** of referenced files (helps decide whether to load entire files later)
- When context space is limited:
  - Prioritize `AGENTS_CODE_REFERENCE.md`
  - Anchor responses explicitly with:

> “Refer to AGENTS_CODE_REFERENCE.md for high-level context; details are in feature context files.”

If you only edited `AGENTS_CODE_REFERENCE.md` (and not any `AGENTS_CODE_REFERENCE-*.md` files), once finished:

- Assess whether `AGENTS_CODE_REFERENCE.md` has become too long or detailed
- If so, determine whether it should be split into feature-specific `AGENTS_CODE_REFERENCE-*.md` files
```
