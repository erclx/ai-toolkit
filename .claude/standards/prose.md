---
title: Prose reference
description: Voice, structure, formatting, and language rules for reference markdown
---

# Prose reference

Applies to markdown reference docs, READMEs, and inline documentation in repos. It is the default voice for `.md` files and yields to any surface with its own voice, such as blogs, emails, changelogs, or commit messages. It also yields wherever another standard states the voice for the surface it governs, which is how a surface claims the exemption without this file having to name it. The yield covers voice alone. Punctuation, formatting, and language rules below stay in force on every surface, including the surfaces no automated check reaches, which is what the scan below is for.

## Voice

- Write for a developer who is scanning, not studying. Every sentence should be understandable on first read.
- Use active voice. Default to present tense unless past or future tense is factually correct.
- Prioritize direct verbs and plain words, using the minimum necessary. Write `use` not `utilize`, `help` not `facilitate`, `is` not `serves as`.
- Vary sentence length and opening structure to break uniform cadence. Do not start consecutive sentences the same way.
- Use substantive connectives where flow matters, but never add words solely for rhythm. Terse reference prose needs no padding.
- Be direct on established facts. Hedge on genuinely uncertain claims.
- Assume developer-level technical knowledge. Skip hand-holding explanations.
- Keep paragraphs to four sentences or fewer. Split longer blocks at the next logical boundary.

## Structure

### Headings

- H1 for document title, H2 for main sections, H3 for subsections
- Use sentence case for all headings (H1, H2, H3)
- Proper nouns and product names retain their casing in headings

### Paragraphs and lists

- Front-load key information in each paragraph. Keep paragraphs concise and scannable.
- Every sentence must provide new information. Cut redundant context.
- Use prose by default. Reserve bullets for discrete, unrelated items.
- Keep bullets tight. If a bullet needs more than a couple of sentences, it belongs in prose.

## Formatting

### Lists

- Use dashes (`-`) not asterisks (`*`) for bulleted lists
- Do not end single-sentence or fragment bullets with a period. Use periods when a bullet has two or more sentences.
- For key path lists, use colon format: `- \`src/\`: description`. Never use an em dash.
- Do not introduce a list with a "Here are the X:" or "The following X:" lead-in

### Code and identifiers

- Wrap commands, API names, file paths, and code identifiers in backticks
- Use a language identifier on all fenced code blocks (`markdown`, `typescript`, `plaintext`). Never use a bare ` ``` `
- In ASCII tree diagrams, use `←` for inline annotations. Never use `#`.

### Punctuation

- Do not use em dashes (`—`) or semicolons (`;`). Rewrite or restructure the sentence to avoid them.
- Do not use parenthetical asides in prose (`the config (which is optional) controls...`). Split into its own sentence or drop it. Parentheses in rule definitions for grouping examples are fine.

### Emphasis and dividers

- Do not over-format with excessive bold, italic, or header usage
- Do not use horizontal rules or dividers (`---`) in body content. The `---` delimiters of a YAML frontmatter block at the top of the file are allowed.

### Links and file references

- Use descriptive anchor text for links. Avoid `click here` or `read more`.
- Wrap file references in backticks by default. Use a labeled markdown link (`[label](path)`) only on rendered-for-human surfaces (`README.md`, `docs/`) for cross-folder navigation. Never repeat the path verbatim as the label.

## Language

- Use American English spelling. Prefer `-ize` over `-ise`, `-or` over `-our`, `-er` over `-re` (`organize`, `analyze`, `summarize`, `recognize`, `behavior`, `color`, `center`)
- Do not use marketing buzzwords (`seamless`, `robust`, `powerful`, `revolutionary`, `enhanced`, `allows`, `leverage`)
- Do not use vague qualifiers (`simply`, `just`, `easily`, `quickly`, `very`, `really`)
- Open a sentence with its subject and action, not filler (`Note that`, `Basically`), a hollow connective (`That being said`, `It's worth noting`), or a gerund windup (`Leveraging the API...`). Substantive transitions that carry a real relationship are fine.
- Do not use the negative parallelism pattern (`It's not X, it's Y`, `not because X, but because Y`)
- Do not pad verb phrases or delay the action. Write the shortest form (`in order to` → `to`, `ensure that X is set` → `set X`, `By doing X, you can Y` → state Y directly).
- Do not address the reader as a participant (`Let's`, `Here's`, `Here are`). State the content directly.
- Commit to a position. Do not hedge in clusters (`It might be worth considering`) or use false balance (`While X is true, Y is also important`). Recommend, or state the tradeoff.

## Pre-publish scan

Wherever text leaves through a channel no automated check covers, the author is the only gate and runs this scan. Text sent to another service, written to a path the project's checks exclude, and text inside a fenced block are the usual cases. The surface that publishes the text is what knows which gap applies, so it names its own rather than reading one here.

Run the scan as an explicit step against the finished text. Having read this file before drafting does not cover it, because the check has to happen after the text exists.

### Banned characters

Scan the drafted text and rewrite each occurrence:

- `—` (em dash): split into two sentences, or use a comma
- `;` (semicolon): split into two sentences

Restructure the sentence rather than substituting the character. A semicolon swapped for a period leaves both clauses in the order the semicolon chose, which is the shape the ban exists to remove.

### Phase labels

The versioning standard beside this file holds the label rule and the table of surfaces. Read it at scan time rather than working the format from memory.

Scope this check by destination. Text published to a remote takes it. Text scanned on its way into the repository, where the reader has the task board, takes the character checks alone.

### An unreadable source

Stop and name the source when one this scan reaches for cannot be read. Do not scan what resolved and report the result.

A run that covers half its sources and says nothing is worse than one that visibly did not happen, because the surfaces running this scan are the ones that describe themselves as the only gate. A clean result from a half-run scan is read as coverage.

## Frontmatter descriptions

When frontmatter carries a short `title` or `description` used for catalog display:

- `title`: sentence case, identifies the file uniquely against its siblings in the same catalog. Proper nouns retain their casing. No trailing period.
- `description`: sentence case, names the specific topics covered so a reader can decide whether to open the file. Lead with concrete subjects, strip filler like "guide to", "overview of", or "documentation about". No trailing period, no leading article (`the`, `a`).
- Do not mechanically reuse the H1 as the description.

## Examples

Each pair shows a banned pattern and its fix.

```markdown
Bad: The configuration file serves as the central hub for all build settings.
Good: Configuration lives in `vite.config.ts`.
```

```markdown
Bad: In order to configure the server, you'll need to ensure that the port is set.
Good: Set `port` in the server config.
```

```markdown
Bad: It's not just a cache. It's a system for intelligent memory management.
Good: The cache is an LRU store. It evicts the least-recently-used entry when full.
```

```markdown
Bad: Leveraging the retry mechanism, developers can build more resilient integrations.
Good: Use the `retry` option for failed webhooks. Set `maxRetries` to 3.
```

```markdown
Bad: It might be worth considering whether to enable caching.
Good: Enable caching for read-heavy endpoints. Skip it for writes.
```

```markdown
Bad: See [.claude/context/retrieval.md](.claude/context/retrieval.md) for the retrieval flow.
Good: See `.claude/context/retrieval.md` for the retrieval flow.
```

```markdown
Bad: Read [docs/development.md](docs/development.md) before contributing.
Good: Read the [development guide](docs/development.md) before contributing.
```
