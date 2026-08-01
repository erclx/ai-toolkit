---
name: create-standard
description: Creates a new standard file in `standards/` (toolkit repo) or `.claude/standards/` (target project). Use when asked to create a standard, add a standard, or write a new authoring convention. Do NOT use to edit an existing standard.
---

# Create standard

Read these files in parallel:

- `${CLAUDE_SKILL_DIR}/references/standard.md`: the meta-standard for a standard's shape, frontmatter, and structure
- `.claude/standards/prose.md` from the project root: prose conventions for all generated text

Read a standard from `${CLAUDE_SKILL_DIR}/../../standards/` instead when the project has no `.claude/standards/`.

## Guards

- If neither `standards/` nor `.claude/standards/` exists, stop: `❌ No standards/ or .claude/standards/ directory found.`

## Steps

1. Resolve the write surface: `standards/` at the project root if present, the toolkit's own authoring source. Otherwise `.claude/standards/`, a target project's installed copy.
2. Draft the standard from the user's description, following `standard.md` for frontmatter, headings, and structure
3. Confirm the slug and full content with the user before writing
4. Write the file to `<surface>/<slug>.md`

## After writing

Emit the full path on its own line.

- Root surface (`standards/`): this is the toolkit's authoring source. Remind the user to run `bun run check` to regenerate the consumed copy under `.claude/standards/` and the `standards/index.md` entry, and to add a row to the standards table in `.claude/context/standards.md`.
- `.claude/standards/` surface: the file is project-local. `aitk standards sync` leaves it alone, since sync only updates filenames it recognizes from the toolkit. Remind the user to copy it to the toolkit repo, under `standards/<slug>.md`, if it should ship to every project.
