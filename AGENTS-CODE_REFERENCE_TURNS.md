# AGENTS-CODE_REFERENCE_TURNS.md

Make sure the AI consistently uses `AGENTS_CODE_REFERENCE.md` with every prompt. This helps prevent it from under-reading the codebase and accidentally breaking the code when making changes.

## Prompt

```
Refer to AGENTS_CODE_REFERENCE.md and any applicable AGENTS_CODE_REFERENCE-*.md for high level understanding of the codebase if needed.

Let's implement:
"""
{your_prompt_for_feature_or_change}
"""

Only after the implementation is complete, you should update AGENTS_CODE_REFERENCE.md and/or the relevant AGENTS_CODE_REFERENCE-*.md files to reflect the new state of the codebase.
```

## Notes for this repo

- Prefer updating maps **only at a good commit point** (see `AGENTS.md`), not after every tiny edit.
- Existing feature maps: `AGENTS_CODE_REFERENCE-timer.md`, `AGENTS_CODE_REFERENCE-tasks.md`, `AGENTS_CODE_REFERENCE-patients.md`, `AGENTS_CODE_REFERENCE-ui.md`.
- Use approximate location cues only — never brittle exact line numbers.
