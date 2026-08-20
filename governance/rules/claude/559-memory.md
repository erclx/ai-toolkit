---
description: Route .claude/memory/ edits to the memory standard for the filename, frontmatter, body shape, and lifecycle
paths:
  - '.claude/memory/**'
---

# Memory standards

## Routing

- Write no memory entry for a fact a per-domain context entry already owns.

## The pen

- Never delete a memory entry. Retire one by moving it to an archive under its own name, since the folder is gitignored and a wrong call has no undo.
- Never hand-edit `.claude/memory/index.md`. A hook regenerates it from sibling frontmatter.

## Authority

- Follow `standards/memory.md` inside the aitk plugin for the filename and type prefix, the frontmatter, the body shape per type, links between entries, and the lifecycle. It is the single source.
- Report it rather than proceeding silently when that file does not resolve. It ships with the plugin and this rule ships with the CLI, so a project that installed governance alone does not have it.
