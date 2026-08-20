---
description: Enforce frontmatter, body shape, and voice for governance rule files
paths:
  - '.claude/rules/**/*.md'
---

# Rule authoring standards

## Numbering

- Name a rule `.claude/rules/<subdirectory>/<n>-<slug>.md`, taking a number that collides with neither the project's rules nor any installed shared set.
- Give every rule a numeric prefix and keep the slug to one to three kebab words.

## Body

- State one directive per bullet in imperative voice. Do not explain the reasoning behind a rule.
- Cut a rule that resists crisp one-line phrasing.
- Do not restate a rule a sibling rule or `CLAUDE.md` already owns. Point once.

## Authority

- Follow `standards/rule.md` inside the aitk plugin for rule frontmatter, body shape, and voice. It is the single source.
- Report it rather than proceeding silently when that file does not resolve. It ships with the plugin and this rule ships with the CLI, so a project that installed governance alone does not have it.
- Read it before writing or editing a rule. Do not work the shape from memory.
