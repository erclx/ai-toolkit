---
name: claude-design-propose
description: Drafts `.claude/DESIGN.md` on day one of a project from `REQUIREMENTS.md`, `ARCHITECTURE.md`, and a `## Personality` section, with token values proposed by the agent. Use when asked to "propose a design system", "bootstrap DESIGN.md from scratch", "draft tokens for a greenfield project", or "replace Claude Design onboarding". Do NOT use when UI code or stylesheets already exist. Reach for `claude-design-extract` instead.
---

# Design propose

## Guards

- If `.claude/DESIGN.md` already exists and has content beyond the seed template, stop: `❌ DESIGN.md already populated. Edit directly or archive the existing file first.`
- If `.claude/REQUIREMENTS.md` is missing, stop: `❌ REQUIREMENTS.md not found. Write requirements before proposing a design system.`
- If `REQUIREMENTS.md` has no `## Personality` section, stop: `❌ REQUIREMENTS.md missing ## Personality section. Add a paragraph describing voice and tone before running this skill.`
- If `aitk` is not on PATH, stop: `❌ aitk CLI not found.`

## Step 1: read source signals in parallel

Read these from the project root, skipping any that do not exist:

- `.claude/REQUIREMENTS.md`: the `## Personality` paragraph, worldview, non-goals
- `.claude/ARCHITECTURE.md`: platform, tech stack, surface type (CLI, web, desktop)
- `CLAUDE.md`: voice rules, spelling, conventions
- `standards/prose.md`: tone constraints if present

Do not scan `src/`, stylesheets, or UI modules. This skill runs before code exists. If those files are present, the scenario is wrong and `claude-design-extract` is the correct tool.

## Step 2: fetch the seed template

Run this from the project root:

```bash
aitk claude seeds list --json | jq -r '.[] | select(.path == ".claude/DESIGN.md") | .content'
```

Use the returned content as the target shape. Keep every section heading and every table header intact. The `aitk design render` parser depends on them.

## Step 3: propose tokens from personality and requirements

Walk each section once. Follow `standards/prose.md` throughout: no em dashes, no semicolons, no marketing buzzwords. Use commas or separate sentences instead.

Every proposed table cell is speculative, so every filled table cell gets a trailing `? verify` tag inside the cell value, never as a trailing column.

Anchor proposals to signals, not defaults. If the personality says "calm and dense", that pins muted grays and tight spacing. If the requirements say "no motion", Motion writes `No animation.` with no tag. If the architecture names a CLI-only surface, Typography leans monospaced and Borders stays minimal.

- **Personality**: transcribe the `## Personality` paragraph from `REQUIREMENTS.md` verbatim. This is the one section that is not a proposal. No tag.
- **Color**: one row per role. Rewrite the Intent cell in personality language, for example `warm off-white page canvas` instead of the seed default `page canvas`. Propose hex values that match the personality. Dense and calm → low saturation, high text contrast. Playful → saturated accents. Every Intent and Value cell gets `? verify`.
- **Typography**: one row per role. Propose families that fit the platform (system UI for web, monospaced for CLI tools, serif for editorial) and a harmonious scale. Every cell gets `? verify`.
- **Spacing**: propose a base unit that matches density intent. Dense → 4px base. Roomy → 8px base. Keep the Multiplier column as the seed ships it, no tag. Only the Value column gets `? verify`.
- **Borders**: propose radius and width per role. Sharp and technical → small radius. Soft → larger radius. Every Radius and Width cell gets `? verify`.
- **Motion**: one line. If the requirements forbid motion, write `No animation.` If motion is allowed, phrase uncertainty inline, for example `Proposed 150ms ease-out, not yet confirmed.` Do not append a trailing `? verify` tag to a prose sentence. It renders raw in the preview.
- **Iconography**: one line. Propose style and source library matching personality. Phrase uncertainty inline, for example `Proposed outline style, source library not yet chosen.` Do not append a trailing `? verify` tag.

Do not invent non-goals. If the personality paragraph does not mention motion and the requirements do not forbid it, a proposed motion line is acceptable.

A cell marked `? verify` must stay inside the table shape: `| #ffffff ? verify |`. A trailing `| ? verify` column breaks the parser.

## Step 4: write and render

Write the filled template to `.claude/DESIGN.md` from the project root. Then run:

```bash
aitk design render
```

The command writes an HTML plus CSS preview to `.claude/review/design/`. Output the path in chat so the user can open it.

## Response format

```plaintext
📝 Wrote .claude/DESIGN.md
📝 Wrote .claude/review/design/index.html

N cells marked `? verify`. Open the preview, confirm the personality read as intended, then edit DESIGN.md directly to lock values.
```
