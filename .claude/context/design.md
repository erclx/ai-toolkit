---
title: Design
description: DESIGN.md token shape, extract skill and its two paths, render command
---

# Design

## Overview

`.claude/DESIGN.md` holds visual intent as prose and token tables. The toolkit treats it as the tool-agnostic source of truth for any project's design system. Two surfaces sit around it: a Claude Code skill drafts the file from existing project signals, and a CLI command renders a token preview for human inspection.

## Layout

- `src/design/` owns the DESIGN.md parser and the preview renderer
- `claude/skills/claude-design-extract/` owns the skill that drafts the file, from an existing codebase or from a greenfield project
- `.claude/review/design/` owns the rendered preview, gitignored

## Decisions

- One skill covers both paths. They shared a seed, a render pipeline, and two byte-identical steps, and the split cost a caller a choice the project already answers.
- The skill picks its path from whether UI code exists, never from a flag. The general ban on dispatch flags in `.claude/standards/skill.md` targets a toggle the model reads and misapplies. A test against the tree has no such failure.
- Switching paths later is a rewrite of `DESIGN.md`, not a migration.
- Output is one-way. DESIGN.md is source, the preview is a derived artifact. The renderer does not mutate target-project stylesheets. It regenerates on demand, not on save.

## Seed shape

The seed at `tooling/claude/seeds/.claude/DESIGN.md` defines the target structure:

- **Personality**, one paragraph describing voice and tone
- **Color**, a table with `Role | Intent | Value` rows covering background, surface, text, muted, accent, success, warning, error
- **Typography**, a table with `Role | Family | Weight | Size | Line height` rows covering display, heading, body, label, code
- **Spacing**, a table with `Step | Multiplier | Value` rows covering xs through xl
- **Borders**, a table with `Role | Radius | Width | When used` rows
- **Motion**, one line on whether motion is used
- **Iconography**, one line on icon style and source

Table headers are load-bearing. The `aitk design render` parser matches columns by header name, so keep them intact during edits.

## Extract skill

`aitk:claude-design-extract` drafts `.claude/DESIGN.md` and picks one of two paths from what the project has. Both read `CLAUDE.md`, `.claude/REQUIREMENTS.md`, and `.claude/standards/prose.md`, fill the same seed, and end at the same render.

The source path runs when the project has UI code. It reads CLI UI modules like `src/ui.ts` or `scripts/lib/ui.sh` plus any stylesheet or theme config, sources values from them, and tags an inferred cell with a trailing `? verify`. The skill is judgment-driven, not deterministic. It does not parse CSS or compiled styles. It codifies what the project already says about itself. For extraction from raw compiled code, reach for Claude Design instead.

The greenfield path runs when nothing matches. It requires a `## Personality` paragraph in `.claude/REQUIREMENTS.md`, reads `.claude/ARCHITECTURE.md` for platform signals, and proposes token values from those inputs. Nearly every cell carries `? verify`, since the values are speculative until code or a designer anchors them. This path replaces the Claude Design onboarding quota cost for greenfield projects, and the first render usually shifts several tokens after review.

Install in a target project via `aitk claude install` and invoke with `/aitk:claude-design-extract`.

### The absorbed name

`claude-design-propose` was the greenfield path as its own skill until `0.18.0`, which absorbed it. Its folder then held a pointer body carrying `disable-model-invocation: true`, so a project that installed before the merge still resolved the old name without the pointer competing for routing against the survivor. Both the pointer and `scripts/sandbox/claude/design-propose.sh` are gone, long past the `0.19.0` their bodies named.

The fixture outlived the filename. `design-propose.sh` held the only greenfield coverage in the catalog, so its removal folded the fixture into `design-extract.sh` as a second arm through `select_or_route_scenario` rather than deleting it. That is what the `memory.sh` to `memory-review.sh` rename did: it moved the coverage to a name the mapping rule finds.

The scenario picks between `source`, which stages the tokenized notes app, and `greenfield`, which stages a focus timer with a `## Personality` paragraph and no code. `source` is listed first, so a caller routing past the picker lands on the path the scenario has always staged.

## Render command

`aitk design render` reads `.claude/DESIGN.md` and writes an HTML plus CSS preview to `.claude/review/design/`. The HTML shows color swatches, typography samples, spacing bars, and border exemplars. The CSS holds tokens as custom properties for copy-paste into a project stylesheet.

Flags:

| Option            | Default                 | Behavior                 |
| ----------------- | ----------------------- | ------------------------ |
| `--source <path>` | `.claude/DESIGN.md`     | Source markdown to parse |
| `--out <path>`    | `.claude/review/design` | Output directory         |

The output directory sits under `.claude/review/` which is gitignored by the seed CLAUDE.md. Do not stage the preview.

## Workflow

Typical sequence in a new project:

1. Run the extract skill to draft `.claude/DESIGN.md`. It sources tokens from an existing codebase, or proposes them against a greenfield project with a personality paragraph.
2. Review `? verify` cells and edit the file directly
3. Run `aitk design render` to regenerate the preview
4. Open `.claude/review/design/index.html` in a browser
5. Iterate on DESIGN.md until the preview matches intent

The Stitch integration (`aitk design sync`, `generate`, `edit`, `variants`, `list`) sits on top of the same DESIGN.md file, consuming its tables via MCP. See `wiki/tools/stitch.md` for that surface.

## Related

- `docs/agents/commands.md`: CLI flags and invocation contract for `aitk design`
- `docs/visual-design-workflow.md`: tier framework for prose-only, visual companion, and graphical source of truth
- `wiki/tools/stitch.md`: Stitch MCP details for the downstream generation surface
