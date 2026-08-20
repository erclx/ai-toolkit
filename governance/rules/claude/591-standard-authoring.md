---
description: Enforce shape, scope, and success criterion for authoring convention files
paths:
  - '.claude/standards/**/*.md'
  - 'standards/**/*.md'
---

# Standard authoring standards

## The scope statement

- Govern one document type per standard, or one attribute across every document.
- Open with a `## Scope` section naming what the standard governs and a `Does not govern:` list, placed above the shape rules.
- Put the governed path in backticks in the first sentence, anchored deep enough to resolve from a project root. Keep an attribute standard's first sentence free of backticks and say in it that it governs an attribute.
- Give each `Does not govern:` entry an excluded concern and the owner it goes to. Cut an entry naming no owner.
- Declare a yield, an exemption, or a handoff from both sides of the boundary.

## Authority

- Follow `standards/standard.md` inside the aitk plugin for a standard's frontmatter, shape, scope, and success criterion. It is the single source.
- Report it rather than proceeding silently when that file does not resolve. It ships with the plugin and this rule ships with the CLI, so a project that installed governance alone does not have it.
- Read it before writing or editing a standard. Do not work the shape from memory.
