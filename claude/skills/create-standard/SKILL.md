---
name: create-standard
description: Creates a new standard file in `standards/`. Use when asked to create a standard, add a standard, or write a new authoring convention. Do NOT use to edit an existing standard.
---

# Create standard

Read these files from the project root in parallel:

- `.claude/standards/standard.md`: the meta-standard for a standard's shape, frontmatter, and structure
- `.claude/standards/prose.md`: prose conventions for all generated text

## Guards

- If `.claude/standards/standard.md` is not present, stop: `❌ .claude/standards/standard.md not found. Run aitk standards install first.`
- If `standards/` does not exist, stop: `❌ No standards/ directory found.`

## Steps

1. Draft the standard from the user's description, following `standard.md` for frontmatter, headings, and structure
2. Confirm the slug and full content with the user before writing
3. Write the file to `standards/<slug>.md`

## After writing

Emit the full path on its own line: `standards/<slug>.md`. Remind the user to run `bun run check` to regenerate the consumed copy under `.claude/standards/` and the `standards/index.md` entry, and to add a row to the standards table in `.claude/context/standards.md`.
