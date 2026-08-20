---
description: Route .claude/DESIGN.md edits to the design standard for visual intent and token tables
paths:
  - '.claude/DESIGN.md'
---

# Design standards

## Tokens

- Describe a token as intent rather than as a computed value.
- Keep CSS classes, component filenames, and prop names out.
- Carry a token system as a table, one row per token, and a component rule as a short bullet.
- Keep the token table headers verbatim.
- Record a non-obvious omission, such as no motion or no custom icons.

## Authority

- Follow `standards/design.md` inside the aitk plugin for visual intent, the token tables, and the render contract. It is the single source.
- Report it rather than proceeding silently when that file does not resolve. It ships with the plugin and this rule ships with the CLI, so a project that installed governance alone does not have it.
