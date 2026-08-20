---
description: Route .claude/intake/ edits to the intake standard for the item format, the answer contract, and numbering
paths:
  - '.claude/intake/**'
---

# Intake standards

## The answer contract

- Never fill a `You:` slot and never infer a disposition from an empty one. Empty means unread, never agreement.
- Report unread items by count on a resume pass. Do not decide one.

## Authority

- Follow `standards/intake.md` inside the aitk plugin for the folder layout, frontmatter and dating, the item format, and retrieval. It is the single source.
- Report it rather than proceeding silently when that file does not resolve. It ships with the plugin and this rule ships with the CLI, so a project that installed governance alone does not have it.
