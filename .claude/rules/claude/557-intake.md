---
description: Route .claude/intake/ edits to the intake standard for the item format, the answer contract, and ordinal naming
paths:
  - '.claude/intake/**'
---

# Intake standards

## Folder name

- Name a new dump `.claude/intake/<nn>-<slug>/`, a two-digit zero-padded ordinal followed by a kebab-case slug. Take the ordinal from the highest one already present across both `.claude/intake/` and `.claude/groundwork/`, incremented. Never renumber an existing folder.

## The answer contract

- Never fill a `You:` slot and never infer a disposition from an empty one. Empty means unread, never agreement.
- Report unread items by count on a resume pass. Do not decide one.

## Authority

- Follow the intake standard for the folder layout, frontmatter and dating, the item format, and retrieval. It is the single source. Read it with `aitk standards intake`.
