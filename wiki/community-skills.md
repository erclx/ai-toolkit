---
title: Community skills and plugins
description: Notable third-party skills, official Anthropic plugins, and curated lists
---

# Community skills and plugins

Notable Claude Code skills, plugins, and curated lists from outside this toolkit. Use as a reference for patterns worth adapting into `claude/skills/`. Figures and feature claims are a snapshot from 2026-04-15 and drift fast. Re-verify before copying.

## Official Anthropic plugins

The [anthropics/claude-code](https://github.com/anthropics/claude-code) repo ships first-party plugins under `plugins/`. Install with `/plugin install <name>@anthropics/claude-code`.

- [`frontend-design`](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design): steers UI generation toward intentional typography, hierarchy, and color. Auto-activates on frontend work.
- [`code-review`](https://github.com/anthropics/claude-code/tree/main/plugins/code-review): `/code-review` runs five parallel Sonnet agents across CLAUDE.md compliance, bug detection, history, and comments.
- [`pr-review-toolkit`](https://github.com/anthropics/claude-code/tree/main/plugins/pr-review-toolkit): PR-focused variant of the review flow
- [`security-guidance`](https://github.com/anthropics/claude-code/tree/main/plugins/security-guidance): security-aware authoring guidance
- [`feature-dev`](https://github.com/anthropics/claude-code/tree/main/plugins/feature-dev), [`hookify`](https://github.com/anthropics/claude-code/tree/main/plugins/hookify), [`plugin-dev`](https://github.com/anthropics/claude-code/tree/main/plugins/plugin-dev), [`agent-sdk-dev`](https://github.com/anthropics/claude-code/tree/main/plugins/agent-sdk-dev): meta-plugins for building plugins and skills

A separate repo, [anthropics/claude-code-security-review](https://github.com/anthropics/claude-code-security-review), ships the `/security-review` slash command and a GitHub Action that audits PRs for injection, XSS, and unsafe input handling.

## Third-party skill libraries

### obra/superpowers

[Jesse Vincent's](https://github.com/obra/superpowers) methodology-first skill library, accepted into the official Claude plugins marketplace. Standouts are `systematic-debugging` (four-phase hypothesis, evidence, test, repeat), `root-cause-tracing` (forces investigation over patch-and-move-on), and `subagent-driven-development` (parallel subagents with two-stage review, see [Claude Code subagents](claude-subagents.md)). Opinionated and token-heavy. Adapt the patterns, not the prose.

### wshobson/agents

[wshobson/agents](https://github.com/wshobson/agents) packages 77 single-purpose plugins and 149 skills organized around Anthropic's 2-to-8-components-per-plugin guideline, with an Opus, Sonnet, Haiku routing strategy to minimize tokens. Strong architectural discipline. Breadth is the maintenance surface, so watch for staleness in less-popular plugins.

### trailofbits/skills

[trailofbits/skills](https://github.com/trailofbits/skills) is a security audit suite using CodeQL and semgrep for static analysis, variant analysis, and fix verification. Trail of Bits' audit pedigree is the trust signal. Narrow by design. Not a substitute for general review.

## Frontend design alternatives

Three community skills extend or replace the Anthropic `frontend-design` plugin. Each targets a different gap.

### pbakaus/impeccable

[`pbakaus/impeccable`](https://github.com/pbakaus/impeccable) bundles 18 steering commands around seven reference files covering typography, color and contrast, spatial design, motion, interaction, responsive layout, and UX writing. 20k stars, Apache-2.0, very active. Distinctive for curated anti-patterns. The reference files enumerate specific AI-slop patterns by name, which is a sharper steer than the generic "avoid slop" framing in `frontend-design`. Bundles ship for Claude Code, Cursor, OpenCode, and Gemini CLI at impeccable.style. A standalone `npx impeccable` CLI audits 24 design issues against a codebase or URL without any AI harness attached.

### nextlevelbuilder/ui-ux-pro-max-skill

[`nextlevelbuilder/ui-ux-pro-max-skill`](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) maps product type to UI rules through a reasoning engine. 161 product types, 50+ styles, 161 color palettes, 57 font pairings, 99 UX guidelines, 25 chart types, and 10 stacks. BM25 ranks style priorities and filters industry-specific anti-patterns. Installs via the `uipro-cli` npm package and targets 14+ agents including Claude Code, Cursor, Windsurf, Antigravity, Codex CLI, and Gemini CLI. Heaviest option of the three. Best fit when the project has no clear design direction and the skill can ask clarifying questions upfront.

### Leonxlnx/taste-skill

[`Leonxlnx/taste-skill`](https://github.com/Leonxlnx/taste-skill) exposes three dials from 1 to 10 for Design Variance, Motion Intensity, and Visual Density. 9k stars, v2 in beta. Eight sub-skills including `gpt-taste` for Awwwards-level UI, `redesign-skill` for project audits, `minimalist-skill`, `brutalist-skill`, `output-skill` to prevent truncated code, and `stitch-skill` for Stitch DESIGN.md ingestion. Most experimental of the three. Useful when generic output needs a specific stylistic push.

## Curated lists

- [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code): best single source for discovering novel orchestration patterns like the RIPER workflow
- [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills): 1000+ skills across Claude Code, Codex, Gemini CLI, and Cursor. Peer to awesome-claude-code with wider agent coverage.
- [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md): 68 DESIGN.md templates drawn from popular brand design systems. Drop one into a project and the coding agent matches that aesthetic. 56k stars, MIT, released 2026-03-31.

## Integrations

### Figma MCP and Code to Canvas

[Figma's official MCP server](https://www.figma.com/blog/introducing-claude-code-to-figma/) supports bidirectional sync. Figma and Anthropic announced Code to Canvas on 2026-02-17. The feature captures running Claude Code UIs and converts them to editable Figma frames, components, and auto-layout groups. Claude Code-only and Remote MCP-only at launch. Desktop Figma app required for capture.

### Claude Design

Anthropic's first-party design product at [claude.ai/design](https://claude.ai/design) covers the same slot as Stitch for Claude subscribers and adds a direct Claude Code handoff bundle. Included in Pro, Max, Team, and Enterprise plans. See [Claude Design](claude-design.md) for capabilities, limits, and when to pick it over Figma or Excalidraw.

### Google Stitch and DESIGN.md

[Stitch](https://stitch.withgoogle.com) is Google Labs' free AI design tool. The relevant export for this toolkit is `DESIGN.md`, a markdown design system document listing tokens, typography, components, spacing, and guardrails in a format coding agents read natively. Stitch 2.0 landed March 2026 with an infinite canvas, voice input, multi-screen generation, and 350 free generations per month. Claude Design covers the same role for Claude subscribers with a first-party Claude Code handoff. Stitch remains the free alternative for users without a Claude subscription.

[`google-labs-code/stitch-skills`](https://github.com/google-labs-code/stitch-skills) is the companion skills repo. Apache-2.0, 4.5k stars, not an officially supported Google product. Skills include `stitch-design`, `stitch-loop`, `design-md`, `enhance-prompt`, `react-components`, `remotion`, and `shadcn-ui`. A Stitch MCP server imports designs directly into Claude Code without manual file transfer. Stitch-exported `DESIGN.md` fills the same slot as the toolkit's `.claude/DESIGN.md` seed and is a viable drop-in source.

## Adapting to this toolkit

When evaluating a community skill for adaptation into `claude/skills/`:

1. Check whether an existing domain skill already covers the concern. Extend before duplicating.
2. Import the pattern, not the prose. Rewrite the skill body to match `standards/skill.md` and toolkit tone.
3. Keep frontmatter triggers narrow. Community skills often over-trigger.
