---
description: Route .claude/diagrams edits to the diagrams standard for Mermaid conventions
paths:
  - '.claude/diagrams/**'
  - '.claude/DIAGRAMS.md'
---

# Diagrams standards

## Authority

- Follow `.claude/standards/diagrams.md` for Mermaid diagram layout, budgets, accessibility, verification, and explanation prose. It is the single source.
- A diagram entry carries structure and flow, not implementation. Read the standard before adding or revising a kind.

## Scope

- Write a new diagram to `.claude/diagrams/<kind>.md`, never to `.claude/DIAGRAMS.md`
- Convert a `.claude/DIAGRAMS.md` left by an older install into per-kind entries before editing it
- Refresh only the entries whose source signal moved. Do not rewrite the folder wholesale.
