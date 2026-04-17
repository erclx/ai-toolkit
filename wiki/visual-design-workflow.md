---
title: Visual design workflow
description: Tiered guide for design and wireframe authoring with Claude Code
---

# Visual design workflow

Three tiers cover the range from prose-only design docs to a fully graphical design source of truth. Pick one per project based on how UI-heavy the work is, whether stakeholders review visuals, and whether a designer is involved. Tiers stack, so moving up does not invalidate work done at a lower tier.

The tier framework sits alongside [visual wireframes](visual-wireframes.md), [community skills and plugins](community-skills.md), and [community MCP servers](community-mcp-servers.md). Those pages catalog the tooling. This page decides when to reach for what.

## Tier 0: prose only

The default. `.claude/DESIGN.md` holds visual intent as prose tokens. `.claude/WIREFRAMES.md` holds ASCII layouts. Claude Code reads both and writes the implementation. Works for CLI tools, internal dashboards, admin panels, and backend-focused projects.

### Seed shape

The toolkit seed in `tooling/claude/seeds/.claude/` ships this tier by default. No changes needed.

### Tools

- None beyond Claude Code itself
- Playwright CLI optional for verifying form submissions and interactive surfaces. See [`claude-ui-test`](../claude/skills/claude-ui-test/SKILL.md).

### Skills

- `toolkit:claude-ui-test` for e2e test generation after UI changes
- `toolkit:claude-ux-audit` for UX gap detection on existing surfaces
- Anthropic's `frontend-design` plugin optional for light visual steering

### When to pick

- UI is not the core product
- Design decisions are few and can be written as sentences
- No designer on the project
- Stakeholders review code or behavior rather than mockups

## Tier 1: visual companion

ASCII and prose stay as source of truth. Add a visual render as a feedback surface for the agent and for human review. Excalidraw handles wireframes. Stitch handles design system generation. Both remain derived artifacts, so human edits on them are review annotations rather than source changes.

### Seed shape

Same as tier 0 with two additions. `WIREFRAMES.md` opts into Excalidraw rendering via a top-of-file marker like `<!-- excalidraw: WIREFRAMES.excalidraw -->`. `DESIGN.md` can source its initial content from a Stitch export and then stay human-maintained from there.

### Tools

- Excalidraw canvas server on localhost plus the `yctimlin/mcp_excalidraw` MCP shim. See [visual wireframes](visual-wireframes.md) for setup and footguns.
- Playwright MCP for browser-side verification. See [Playwright](community-mcp-servers.md#playwright-microsoft).
- Chrome DevTools MCP for live frontend debugging. See [Chrome DevTools](community-mcp-servers.md#chrome-devtools-google).
- Stitch web app for design generation and `DESIGN.md` export. Free tier covers 350 generations per month.

### Skills

- Everything from tier 0
- A frontend design skill to steer visual quality. Pick one of [Impeccable](community-skills.md#pbakausimpeccable), [UI/UX Pro Max](community-skills.md#nextlevelbuilderui-ux-pro-max-skill), or Anthropic's `frontend-design` plugin. Impeccable is the strongest default because of its curated anti-patterns.

### When to pick

- UI is a meaningful part of the product but not the entire product
- Stakeholders want to see layout proposals before code exists
- Design decisions benefit from visual inspection
- A single contributor owns both design and implementation

## Tier 2: visual as source of truth

Design happens in a graphical tool. `.claude/DESIGN.md` either regenerates from the graphical source or takes a secondary role as agent-facing summary. The agent reads designs through an MCP and implements against them. Fits teams with a dedicated designer or projects where design iteration outpaces code changes.

### Seed shape

`.claude/DESIGN.md` becomes a generated artifact. A top-of-file note identifies the upstream source, either a Stitch project ID or a Figma file URL. Manual edits in the seed carry a warning tag because they will not survive regeneration.

### Tools

- Figma desktop app with the [Figma Dev Mode MCP](community-skills.md#figma-mcp-and-code-to-canvas) for Figma-sourced projects
- Stitch plus the `google-labs-code/stitch-skills` MCP for Stitch-sourced projects. See [Google Stitch and DESIGN.md](community-skills.md#google-stitch-and-designmd).
- Playwright and Chrome DevTools MCPs as in tier 1

### Skills

- Everything from tier 1
- `stitch-design` and `design-md` from `google-labs-code/stitch-skills` when using Stitch
- `taste-skill` with its `stitch-skill` sub-skill for `DESIGN.md` ingestion on Stitch-sourced projects

### When to pick

- UI is the product or a major differentiator
- A dedicated designer is on the project or will join
- Design review happens in the graphical tool rather than in code
- Design changes more often than implementation

## Decision guide

Four questions. Each yes weighs toward a higher tier.

- Is the UI the product rather than a thin interface over a backend?
- Do non-engineers review visual proposals before code exists?
- Is there a dedicated designer, or will there be one?
- Does design iterate independently of code?

Zero or one yes: tier 0. Two or three: tier 1. Four: tier 2. Resist over-tiering early. Moving up is cheap because tiers stack. Moving down means abandoning tooling and confusing collaborators.

## References

- [Skills strategy](skills-strategy.md): how to decide between workflow and domain-knowledge skills
- [Visual wireframes](visual-wireframes.md): Excalidraw research and setup for the tier 1 wireframe companion
- [Community skills and plugins](community-skills.md): catalog of frontend design skills and integrations
- [Community MCP servers](community-mcp-servers.md): catalog of MCPs referenced across all tiers
