---
title: Markdown reference
description: Headings, paragraph and list structure, code spans, punctuation, emphasis, and file references
---

# Markdown reference

Applies to markdown reference docs, READMEs, and inline documentation in repos. These are mechanics rather than voice, so no surface yields them. A surface stating its own voice claims that yield from `prose.md` and formats by this file regardless.

## Scope

Governs the markdown mechanics of every markdown file: headings, paragraph and list structure, code spans and fences, punctuation, emphasis, and file references. It is an attribute standard rather than a document-type one, so it applies over documents whose shape another standard sets, and it carries no template because mechanics are written across every document and have none of their own to shape.

Does not govern:

- Voice, word choice, and the wording of a `title` or `description`: `prose.md`
- What sections a document has, or what belongs in each: the standard for that document type
- The text inside a fenced block, which follows the conventions of its own language rather than these
- The scan that applies the punctuation bans to finished text on its way out: `publish.md`

## Headings

- H1 for document title, H2 for main sections, H3 for subsections
- Use sentence case for all headings (H1, H2, H3)
- Proper nouns and product names retain their casing in headings

## Paragraphs and lists

- Use prose by default. Reserve bullets for discrete, unrelated items.
- Keep bullets tight. If a bullet needs more than a couple of sentences, it belongs in prose.
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
