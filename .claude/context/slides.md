---
title: Slides
description: SLIDES.md source shape, layout catalog, render command, draft skill
---

# Slides

## Overview

`.claude/SLIDES.md` holds a slide deck as markdown. The toolkit treats it as the source of truth and renders it to a PowerPoint deck on demand. Two surfaces sit around it: a Claude Code skill drafts the file from a topic and picks a layout per slide, and a CLI command renders the deck for inspection.

## Layout

- `src/slides/` owns the parser, the layout functions, the design tokens, and the render
- `examples/slides/` owns the reference deck that exercises every layout
- `.claude/review/slides/` owns rendered decks, gitignored

## Decisions

- The engine is a fresh general-purpose layer, not a port of any single project's deck modes. It ships one source format with a per-slide layout, so any repo writes its own `SLIDES.md` and renders with the same command.
- The source is committed. The rendered `.pptx` lands in the gitignored `.claude/review/slides/` and can be regenerated at any time.
- The palette is a paper background with a rust accent, deliberately not blue. Both variants share the same accent so a deck reads consistently either way.

## Source shape

A `SLIDES.md` opens with deck frontmatter between `---` delimiters:

- `title`, the deck title written into the file metadata
- `variant`, `light` or `dark`

Each slide follows as a section, separated by a `---` rule. A slide opens with a `# Title` and a `layout:` line naming a layout, then carries content shaped to that layout. When a slide omits `layout:`, the parser infers `bullets` for content with list items and `title` otherwise.

## Layout catalog

`aitk slides list --json` emits the catalog so a skill reads layout names at runtime rather than hardcoding them. The layouts cover a cover title, a contents slide, a section divider, a bullet list, two labeled columns, a row of stat callouts, a card grid, and a pull quote. Each layout function owns its geometry and enforces the type scale, so content sizes to fit rather than overflowing.

## Navigation

A `toc` slide renders a clickable contents list. The render builds the navigation in a pre-pass that numbers every slide, so the contents links jump to each `section` slide by position with no hand-written slide numbers. Every slide except the cover and the contents slide carries a footer with the deck title and a `Contents` link back to the `toc` slide. A deck without a `toc` slide gets the deck-title footer with no link.

## Design tokens

`src/slides/styles.ts` holds the design system: one warm palette of `background`, `surface`, `ink`, `muted`, and `accent` tokens, the safe font pair, the type scale, and the light and dark variant mapping. A deck selects the light or dark variant through its frontmatter or a render flag.

## Render command

`aitk slides render --source .claude/SLIDES.md --out .claude/review/slides` parses the source, builds the deck with pptxgenjs, and writes one `.pptx` named after the source. A `--variant light` or `--variant dark` flag overrides the frontmatter variant for a one-off render. Data and logs follow the standard stream contract: the success frame goes to stderr, leaving stdout clean.

`--mirror <dir>` copies the rendered deck into another directory after writing, and the `AITK_SLIDES_MIRROR` environment variable sets a default mirror so the path stays out of the repo. `--open` opens the deck after writing, targeting the mirror copy when present. On WSL it opens through the Windows shell, elsewhere through the platform opener.

## Draft skill

`aitk:aitk-slides-draft` drafts `.claude/SLIDES.md` from a topic, picks a layout per slide from the catalog, and shells out to the render command. The skill owns the deck content and the design choices encoded in the source. It never reimplements layout or styling, which live in the CLI.

After the first render it runs a one-pass quality check: convert the deck to images with `soffice` and `pdftoppm`, inspect every slide with fresh eyes for overlap, overflow, and contrast, fix once, and stop. The image pass is skipped with a note when those tools are absent.

## Reference deck

`examples/slides/showcase.md` exercises every layout in one deck. Render it to inspect the design system end to end and to verify a styling change visually.
