---
title: Design reference
description: Shape and content rules for .claude/DESIGN.md
---

# Design reference

Applies to `.claude/DESIGN.md`. Captures visual intent and the decisions behind how things look, not a style guide, component spec, or framework reference. Update when a visual decision is made or a rule changes.

## What goes in

- Tokens described as intent ("mid gray, muted text"), not computed values. Exact values live in code.
- Layout constraints and sizing rules not obvious from wireframes
- Visual rules a developer could get wrong without guidance
- Non-obvious omissions ("no motion", "no custom icons") that prevent scope creep

## What does not go in

- CSS classes, computed values, component filenames, and prop names. Those live in code.
- UX copy and interaction flows. Those live in the wireframes.
- Anything that needs updating every time the code is refactored

## Format

- Use tables for token systems, one row per token. Use short bullets for component rules, one decision per line.
- Plain English over technical notation. If a section could be removed and the developer would still build correctly from wireframes and code alone, remove it.
- `aitk design render` parses the token tables. Keep table headers and role names intact so the parser can find them.

## Sections

Use `## Personality`, `## Color`, `## Typography`, `## Spacing`, `## Borders`, `## Motion`, and `## Iconography`. The token tables carry fixed headers the renderer reads.
