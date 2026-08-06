---
title: Markdown reference
description: Headings, paragraph and list structure, code spans, punctuation, emphasis, and file references
---

# Markdown reference

Applies to markdown reference docs, READMEs, and inline documentation in repos. These are mechanics rather than voice, so no surface yields them. A surface stating its own voice claims that yield from `prose.md` and formats by this file regardless.

## Scope

Governs the markdown mechanics of every markdown file: headings, paragraph and list structure, code spans and fences, punctuation, emphasis, and file references. It is an attribute standard rather than a document-type one, so it applies over documents whose shape another standard sets, and it carries no template because mechanics are written across every document and have no shape of their own.

Does not govern:

- Voice, word choice, and the wording of a `title` or `description`: `prose.md`
- What sections a document has, or what belongs in each: the standard for that document type
- The text inside a fenced block, which follows the conventions of its own language rather than these
- The scan that applies the punctuation bans to finished text on its way out: `publish.md`

## Headings

- H1 for document title, H2 for main sections, H3 for subsections
- Use sentence case for all headings (H1, H2, H3)
- Proper nouns and product names retain their casing in headings
- Past roughly 40 rendered lines with no heading of any level breaking them, add a subheading at the seam. Measure the longest such run rather than everything under one `##`, and exclude fenced code blocks. The number is a checkpoint, not a cap.
- Count rendered lines rather than source lines, wrapping each source line at 80 columns and summing the heights. Source lines undercount a file authored one line per bullet, where a block of fifteen paragraph-bullets occupies fifteen lines and renders past sixty. A checkpoint another standard states counts the same unit, so a file measured one way never sits beside a run measured another.
- Exempt a block whose lines are all list items at one level averaging under roughly 130 characters. A flat list of short peers is already navigable, and a subheading dropped into it splits a set that belongs together. Bullet count says nothing on its own, since a catalog of one-liners and a stack of paragraphs reach the same count and read nothing alike, so weight is what decides.
- Mixing prose with that list, or nesting levels inside it, ends the exemption at any weight.
- Exempt a block whose lines are all table rows, at any length. The peer list above is exempt because it is already navigable, and a table because the remedy does not exist: a subheading dropped inside one splits the table rather than the run, so no edit short of rewriting it as a list clears the checkpoint.
- Prose either side of the table ends that exemption, since the block has a seam and a heading breaks it there.

## Paragraphs and lists

- Use prose by default. Reserve bullets for discrete, unrelated items.
- Keep paragraphs to four sentences or fewer. Split longer blocks at the next logical boundary.
- Past roughly 700 characters in one paragraph, folding in the lines that wrap it, split at the next logical boundary as well. A paragraph written as two long sentences satisfies the sentence cap above and still asks the reader to hold too much at once. This number sits well above the bullet checkpoint because a paragraph is read straight through and a bullet is scanned.
- Keep bullets tight. Past roughly 400 characters in one top-level bullet, counting the lines that continue it and excluding any bullet nested under it, the overflow belongs in prose. The number is a checkpoint rather than a cap, and a bullet reading well past it means the number is wrong rather than the rule.
- Collapse a stack of bullets narrating one subsystem into a single `###` subsection carrying one narrative. Splitting a heavy bullet into three light ones satisfies the checkpoint above and leaves the reader no better off, and subdividing a block does not lighten the bullets inside it, so the two rules answer different defects.
- Use dashes (`-`) not asterisks (`*`) for bulleted lists
- Do not end single-sentence or fragment bullets with a period. Use periods when a bullet has two or more sentences.
- For key path lists, use colon format: `- \`src/\`: description`. Never use an em dash.
- Do not introduce a list with a "Here are the X:" or "The following X:" lead-in

## Code and identifiers

- Wrap commands, API names, file paths, and code identifiers in backticks
- Use a language identifier on all fenced code blocks (`markdown`, `typescript`, `plaintext`). Never use a bare ` ``` `
- In ASCII tree diagrams, use `←` for inline annotations. Never use `#`.

## Punctuation

- Do not use em dashes (`—`) or semicolons (`;`). Rewrite or restructure the sentence to avoid them.
- Do not use parenthetical asides in prose (`the config (which is optional) controls...`). Split into its own sentence or drop it. Parentheses in rule definitions for grouping examples are fine.

The closed-set word bans sit in `prose.md` under `## Language` rather than here, because a banned word is a word-choice rule and these are character rules. A surface applying both reads both files.

## Emphasis and dividers

- Do not over-format with excessive bold, italic, or header usage
- Do not use horizontal rules or dividers (`---`) in body content. The `---` delimiters of a YAML frontmatter block at the top of the file are allowed.

## Links and file references

- Use descriptive anchor text for links. Avoid `click here` or `read more`.
- Wrap file references in backticks by default. Use a labeled markdown link (`[label](path)`) only on rendered-for-human surfaces (`README.md`, `docs/`) and in an index file, whose rows exist to be followed. Never repeat the path verbatim as the label.

## Examples

Each pair shows a banned pattern and its fix.

```markdown
Bad: See [.claude/context/retrieval.md](.claude/context/retrieval.md) for the retrieval flow.
Good: See `.claude/context/retrieval.md` for the retrieval flow.
```

```markdown
Bad: Read [docs/development.md](docs/development.md) before contributing.
Good: Read the [development guide](docs/development.md) before contributing.
```
