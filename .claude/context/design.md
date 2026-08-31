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
- The skill picks its path from whether UI code exists, never from a flag. The general ban on dispatch flags in `standards/skill.md` targets a toggle the model reads and misapplies. A test against the tree has no such failure.
- Switching paths later is a rewrite of `DESIGN.md`, not a migration.
- Output is one-way. DESIGN.md is source, the preview is a derived artifact. The renderer does not mutate target-project stylesheets. It regenerates on demand, not on save.
- The toolkit's own record anchors its dark palette to `assets/hero.html` and its light palette to the `LIGHT` theme in `src/slides/styles.ts`. Deriving a light set from the hero's neutrals was the alternative, and it makes every light value a proposal where the slide theme supplies five of the six roles as readings. The two surfaces reconcile on no value, so the light half is anchored by a surface shipping it rather than by following from the dark half.
- No surface consumes `.claude/DESIGN.md`. The hero, the slide theme, the token preview, the terminal framing, and the capture pipeline each carry their own values, so the record names all five as independent rather than listing a consumer it would be predicting.
- The parser carries the uncertainty tag instead of discarding it. A parsed cell is a `{ value, tagged }` pair rather than a string, so `Row` is a map of cells and every swatch, sample, bar, and custom property is built from the value while the marker renders beside it as its own element. Leaving the marker inside the string was the alternative, and it puts the strip back in every emitter where one that forgets writes the tag into a `style` attribute.
- A tagged cell wrapping itself in a code span keeps the span. The tag is matched against the cell with any surrounding span removed, then the span is restored around the clean value, because dropping it outright would change how an untagged code-span cell renders. Holding an untagged record byte-identical is what decides that, and it is checked against the module as it stood before the tag survived.
- The confidence count reads the columns a source could anchor rather than every cell. Each table's first column names its row, and `Multiplier` and `When used` restate what the row already carries, so none of the four is counted. A cell tagged outside that set counts anyway, which keeps a marker the preview draws from sitting outside the ratio beside it.
- Counting every non-blank cell was the first shape and it shipped a denominator of 120 against the toolkit's own record, 43 of which could only ever be anchored. It read 93 percent confidence over a record carrying eight proposals. The scoped count reads 64 of 72.
- A record with no tagged cell gets neither the count nor the marker style, so nothing about it moves.

## Gotchas

- A code-span cell still emits its backticks. `` `#E4DCD0` `` reaches `design.css` and the `style` attribute with the backticks intact, so that swatch paints nothing whether or not the cell carries a tag. Write a token cell as a bare value, which is what the seed shows.
- The greenfield extract path tags nearly every cell, so the confidence count there reads near-total uncertainty. That is the path reporting itself accurately rather than a defect in the record.
- The slide theme and the hero reconcile on none of their five dark roles. The nearest miss is the primary text step, where `F4EFE6` and `#f4efe9` differ in the last digit and read as a match on a quick scan. The slide theme also sets Arial and Calibri where every other surface is monospace, so a single-family claim describes the hero and the terminal rather than the whole tree.
- The three terminal color rows emit a token no consumer resolves. `--color-success: ANSI 32` is not a color and the matching `style` attribute is dropped, so those swatches paint nothing in the preview. Recording the ANSI code is still right, since no rendered surface implements an equivalent, and the gap is that the render has no answer for a non-hex token.

## Seed shape

The seed at `tooling/claude/seeds/.claude/DESIGN.md` defines the target structure:

- **Personality**, one paragraph describing voice and tone
- **Color**, a table with `Role | Intent | Value` rows covering background, surface, text, muted, accent, success, warning, error
- **Typography**, a table with `Role | Family | Weight | Size | Line height` rows covering display, heading, body, label, code
- **Spacing**, a table with `Step | Multiplier | Value` rows covering xs through xl
- **Borders**, a table with `Role | Radius | Width | When used` rows
- **Motion**, one line on whether motion is used
- **Iconography**, one line on icon style and source

Table headers are load-bearing. The `canon design render` parser matches columns by header name, so keep them intact during edits.

## Extract skill

`canon:claude-design-extract` drafts `.claude/DESIGN.md` and picks one of two paths from what the project has. Both read `CLAUDE.md`, `.claude/REQUIREMENTS.md`, and `standards/markdown.md`, load the `write-human` skill for tone, fill the same seed, and end at the same render.

The source path runs when the project has UI code. It reads CLI UI modules like `src/ui.ts` or `scripts/lib/ui.sh` plus any stylesheet or theme config, sources values from them, and tags an inferred cell with a trailing `? verify`. `standards/design.md` now specifies that tag, its two spellings, and what the renderer does with it. The skill body was the only specification until then, which left the parser stripping a token no standard described.

The skill is judgment-driven, not deterministic. It does not parse CSS or compiled styles. It codifies what the project already says about itself. For extraction from raw compiled code, reach for Claude Design instead.

The greenfield path runs when nothing matches. It requires a `## Personality` paragraph in `.claude/REQUIREMENTS.md`, reads `.claude/ARCHITECTURE.md` for platform signals, and proposes token values from those inputs. Nearly every cell carries `? verify`, since the values are speculative until code or a designer anchors them. This path replaces the Claude Design onboarding quota cost for greenfield projects, and the first render usually shifts several tokens after review.

Install in a target project via `canon claude install` and invoke with `/canon:claude-design-extract`.

### The absorbed name

`claude-design-propose` was the greenfield path as its own skill until `0.18.0`, which absorbed it. Its folder then held a pointer body carrying `disable-model-invocation: true`, so a project that installed before the merge still resolved the old name without the pointer competing for routing against the survivor. Both the pointer and `scripts/sandbox/claude/design-propose.sh` are gone, long past the `0.19.0` their bodies named.

The fixture outlived the filename. `design-propose.sh` held the only greenfield coverage in the catalog, so its removal folded the fixture into `design-extract.sh` as a second arm through `select_or_route_scenario` rather than deleting it. That is what the `memory.sh` to `memory-review.sh` rename did: it moved the coverage to a name the mapping rule finds.

The scenario picks between `source`, which stages the tokenized notes app, and `greenfield`, which stages a focus timer with a `## Personality` paragraph and no code. `source` is listed first, so a caller routing past the picker lands on the path the scenario has always staged.

## Render command

`canon design render` reads `.claude/DESIGN.md` and writes an HTML plus CSS preview to `.claude/review/design/`. The HTML shows color swatches, typography samples, spacing bars, and border exemplars. The CSS holds tokens as custom properties for copy-paste into a project stylesheet.

A cell no source anchors shows a `? verify` marker beside its value, and a confidence line above the sections names how many cells are anchored against how many are tagged. `src/design/parse.test.ts` and `src/design/render.test.ts` cover both tag spellings, the count and the columns it reads, and the untagged render.

Flags:

| Option            | Default                 | Behavior                 |
| ----------------- | ----------------------- | ------------------------ |
| `--source <path>` | `.claude/DESIGN.md`     | Source markdown to parse |
| `--out <path>`    | `.claude/review/design` | Output directory         |

The output directory sits under `.claude/review/` which is gitignored by the seed CLAUDE.md. Do not stage the preview.

## Workflow

Typical sequence in a new project:

1. Run the extract skill to draft `.claude/DESIGN.md`. It sources tokens from an existing codebase, or proposes them against a greenfield project with a personality paragraph.
2. Review `? verify` cells and edit the file directly. The preview marks each one and counts them, so step 4 below is where they are found rather than the source file.
3. Run `canon design render` to regenerate the preview
4. Open `.claude/review/design/index.html` in a browser
5. Iterate on DESIGN.md until the preview matches intent

The Stitch integration (`canon design sync`, `generate`, `edit`, `variants`, `list`) sits on top of the same DESIGN.md file, consuming its tables via MCP. See `wiki/tools/stitch.md` for that surface.

## Related

- `docs/agents/commands.md`: CLI flags and invocation contract for `canon design`
- `docs/visual-design-workflow.md`: tier framework for prose-only, visual companion, and graphical source of truth
- `wiki/tools/stitch.md`: Stitch MCP details for the downstream generation surface
