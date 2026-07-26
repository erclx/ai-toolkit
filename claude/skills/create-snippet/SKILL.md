---
name: create-snippet
description: Creates a new snippet file in `snippets/`. Use when asked to create a snippet, add a snippet, or make a new snippet.
---

# Create snippet

Read these files in parallel:

- `${CLAUDE_SKILL_DIR}/references/snippets.md`: authoring conventions, invocation channels, use patterns
- `.claude/standards/prose.md` from the project root: prose conventions for all generated text

## Steps

1. Confirm the slug and full content with the user before writing
2. Write the file to `snippets/<slug>.md`

## Guards

- If `snippets/` does not exist, stop: `❌ No snippets/ directory found.`

## After writing

Remind the user: copy `snippets/<slug>.md` to the toolkit repo and place it in the correct category folder (`snippets/<category>/<name>.md`).
