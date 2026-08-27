---
description: Enforce frontmatter, body shape, and voice for governance rule files
paths:
  - '.claude/rules/**/*.md'
---

# Rule authoring standards

## Numbering

- Name a rule `.claude/rules/<subdirectory>/<n>-<slug>.md`. Give every rule a numeric prefix and keep the slug to one to three kebab words.
- Treat `000-899` as reserved for a rule set that ships to targets, `000-599` across the shared subdirectories and `600-899` held for ones it has not added.
- Number a rule the project authored itself in `900-999` and write it at `.claude/rules/project/<subdirectory>/<n>-<slug>.md`.
- Do not take a reserved number for a project-authored rule because nothing installed holds it today. A later release can ship into it.

## Body

- State one directive per bullet in imperative voice. Do not explain the reasoning behind a rule.
- Cut a rule that resists crisp one-line phrasing.
- Do not restate a rule a sibling rule or `CLAUDE.md` already owns. Point once.

## Authority

- Follow the rule-authoring standard for rule frontmatter, body shape, and voice. It is the single source. Read it with `aitk standards rule`.
- Read it before writing or editing a rule. Do not work the shape from memory.
