---
description: Route .claude/plans/ edits to the plan standard for sections, the answer contract, and the archive move
paths:
  - '.claude/plans/**'
  - '.claude/plans-archive/**'
---

# Plan standards

## The answer contract

- Never fill an `- Answer:` slot on behalf of the person who owns it. A blank slot accepts the suggestion at execution time.
- Never ship a question without a `- Suggested:` line. Write `- Suggested: needs your call, <why>` where the answer turns on preference.

## Archiving

- Move a shipped plan to `.claude/plans-archive/`. Never delete one.
- Amend a plan in place when a decision changes. Do not append a second passage narrating the change.

## Authority

- Follow `.claude/standards/plan.md` for the filename and slug, the required sections, the suggested-and-answer contract, and the lifecycle. It is the single source.
