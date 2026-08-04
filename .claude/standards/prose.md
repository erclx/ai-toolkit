---
title: Prose reference
description: Voice, language, and frontmatter wording for reference markdown
---

# Prose reference

Applies to markdown reference docs, READMEs, and inline documentation in repos. It is the default voice for `.md` files and yields to any surface with its own voice, such as blogs, emails, changelogs, or commit messages. It also yields wherever another standard states the voice for the surface it governs, which is how a surface claims the exemption without this file having to name it. The yield covers voice alone. The language rules below stay in force on every surface, including the surfaces no automated check reaches, as do the mechanics in `markdown.md`.

## Scope

Governs voice, word choice, and frontmatter wording wherever prose is written. It is an attribute standard rather than a document-type one, so it applies over documents whose shape another standard sets, yields on voice alone where that standard states one, and carries no template because voice is written across every document and has none of its own to shape.

Does not govern:

- Headings, list and paragraph structure, code spans, punctuation, emphasis, and file references: `markdown.md`
- What sections a document has, or what belongs in each: the standard for that document type
- Which frontmatter fields a document carries, which is that standard's own subject. This file governs the wording of a `title` and a `description` and nothing else about them.
- Phase-label and semver discipline: `versioning.md`
- The scan that applies these bans to finished text on its way out: `publish.md`
- Code style and language conventions, which are governance rules rather than a standard

## Voice

- Write for a developer who is scanning, not studying. Every sentence should be understandable on first read.
- Use active voice. Default to present tense unless past or future tense is factually correct.
- Prioritize direct verbs and plain words, using the minimum necessary. Write `use` not `utilize`, `help` not `facilitate`, `is` not `serves as`.
- Vary sentence length and opening structure to break uniform cadence. Do not start consecutive sentences the same way.
- Use substantive connectives where flow matters, but never add words solely for rhythm. Terse reference prose needs no padding.
- Be direct on established facts. Hedge on genuinely uncertain claims.
- Assume developer-level technical knowledge. Skip hand-holding explanations.
- Front-load key information in each paragraph. Keep paragraphs concise and scannable.
- Every sentence must provide new information. Cut redundant context.

## Language

- Use American English spelling. Prefer `-ize` over `-ise`, `-or` over `-our`, `-er` over `-re` (`organize`, `analyze`, `summarize`, `recognize`, `behavior`, `color`, `center`)
- Do not use marketing buzzwords (`seamless`, `robust`, `powerful`, `revolutionary`, `enhanced`, `allows`, `leverage`)
- Do not use vague qualifiers (`simply`, `just`, `easily`, `quickly`, `very`, `really`)
- Open a sentence with its subject and action, not filler (`Note that`, `Basically`), a hollow connective (`That being said`, `It's worth noting`), or a gerund windup (`Leveraging the API...`). Substantive transitions that carry a real relationship are fine.
- Do not use the negative parallelism pattern (`It's not X, it's Y`, `not because X, but because Y`)
- Do not pad verb phrases or delay the action. Write the shortest form (`in order to` → `to`, `ensure that X is set` → `set X`, `By doing X, you can Y` → state Y directly).
- Do not address the reader as a participant (`Let's`, `Here's`, `Here are`). State the content directly.
- Commit to a position. Do not hedge in clusters (`It might be worth considering`) or use false balance (`While X is true, Y is also important`). Recommend, or state the tradeoff.

The character bans sit in `markdown.md` under `## Punctuation` rather than here, because an em dash and a semicolon are typography and these are word choice. A surface applying both reads both files.

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
