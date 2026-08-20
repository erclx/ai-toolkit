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

- Follow `standards/wireframes.md` inside the aitk plugin for layout and interaction intent: ASCII layout, region labels, variants, copy, and what moves to `.claude/context/`. It is the single source.
- Report it rather than proceeding silently when that file does not resolve. It ships with the plugin and this rule ships with the CLI, so a project that installed governance alone does not have it.
- Read it before adding or revising a surface.
