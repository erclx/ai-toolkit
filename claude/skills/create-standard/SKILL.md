---
name: create-standard
description: Creates a new standard file in `standards/` or `.claude/standards/`, or a new snippet file in `snippets/` or `.claude/snippets/`. Use when asked to create a standard, add a standard, write a new authoring convention, create a snippet, add a snippet, or make a new snippet. Do NOT use to edit an existing standard or snippet.
---

# Create standard

Creates one authoring file on either surface. Read the user's request for which artifact they asked for, standard or snippet, and carry that choice through every step below. Ask only when the request names neither.

Read these files in parallel:

- `.claude/standards/prose.md` from the project root: prose conventions for all generated text
- `.claude/standards/standard.md` from the project root, for a standard: the meta-standard for shape, frontmatter, and structure
- `${CLAUDE_SKILL_DIR}/references/snippets.md`, for a snippet: authoring conventions, invocation channels, use patterns

Read a standard from `${CLAUDE_SKILL_DIR}/../../standards/` instead when the project does not have it.

## Guards

- For a standard, if neither `standards/` nor `.claude/standards/` exists, stop: `❌ No standards/ or .claude/standards/ directory found.`
- For a snippet, if neither `snippets/` nor `.claude/snippets/` exists, stop: `❌ No snippets/ or .claude/snippets/ directory found.`

## Steps

1. Resolve the write surface for the chosen artifact: the root folder (`standards/` or `snippets/`) if present, the toolkit's own authoring source. Otherwise the `.claude/` folder, a target project's installed copy.
2. Draft the content from the user's description. A standard follows `standard.md` for frontmatter, headings, and structure.
3. Confirm the slug and full content with the user before writing
4. Write the file to `<surface>/<slug>.md`

## After writing

Emit the full path on its own line.

- Root surface: this is the toolkit's authoring source. Remind the user to run `bun run check` to regenerate the consumed copy under `.claude/`. For a standard, that pass also regenerates the `standards/index.md` entry, and the user adds a row to the standards table in `.claude/context/standards.md`.
- `.claude/` surface: the file is project-local. `aitk standards sync` and `aitk snippets sync` leave it alone, since sync only updates filenames it recognizes from the toolkit. Remind the user to copy it to the toolkit repo, under `standards/<slug>.md` or `snippets/<category>/<name>.md`, if it should ship to every project.
