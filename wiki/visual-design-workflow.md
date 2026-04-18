---
title: Visual design workflow
description: Tiered guide for design and wireframe authoring with Claude Code
---

# Visual design workflow

Three tiers cover the range from prose-only design docs to a fully graphical design source of truth. Pick one per project based on how UI-heavy the work is, whether stakeholders review visuals, and whether a designer is involved. Tiers stack, so moving up does not invalidate work done at a lower tier.

The tier framework sits alongside [Claude Design](claude-design.md), [visual wireframes](visual-wireframes.md), [community skills and plugins](community-skills.md), and [community MCP servers](community-mcp-servers.md). Those pages catalog the tooling. This page decides when to reach for what.

Claude Design, released 2026-04-17, reshapes tiers 1 and 2. It is the default first-party path for Claude subscribers and is included in Pro, Max, Team, and Enterprise plans. See the [Claude Design page](claude-design.md) for capabilities and limits. Stitch is demoted across this document, Claude Design covers the same slot with first-party Claude Code handoff.

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

ASCII and prose stay as source of truth. Add a visual render as a feedback surface for the agent and for human review. Claude Design handles prototypes and design system generation for Claude subscribers. Excalidraw handles agent-driven wireframes when the round-trip canvas loop matters. All derived artifacts, so human edits on them are review annotations rather than source changes.

### Seed shape

Same as tier 0 with two additions. `WIREFRAMES.md` opts into Excalidraw rendering via a top-of-file marker like `<!-- excalidraw: WIREFRAMES.excalidraw -->`. `DESIGN.md` sources its initial content from a Claude Design handoff bundle, then stays human-maintained from there. Stitch remains as a fallback source for users without a Claude subscription.

### Tools

- Claude Design for prototype generation, design system extraction from the codebase, and handoff to Claude Code. Default pick for Claude subscribers. See [Claude Design](claude-design.md).
- Excalidraw canvas server on localhost plus the `yctimlin/mcp_excalidraw` MCP shim, for projects that need an agent to draw, read back, and revise a canvas. See [visual wireframes](visual-wireframes.md) for setup and footguns.
- Playwright MCP for browser-side verification. See [Playwright](community-mcp-servers.md#playwright-microsoft).
- Chrome DevTools MCP for live frontend debugging. See [Chrome DevTools](community-mcp-servers.md#chrome-devtools-google).
- Stitch web app as a free alternative when Claude Design is not available. 350 generations per month on the free tier.

### Skills

- Everything from tier 0
- A frontend design skill to steer visual quality. Pick one of [Impeccable](community-skills.md#pbakausimpeccable), [UI/UX Pro Max](community-skills.md#nextlevelbuilderui-ux-pro-max-skill), or Anthropic's `frontend-design` plugin. Impeccable is the strongest default because of its curated anti-patterns.

### When to pick

- UI is a meaningful part of the product but not the entire product
- Stakeholders want to see layout proposals before code exists
- Design decisions benefit from visual inspection
- A single contributor owns both design and implementation

### Claude Design vs Excalidraw in tier 1

Claude Design and Excalidraw solve different halves of the visual companion problem. Claude Design generates polished prototypes with the team's design system applied, the output is human-facing and stays in Anthropic's web UI. Excalidraw gives the agent a canvas it can read back over MCP, the output is agent-facing and persists as a JSON file in the repo. A project that only needs human review picks Claude Design. A project that needs Claude Code to iterate on wireframes autonomously picks Excalidraw. Few projects need both.

## Tier 2: visual as source of truth

Design happens in a graphical tool. `.claude/DESIGN.md` either regenerates from the graphical source or takes a secondary role as agent-facing summary. Implementation follows the graphical source, either through an MCP round-trip or a one-way handoff bundle. Fits teams with a dedicated designer or projects where design iteration outpaces code changes.

### Seed shape

`.claude/DESIGN.md` becomes a generated artifact. A top-of-file note identifies the upstream source, either a Claude Design project ID or a Figma file URL. Manual edits in the seed carry a warning tag because they will not survive regeneration.

### Tools

- Claude Design with its Claude Code handoff bundle. Default pick for teams without an existing Figma investment and for solo founders or PMs driving design themselves. One-way handoff, no bidirectional sync. See [Claude Design](claude-design.md).
- Figma desktop app with the [Figma Dev Mode MCP](community-skills.md#figma-mcp-and-code-to-canvas) for teams with a dedicated designer already on Figma. Bidirectional sync and Code to Canvas capture.
- Playwright and Chrome DevTools MCPs as in tier 1

### Skills

- Everything from tier 1

### When to pick

- UI is the product or a major differentiator
- A dedicated designer is on the project or will join
- Design review happens in the graphical tool rather than in code
- Design changes more often than implementation

### Claude Design vs Figma in tier 2

Claude Design wins when nobody on the team has a Figma workflow yet. It extracts a design system from the codebase, generates artifacts, and hands off to Claude Code in one instruction, all from an existing Claude subscription. Figma wins when a dedicated designer already owns a Figma file, external collaborators expect Figma for review, or the workflow needs the agent to capture a running Claude Code UI and push it back as editable frames via Code to Canvas. Claude Design's handoff is one-way. Figma's MCP is bidirectional.

## Decision guide

Four questions. Each yes weighs toward a higher tier.

- Is the UI the product rather than a thin interface over a backend?
- Do non-engineers review visual proposals before code exists?
- Is there a dedicated designer, or will there be one?
- Does design iterate independently of code?

Zero or one yes: tier 0. Two or three: tier 1. Four: tier 2. Resist over-tiering early. Moving up is cheap because tiers stack. Moving down means abandoning tooling and confusing collaborators.

## References

- [Claude Design](claude-design.md): first-party hosted design product and handoff bundle
- [Skills strategy](skills-strategy.md): how to decide between workflow and domain-knowledge skills
- [Visual wireframes](visual-wireframes.md): Excalidraw research and setup for the tier 1 wireframe companion
- [Community skills and plugins](community-skills.md): catalog of frontend design skills and integrations
- [Community MCP servers](community-mcp-servers.md): catalog of MCPs referenced across all tiers
