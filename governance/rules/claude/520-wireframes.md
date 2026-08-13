---
description: Route .claude/wireframes edits to the wireframe standard for layout and interaction intent
paths:
  - '.claude/wireframes/**'
---

# Wireframe standards

## Layout and intent

- Draw each surface as an ASCII block inside a `plaintext` fence, one fence per distinct layout.
- Label a region with its role. Never label one with a class name, a token name, or a computed value.
- Carry on-screen copy verbatim, and mark copy the surface templates.
- State interaction intent, never the mechanism behind it. Send algorithms, handlers, and thresholds to a `.claude/context/` entry.
- Update a surface's wireframe in the same pull request that changes its layout or its interaction.

## Authority

- Follow `.claude/standards/wireframes.md` for layout and interaction intent: ASCII layout, region labels, variants, copy, and what moves to `.claude/context/`. It is the single source.
- Read it before adding or revising a surface.
