---
name: create-standard
description: Creates a new standard file in `standards/` or `.claude/standards/`. Use when asked to create a standard, add a standard, or write a new authoring convention. Do NOT use to edit an existing standard.
---

# Create standard

Creates one standard file. Read these files in parallel:

- `.claude/standards/prose.md` from the project root: voice and banned words for all generated text
- `.claude/standards/markdown.md` from the project root: punctuation and formatting for all generated text
- `.claude/standards/standard.md` from the project root: the meta-standard for shape, frontmatter, and structure

Read a standard from `${CLAUDE_SKILL_DIR}/../../standards/` instead when the project does not have it.

## Guards

- If neither `standards/` nor `.claude/standards/` exists, stop: `❌ No standards/ or .claude/standards/ directory found.`

## Steps

1. Resolve the write surface: `standards/` at the root if present, which is the toolkit's own authoring source. Otherwise `.claude/standards/`, a target project's installed copy.
2. Draft the content from the user's description. The meta-standard governs frontmatter, headings, and structure.
3. Confirm the slug and full content with the user before writing
4. Write the file to `<surface>/<slug>.md`

## After writing

Emit the full path on its own line.

- Root surface: this is the toolkit's authoring source. Remind the user to run `bun run check` to regenerate the consumed copy under `.claude/`. That pass also regenerates the `standards/index.md` entry, and the user adds a row to the standards table in `.claude/context/standards.md`.
- `.claude/` surface: the file is project-local. `aitk standards sync` leaves it alone, since sync only updates filenames it recognizes from the toolkit. Remind the user to copy it to the toolkit repo, under `standards/<slug>.md`, if it should ship to every project.
