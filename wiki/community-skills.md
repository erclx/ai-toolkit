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

## Curated lists

- [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code): best single source for discovering novel orchestration patterns like the RIPER workflow

## Integrations

### Figma MCP and Code to Canvas

[Figma's official MCP server](https://www.figma.com/blog/introducing-claude-code-to-figma/) supports bidirectional sync. Figma and Anthropic announced Code to Canvas on 2026-02-17. The feature captures running Claude Code UIs and converts them to editable Figma frames, components, and auto-layout groups. Claude Code-only and Remote MCP-only at launch. Desktop Figma app required for capture.

## Adapting to this toolkit

When evaluating a community skill for adaptation into `claude/skills/`:

1. Check whether an existing domain skill already covers the concern. Extend before duplicating.
2. Import the pattern, not the prose. Rewrite the skill body to match `standards/skill.md` and toolkit tone.
3. Keep frontmatter triggers narrow. Community skills often over-trigger.
