---
description: Route skill edits to the authoring standard and the requirement consult-first workflow
paths:
  - '.claude/skills/**/SKILL.md'
  - 'claude/skills/**/SKILL.md'
  - '.claude/skills/**/REQUIREMENT.md'
  - 'claude/skills/**/REQUIREMENT.md'
---

# Skill standards

## Before editing

- Read the skill's sibling `REQUIREMENT.md` when one exists. If the change closes no gap it states, change the requirement first or drop the change.

## After editing

- Re-read a skill body this session edited before invoking that skill again in the same session
- Do not read a resolved file path in a held body as evidence the body is current

## Authority

- Follow `standards/skill.md` inside the aitk plugin for skill structure, frontmatter fields, invocation rules, and the shape a `REQUIREMENT.md` states. It is the single source.
- Report it rather than proceeding silently when that file does not resolve. It ships with the plugin and this rule ships with the CLI, so a project that installed governance alone does not have it.
