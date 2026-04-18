---
title: Claude Design
description: Anthropic's hosted design product, its capabilities, and how it hands off to Claude Code
---

# Claude Design

[Claude Design](https://claude.ai/design) is Anthropic's first-party design product from the Anthropic Labs team. It turns text prompts and uploaded references into prototypes, wireframes, mockups, pitch decks, and one-pagers, then packages the result as a handoff bundle that Claude Code consumes in a single instruction. Released 2026-04-17 and powered by Opus 4.7.

This page covers what Claude Design does, how to use it, and how it fits alongside Claude Code. For where it sits in the broader design tier framework, see [visual design workflow](visual-design-workflow.md).

## Status

Research preview. Rolled out gradually to Claude Pro, Max, Team, and Enterprise subscribers starting 2026-04-17. On Enterprise plans, an admin enables it in Organization settings. No separate charge. Usage draws from existing subscription limits with optional extra allowance.

Hosted web app only. No API, no MCP server, no desktop app, no local surface. This shapes how it slots into agent-driven workflows, see [limitations](#limitations) below.

## Capabilities

### Input surfaces

- Text prompts in the conversational editor
- Document uploads in DOCX, PPTX, XLSX
- Image uploads for visual references
- Codebase references, Claude reads repo files to pull in existing components and tokens
- Web capture for scraping live pages as style or layout references

### Output formats

- Internal share URL with org-scoped view-only or edit access
- Saved folder inside Claude Design for later iteration
- PDF export
- PPTX export
- Canva export that lands as a fully editable, collaborative Canva project
- Standalone HTML export for self-hosted prototypes
- Handoff bundle for Claude Code, see [Claude Code handoff](#claude-code-handoff)

### Artifact types

- Interactive prototypes with navigation between frames
- Static wireframes and mockups
- Pitch decks and presentation slides
- One-pagers and marketing collateral
- Code-powered interactive experiences rendered in the browser

### Design system extraction

During onboarding, Claude Design reads a connected codebase and any uploaded design files to build a team-wide design system. It captures colors, typography, and component patterns. Every subsequent project applies the extracted system by default, so output stays consistent without manual token entry. Re-running onboarding updates the stored system.

### Refinement modes

- Conversational edits in the chat pane
- Inline comments pinned to canvas regions
- Direct manipulation with drag, resize, and property editing
- Custom adjustment controls for reusable tweaks like palette shifts or density changes

### Collaboration

Projects belong to an organization, not an individual. Team members get view-only or edit access per project. Comments and edits sync live.

## How to use it

### First run

Connect a codebase and any existing design files during onboarding. Claude Design extracts a design system and stores it against the organization. Without this step, output falls back to generic defaults and the handoff to Claude Code loses fidelity.

### Daily loop

Describe the artifact in one or two sentences. Claude Design produces a first pass. Refine with conversational edits for structural changes, inline comments for targeted fixes, and direct manipulation for spatial nudges. Export only after the artifact is review-ready, not during exploration.

### Claude Code handoff

When a design is implementation-ready, Claude Design packages a handoff bundle and surfaces a single instruction to paste into Claude Code. The bundle carries the design system, the artifact specification, and asset references. Claude Code ingests the bundle and implements against it without re-deriving tokens or layout.

This is a one-way handoff. Code changes do not flow back to Claude Design, and designer edits after handoff do not propagate to an in-progress Claude Code session. Treat the handoff as a snapshot, not a sync.

## When to use Claude Design

Pick Claude Design when:

- The project has UI but no dedicated designer
- Stakeholders review visuals before code exists
- The team already pays for Claude Pro, Max, Team, or Enterprise
- Output needs to land in Canva, PDF, or PPTX for external distribution
- The handoff bundle to Claude Code is the intended implementation path

Skip Claude Design when:

- A dedicated designer owns the source of truth in Figma, Figma's MCP and Code to Canvas round-trip better
- The workflow needs an agent to draw on a canvas and read back what it drew, use Excalidraw with `mcp_excalidraw` instead, see [visual wireframes](visual-wireframes.md)
- The project is CLI-only or backend-only, prose in `DESIGN.md` is enough
- Output needs to live outside Anthropic's ecosystem for licensing or vendor reasons

## Limitations

- **No MCP, no API**: agents cannot read or write Claude Design projects programmatically. Hand-off is human-mediated through the UI copy instruction.
- **One-way sync**: the handoff bundle is a snapshot. Design edits after handoff do not update the in-progress implementation.
- **Hosted only**: projects live on Anthropic's infrastructure. No self-host path for air-gapped environments.
- **Research preview**: feature surface and quotas change without notice. Pin critical flows to stable export formats like PDF or PPTX.
- **Design system re-extraction**: updating the stored design system means re-running onboarding. There is no incremental token update surface.
- **Enterprise gating**: admins must enable the feature per organization. New users see nothing until that switch flips.

## References

- [Introducing Claude Design by Anthropic Labs](https://www.anthropic.com/news/claude-design-anthropic-labs)
- [TechCrunch launch coverage](https://techcrunch.com/2026/04/17/anthropic-launches-claude-design-a-new-product-for-creating-quick-visuals/)
- [VentureBeat on the Figma comparison](https://venturebeat.com/technology/anthropic-just-launched-claude-design-an-ai-tool-that-turns-prompts-into-prototypes-and-challenges-figma)
- [Visual design workflow](visual-design-workflow.md): tier framework that places Claude Design against Figma, Stitch, and Excalidraw
- [Community skills and plugins](community-skills.md): third-party design skills and adjacent integrations
