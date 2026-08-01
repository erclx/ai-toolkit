---
title: Diagram reference
description: Conventions for Mermaid diagrams in .claude/DIAGRAMS.md
---

# Diagram reference

Applies to Mermaid diagrams in `.claude/DIAGRAMS.md`. Goal: diagrams that render cleanly in narrow-column renderers (VS Code preview, GitHub PR view, Cursor) and read pedagogically without surrounding prose.

## Layout

- Declare `flowchart TB` by default. Mermaid ignores a subgraph's direction whenever that subgraph links outward, and an architecture diagram links across its subgraphs as the normal case, so top-bottom is a declaration rather than a guarantee.
- Restructure a diagram that renders diagonal or left-to-right. Repeating the direction keyword does not fix it.
- Render a component, context, or pipeline diagram taller than wide. A `sequenceDiagram` is wide by construction and is exempt.
- Do not let independent nodes render in a row. A row of siblings reads as a sequential chain and asserts a pipeline the system does not have.
- Do not converge many edges on one node from one side. A crossing bundle is unreadable whatever it encodes.
- Keep node labels short. Three or four words max. Detail goes in the paragraph below the diagram.
- Use `<br/>` for a second short line on a node when the label is two ideas, never for a sentence.
- Subgraphs are for grouping unrelated lanes (offline versus online, browser versus server). Do not subgraph a single linear flow.

## Budgets

- Hold a diagram to roughly 5 to 10 nodes. Split it past 15.
- Watch edge count harder than node count. It binds first, and a diagram whose edges outnumber its nodes is already too dense to read.
- Treat a diagram that cannot be described in one sentence as two diagrams.
- Warn rather than refuse on a budget, and name the split that would fix it. These numbers come from published Mermaid practice rather than from a measurement in this repository, so a hard refusal on them will be wrong sometimes and unarguable when it is.

## Accessibility

- Give every diagram `accTitle` and `accDescr`. `accTitle` names what the diagram answers. `accDescr` states the structure in one sentence for a reader who cannot see the render.

## Verification

- Judge a diagram from its rendered image, not from its source. Direction, sibling rows, and edge bundles are visible only in the output.
- Render to PNG. An SVG export reads back as markup with no recoverable spatial meaning.
- Apply four tests as a reviewer, the same ones the author applied: direction held, no sibling row reading as a chain, no crossing edge bundle, taller than wide outside a sequence diagram.
- State which verification was skipped when no renderer is available. A diagram written without a render is still shippable, and one reported as verified without a render is not.

## Narrative

- Build a narrative arc across the file, not a parallel list of unrelated views. Start with the whole system in five or six boxes. Drill into one phase per section.
- Order sections chronologically when possible: framing, then setup, then a query travels through, then measurement.
- One H2 per diagram. The H2 names what the diagram answers, not what it shows ("How the corpus gets populated", not "Corpus ingestion").

## Explanation

- One to three short paragraphs below each diagram. Plain English, pedagogical, no marketing copy.
- Lead with what the diagram shows. Follow with why this shape was chosen and what alternative was rejected, when the choice was non-obvious.
- Reference one or two specific code paths the reader can open. Do not enumerate every file.
- Do not duplicate prose between sections. Each paragraph earns its line.

## Maintenance

- When the system changes (new layer, new provider, new deploy posture), audit `.claude/DIAGRAMS.md` in the same PR. A diagram showing a defunct host or library is worse than no diagram.
- Mermaid blocks are inside fenced code, so the prose-standards hook ignores them. The explanation paragraph below is still prose. Follow `standards/prose.md`.
