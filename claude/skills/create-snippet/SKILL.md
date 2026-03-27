---
name: create-snippet
description: Creates a new snippet file in snippets/. Use when asked to create a snippet, add a snippet, or make a new snippet.
---

# Create snippet

Read these files from the project root in parallel:

- `standards/snippets.md`: authoring conventions, invocation channels, use patterns
- `standards/prose.md`: prose conventions for all generated text

## Steps

1. Confirm the slug and full content with the user before writing
2. Write the file to `snippets/<slug>.md`

## Guards

- If `standards/snippets.md` is not present, stop: `❌ standards/snippets.md not found. Run aitk standards install first.`
- If `snippets/` does not exist, stop: `❌ No snippets/ directory found.`

## After writing

Remind the user: copy `snippets/<slug>.md` to the toolkit repo and place it in the correct category folder (`snippets/<category>/<name>.md`).
