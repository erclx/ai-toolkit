---
title: Indexes
description: Folder index.md system, frontmatter contract, when to adopt
category: Domain references
---

# Indexes system

## Overview

Folders that an agent browses to pick a document carry an `index.md`. The CLI walks the project, reads each folder's frontmatter and its siblings' `title` and `description` fields, and rewrites `index.md` so the catalog stays in sync with the files. Agents read one file to know what every sibling does instead of opening each one.

The system is opt-in per folder. A project that does not need browseable catalogs gets no value from adopting it.

## When to adopt

Adopt for folders an agent browses to pick a document. Skip for code folders, generated docs, single-file directories, and folders where files resolve by path convention.

Concrete fit:

- Markdown-heavy reference folders (docs sites, knowledge bases, prompt libraries, design tokens)
- Folders with three or more sibling markdown files that have distinct purposes
- Catalogs a skill or script needs to discover at runtime instead of hardcoding names

Concrete miss:

- `src/`, `lib/`, or any code folder. Agents traverse code by import graph, not by description
- Generated docs (API references, changelogs). The frontmatter cost outweighs the navigation gain
- A `docs/` with one `README.md` and a couple of supporting files. `ls` is cheaper

## Frontmatter contract

Every `index.md` carries `title` and `subtitle` in its own frontmatter. Every sibling `*.md` carries `title` and `description`. The walker fails the folder when any sibling lacks either field. This is all-or-nothing per folder by design: a partial migration creates an `index.md` that hard-errors on the next regen.

Optional `category` on a sibling groups it under an H2 heading in the rendered index. When any sibling carries `category`, the walker switches to grouped mode for the whole folder.

## Opt-out

Add `auto: false` to a folder's `index.md` frontmatter to keep it hand-edited. The walker preserves the file untouched. Use this when the folder needs grouping or prose the walker cannot produce from frontmatter alone.

## Maintenance

Two integration points keep `index.md` files current after edits.

`lint-staged` is the recommended option for git-driven projects:

```json
{
  "**/*.md": "aitk indexes regen"
}
```

`lint-staged` appends changed paths as trailing arguments. The CLI walks up from each path to the nearest indexed ancestor and regenerates only affected folders.

A Claude Code `PostToolUse` hook on `Edit` and `Write` matching `**/*.md` covers projects that prefer agent-driven regeneration. The hook runs the same command. Either path is opt-in per project. The toolkit ships no default.

## Bootstrap

Use the `indexes-install` plugin skill to add the system to a project that does not have it yet. The skill scans for markdown-heavy folders, drafts `title` and `description` for each sibling from its first heading and paragraph, scaffolds `index.md` per chosen folder, and runs `aitk indexes regen --dry-run` to validate before writing.

The skill is the only supported migration path. The CLI does not own bootstrap because authoring readable `description` text is judgment work, not a deterministic transformation.

## Command surface

See `agents.md` for the `aitk indexes regen` invocation contract: flags, exit codes, and JSON output shape.

## Related

- `agents.md`: CLI flags, exit codes, JSON output
- `scripts.md`: `lib/index.sh` function reference for regeneration logic
- `claude/skills/indexes-install/`: bootstrap skill source
