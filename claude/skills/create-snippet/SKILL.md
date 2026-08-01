---
name: create-snippet
description: Creates a new snippet file in `snippets/` (toolkit repo) or `.claude/snippets/` (target project). Use when asked to create a snippet, add a snippet, or make a new snippet.
---

# Create snippet

Read these files in parallel:

- `${CLAUDE_SKILL_DIR}/references/snippets.md`: authoring conventions, invocation channels, use patterns
- `.claude/standards/prose.md` from the project root: prose conventions for all generated text

Read a standard from `${CLAUDE_SKILL_DIR}/../../standards/` instead when the project does not have it.

## Guards

- If neither `snippets/` nor `.claude/snippets/` exists, stop: `❌ No snippets/ or .claude/snippets/ directory found.`

## Steps

1. Resolve the write surface: `snippets/` at the project root if present, the toolkit's own authoring source. Otherwise `.claude/snippets/`, a target project's installed copy.
2. Confirm the slug and full content with the user before writing
3. Write the file to `<surface>/<slug>.md`

## After writing

- Root surface (`snippets/`): this is the toolkit's authoring source. Remind the user `bun run check` regenerates the consumed copy under `.claude/snippets/`.
- `.claude/snippets/` surface: the file is project-local. `aitk snippets sync` leaves it alone, since sync only updates filenames it recognizes from the toolkit. Remind the user to copy it to the toolkit repo, under `snippets/<category>/<name>.md`, if it should ship to every project.
