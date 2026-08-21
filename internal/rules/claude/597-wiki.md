---
description: Enforce placement, sourcing, and voice for wiki reference pages
paths:
  - 'wiki/**/*.md'
---

# Wiki page standards

## Placement

- Write a page here only when its subject is owned outside this repo. Route anything about how this repo works to `docs/`, `.claude/context/`, or a skill body.
- File the page by owner: `wiki/claude/` for Anthropic, `wiki/tools/` for another vendor, `wiki/concepts/` where no single vendor owns the subject.
- Treat `wiki/concepts/rule-writing-vocabulary.md` as the one recorded exception to the owner test.

## Sourcing

- Close the intro paragraph with a `Source:` sentence naming the owner. Link the canonical page where one exists, and name the owner alone where the subject has no single URL.
- Fetch current information through the `claude-code-guide` agent when the subject is Claude Code. Do not work from training knowledge.
- Propose an addition or correction and wait for confirmation. Do not write to a wiki file unasked.

## Voice

- Write tool-general reference prose. Rewrite experiment narrative into a general statement before committing.
