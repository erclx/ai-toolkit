---
description: Route .claude/ARCHITECTURE.md edits to the architecture standard for system decisions and risks
paths:
  - '.claude/ARCHITECTURE.md'
---

# Architecture standards

## Decisions

- Give each decision its own H3 under `## Key technical decisions`, naming what it chose and the alternative it passed over.
- Keep line-by-line function behavior and full type definitions out.

## Verification anchors

- Close a decision citing a measured number with `Measured at <short-sha> on <YYYY-MM-DD>.` Leave a decision citing none unanchored.
- Refresh that anchor whenever the number is re-read, whether or not it moved.

## Authority

- Follow `.claude/standards/architecture.md` for the overview, named decision entries, and risks. It is the single source.
