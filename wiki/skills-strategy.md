---
title: Skills strategy
description: Rules for categorizing, storing, and choosing Claude Code skills
---

# Skills strategy

Skills split into two categories by function. The toolkit owns the first and installs the second. Mixing the two is the most common source of skill bloat and maintenance drag.

## Two categories

**Workflow skills** live in `claude/skills/` and wrap how this toolkit operates: planning, review, shipping, debugging, git, governance install. They are thin, opinionated, and specific to the author's process. The current set covering `toolkit:claude-feature`, `toolkit:claude-review`, `toolkit:git-ship`, and similar all belong here.

**Domain-knowledge skills** encode expertise curated over many hours. Frontend design anti-patterns, security audit patterns, industry-specific UI rules. Examples from the wider ecosystem include `frontend-design`, `impeccable`, `ui-ux-pro-max`, `taste-skill`, and `trailofbits/skills`. Install as plugins, do not fork. The curation is the value, and forking means inheriting the maintenance cost of that curation.

## Where skills live

| Location                         | Purpose                                                | Scope  |
| -------------------------------- | ------------------------------------------------------ | ------ |
| `toolkit/claude/skills/`         | Workflow skills, installable into target projects      | Shared |
| `toolkit/.claude/skills/`        | Toolkit-internal authoring skills, the `aitk-*` family | Local  |
| Target project `.claude/skills/` | Per-project customization not worth upstreaming        | Local  |
| `~/.claude/skills/`              | Global user skills active across every session         | User   |
| Plugin marketplace               | Community and official plugins installed via `/plugin` | User   |

The right location is a function of who benefits. A commit style specific to one project stays in that project's `.claude/skills/`. A commit skill the author uses everywhere goes in `toolkit/claude/skills/`. A frontend design anti-pattern skill maintained by a third party stays a plugin install.

## When to write, install, or fork

**Write a new skill** when it encodes workflow specific to this toolkit or conventions the author consistently applies. The test: would I invoke this same skill on every target project I own?

**Install a community skill** when it encodes domain expertise the toolkit does not maintain. Frontend design, security audits, stack-specific patterns. Let the upstream curate. Reference the skill in per-tier install recommendations inside wiki workflow pages.

**Fork** only when upstream diverges hard from specific needs and the maintenance cost is accepted explicitly. In practice this has not been necessary. If a fork looks tempting, consider whether a thin toolkit wrapper skill that composes the upstream one would meet the need.

## Redundancy audit

Four toolkit skills were compared against community counterparts. All four are kept. One was lightly enhanced.

- `toolkit:systematic-debugging` vs `obra/superpowers/systematic-debugging`. Same methodology. Ours is 71 lines to their 296. Our version captures the four phases, circuit breaker, and red flags in a prose-tight form that matches toolkit conventions. No borrow.
- `toolkit:claude-review` vs Anthropic's `code-review` plugin. Different scopes. Ours runs on a local branch diff and reads four project docs. Theirs runs on a PR URL with multi-agent fan-out and posts inline comments via GitHub MCP. Added a high-signal filter section borrowed from Anthropic's framing to sharpen severity judgment.
- `toolkit:claude-ux-audit` vs `impeccable`'s `/audit` and `/critique`. Different lenses. Ours enumerates UI surfaces to find missing states, edge cases, and inconsistencies. `/audit` scores technical quality across five dimensions. `/critique` scores design with Nielsen heuristics. They compose: run `claude-ux-audit` first to find gaps, then `impeccable` commands to polish what exists. No skill body change because third-party skill references belong in this catalog, not in SKILL.md bodies.
- `toolkit:claude-feature` vs `obra/superpowers` planning skills: `brainstorming`, `writing-plans`, and `executing-plans`. Different slots. Ours reads the full `.claude/` doc set and produces a structured plan at a coarser grain than superpowers' task-atomized `writing-plans`. Plan mode and Ultraplan are positioned separately in `docs/claude.md`. No borrow: the approval gate between plan and implement already covers the clarification case that `brainstorming` handles upfront.

## References

- [Community skills and plugins](community-skills.md): catalog of third-party skills worth installing
- [Claude Code skills](claude-skills.md): Claude Code skill feature reference
- [Visual design workflow](visual-design-workflow.md): example of per-workflow skill recommendations
