---
title: Design
description: DESIGN.md token shape, extract skill, render command
category: Domain references
---

# Design

`.claude/DESIGN.md` holds visual intent as prose and token tables. The toolkit treats it as the tool-agnostic source of truth for any project's design system. Two surfaces sit around it: a Claude Code skill drafts the file from existing project signals, and a CLI command renders a token preview for human inspection.

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

`toolkit:claude-design-extract` drafts `.claude/DESIGN.md` from a project's existing prose and CLI UI surfaces. The skill reads `CLAUDE.md`, `standards/prose.md`, CLI UI modules like `src/ui.ts` or `scripts/lib/ui.sh`, and any stylesheet or theme config it finds. It fills the seed template from those signals and marks any inferred cell with a trailing `? verify` tag.

The skill is judgment-driven, not deterministic. It does not parse CSS or compiled styles. It codifies what the project already says about itself. For extraction from raw compiled code, reach for Claude Design instead.

Install in a target project via `aitk claude install` and invoke with `/toolkit:claude-design-extract`.

## Propose skill

`toolkit:claude-design-propose` drafts `.claude/DESIGN.md` on day one of a project, before any UI code exists. The skill reads `.claude/REQUIREMENTS.md` for a required `## Personality` paragraph, plus `.claude/ARCHITECTURE.md` for platform signals, and proposes token values from those inputs. Every proposed cell carries a trailing `? verify` tag because the values are speculative until code or a designer anchors them.

This skill replaces the Claude Design onboarding quota cost for greenfield projects. The output is a starting point, not a final system. Expect the first render to shift several tokens after review.

Install in a target project via `aitk claude install` and invoke with `/toolkit:claude-design-propose`.

### Choosing propose vs extract

Pick `claude-design-propose` when no UI code, stylesheets, or theme config exists yet and the project has a written personality paragraph. Pick `claude-design-extract` when the project already has components, tokens, or a shell UI library that should define the system. The two skills share the same seed and render pipeline, so switching later is a rewrite of `DESIGN.md`, not a migration.

## Render command

`aitk design render` reads `.claude/DESIGN.md` and writes an HTML plus CSS preview to `.claude/review/design/`. The HTML shows color swatches, typography samples, spacing bars, and border exemplars. The CSS holds tokens as custom properties for copy-paste into a project stylesheet.

Flags:

| Option            | Default                 | Behavior                 |
| ----------------- | ----------------------- | ------------------------ |
| `--source <path>` | `.claude/DESIGN.md`     | Source markdown to parse |
| `--out <path>`    | `.claude/review/design` | Output directory         |

Output is one-way. DESIGN.md is source, the preview is a derived artifact. The renderer does not mutate target-project stylesheets. It regenerates on demand, not on save.

The output directory sits under `.claude/review/` which is gitignored by the seed CLAUDE.md. Do not stage the preview.

## Workflow

Typical sequence in a new project:

1. Run the extract skill against an existing codebase, or the propose skill against a greenfield project with a personality paragraph, to draft `.claude/DESIGN.md`
2. Review `? verify` cells and edit the file directly
3. Run `aitk design render` to regenerate the preview
4. Open `.claude/review/design/index.html` in a browser
5. Iterate on DESIGN.md until the preview matches intent

The Stitch integration (`aitk design sync`, `generate`, `edit`, `variants`, `list`) sits on top of the same DESIGN.md file, consuming its tables via MCP. See `.claude/plans/feature-stitch-mcp-integration.md` for that surface.

## Related

- `agents.md`: CLI flags and invocation contract for `aitk design`
- `wiki/visual-design-workflow.md`: tier framework for prose-only, visual companion, and graphical source of truth
- `wiki/stitch.md`: Stitch MCP details for the downstream generation surface
