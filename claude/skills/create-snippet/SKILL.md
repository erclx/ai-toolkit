---
name: create-snippet
description: Creates a new snippet file in `snippets/` or `.claude/snippets/`. Use when asked to create a snippet, add a snippet, write a reusable prompt, or make a new snippet. Do NOT use to edit an existing snippet.
---

# Create snippet

Creates one snippet file. Read these files in parallel:

- `.claude/standards/markdown.md` from the project root: banned words, punctuation, and formatting for all generated text
- The `write-human` skill: voice, rhythm, and sentence construction for all generated text
- `${CLAUDE_SKILL_DIR}/references/snippets.md`: authoring conventions, invocation channels, use patterns

Read a standard from `${CLAUDE_SKILL_DIR}/../../standards/` instead when the project does not have it.

## Guards

- If neither `snippets/` nor `.claude/snippets/` exists, stop: `❌ No snippets/ or .claude/snippets/ directory found.`

## Steps

1. Resolve the write surface: `snippets/` at the root if present, which is the toolkit's own authoring source. Otherwise `.claude/snippets/`, a target project's installed copy.
2. Draft the content from the user's description. The snippet reference governs structure, invocation, and authoring conventions.
3. Confirm the slug and full content with the user before writing
4. Write the file to `<surface>/<category>/<slug>.md`, or to `<surface>/<slug>.md` when the snippet takes no category

## After writing

Emit the full path on its own line.

- Root surface: this is the toolkit's authoring source. Remind the user to run `bun run check` to regenerate the consumed copy under `.claude/`.
- `.claude/` surface: the file is project-local. `aitk snippets sync` leaves it alone, since sync only updates filenames it recognizes from the toolkit. Remind the user to copy it to the toolkit repo, under `snippets/<category>/<name>.md`, if it should ship to every project.
