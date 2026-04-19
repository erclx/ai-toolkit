---
name: claude-design-extract
description: Drafts `.claude/DESIGN.md` from a project's existing prose and shell UI surfaces using the toolkit seed template. Reads CLAUDE.md, standards, docs, and CLI UI modules to codify visual intent already implicit in the project. Use when asked to "extract the design system", "draft DESIGN.md", "bootstrap design tokens", or "capture the visual system". Do NOT use to mutate an existing `.claude/DESIGN.md`.
---

# Design extract

## Guards

- If `.claude/DESIGN.md` already exists and has content beyond the seed template, stop: `❌ DESIGN.md already populated. Edit directly or archive the existing file first.`
- If `aitk` is not on PATH, stop: `❌ aitk CLI not found.`

## Step 1: read source signals in parallel

Read these from the project root, skipping any that do not exist:

- `CLAUDE.md`: voice, personality, spelling rules
- `.claude/REQUIREMENTS.md`: worldview and non-goals that shape visual intent
- `standards/prose.md`: tone constraints
- `src/ui.ts`, `src/ui.tsx`, `src/components/**`: color codes, typography, spacing constants
- `scripts/lib/ui.sh`, `scripts/lib/*.sh`: ANSI color codes, frame glyphs, spacing conventions
- `docs/agents.md`, `docs/index.md`: any output shape or framing rules already documented
- Any `*.css`, `tailwind.config.*`, or `theme.*` file at the project root

Run these reads in parallel. Do not speculatively recurse into every directory.

## Step 2: fetch the seed template

Run this from the project root:

```bash
aitk claude seeds list --json | jq -r '.[] | select(.path == ".claude/DESIGN.md") | .content'
```

Use the returned content as the target shape. Keep every section heading and every table header intact. The `aitk design render` parser depends on them.

## Step 3: fill the template

Walk each section once, pulling concrete signals from Step 1:

- **Personality**: one paragraph. Transcribe what `CLAUDE.md` and `REQUIREMENTS.md` say about voice, tone, and visual feeling. Do not invent rules the source does not state. Follow `standards/prose.md`: no em dashes, no semicolons, no marketing buzzwords. If nothing matches, write a one-sentence placeholder ending in `? verify`.
- **Color**: one row per role. Source hex values from the CLI UI files or stylesheets. If a role has no source signal, leave `Value` blank rather than guessing.
- **Typography**: one row per role. Source families and sizes from stylesheet or theme config. Leave cells blank when no signal exists.
- **Spacing**: fill the base unit and multipliers from stylesheet tokens or obvious repeated values in the UI code.
- **Borders**: one row per role. Source from stylesheet or CSS variables.
- **Motion** and **Iconography**: one line each. Default to `No animation.` and `No custom icons.` when no evidence exists.

Mark any inferred cell by appending ` ? verify` inside the cell value, never as a trailing column. The cell stays inside the table shape: `| display ? verify | | | | |`. A trailing `| ? verify` after the row breaks the parser.

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

N cells marked `? verify`. Open the preview and confirm before committing.
```
