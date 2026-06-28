---
title: Prose reference
description: Voice, structure, formatting, and language rules for reference markdown
---

# Prose reference

Applies to markdown reference docs, READMEs, and inline documentation in repos. It is the default voice for `.md` files and yields to any surface with its own voice, such as blogs, emails, changelogs, or commit messages.

## Voice

- Write for a developer who is scanning, not studying. Every sentence should be understandable on first read.
- Use active voice. Default to present tense unless past or future tense is factually correct.
- Prioritize direct verbs and nouns, using the minimum words necessary
- Use common words over complex alternatives (`use` not `utilize`, `help` not `facilitate`)
- Prefer `is`/`has` over inflated alternatives (`serves as`, `features`, `offers`, `provides`)
- Vary sentence length and opening structure to break uniform cadence. Do not start consecutive sentences the same way.
- Where flow matters, use substantive connectives to carry one idea into the next. Terse reference prose is fine and needs no padding.
- Never add words solely for rhythm. Cut cadence that does not aid readability.
- Be direct on established facts. Hedge on genuinely uncertain claims.
- Assume developer-level technical knowledge. Skip hand-holding explanations.
- Keep paragraphs to four sentences or fewer. Split longer blocks at the next logical boundary.

## Structure

- H1 for document title, H2 for main sections, H3 for subsections
- Use sentence case for all headings (H1, H2, H3)
- Proper nouns and product names retain their casing in headings
- Front-load key information in each paragraph. Keep paragraphs concise and scannable.
- Every sentence must provide new information. Cut redundant context.
- Use prose by default. Reserve bullets for discrete, unrelated items.
- Keep bullets tight. If a bullet needs more than a couple of sentences, it belongs in prose.

## Formatting

- Use dashes (`-`) not asterisks (`*`) for bulleted lists
- Do not end single-sentence or fragment bullets with a period. Use periods when a bullet has two or more sentences.
- Wrap commands, API names, file paths, and code identifiers in backticks
- Use a language identifier on all fenced code blocks (`markdown`, `typescript`, `plaintext`). Never use a bare ` ``` `
- In ASCII tree diagrams, use `←` for inline annotations. Never use `#`.
- For key path lists, use colon format: `- \`src/\`: description`. Never use an em dash.
- Do not introduce a list with a "Here are the X:" or "The following X:" lead-in
- Do not over-format with excessive bold, italic, or header usage
- Do not use horizontal rules or dividers (`---`) in body content. The `---` delimiters of a YAML frontmatter block at the top of the file are allowed.
- Do not use em dashes (`—`) or semicolons (`;`). Rewrite or restructure the sentence to avoid them.
- Do not use parenthetical asides in prose (`the config (which is optional) controls...`). Split into its own sentence or drop it. Parentheses in rule definitions for grouping examples are fine.
- Use descriptive anchor text for links. Avoid `click here` or `read more`.
- Wrap file references in backticks by default. Use a labeled markdown link (`[label](path)`) only on rendered-for-human surfaces (`README.md`, `docs/`) for cross-folder navigation. Never repeat the path verbatim as the label.

## Language

- Use American English spelling. Prefer `-ize` over `-ise`, `-or` over `-our`, `-er` over `-re` (`organize`, `analyze`, `summarize`, `recognize`, `behavior`, `color`, `center`)
- Do not use marketing buzzwords (`seamless`, `robust`, `powerful`, `revolutionary`, `enhanced`, `allows`, `leverage`)
- Do not use vague qualifiers (`simply`, `just`, `easily`, `quickly`, `very`, `really`)
- Do not start sentences with filler (`Note that`, `Basically`, `Essentially`, `It should be noted`, `Overall`, `In summary`, `In conclusion`)
- Do not use hollow connectives that add no information (`That being said`, `With that in mind`, `As mentioned earlier`, `It's worth noting`). Substantive transitions that carry a real relationship are fine.
- Do not use the negative parallelism pattern (`It's not X, it's Y`, `not because X, but because Y`)
- Do not open sentences with gerund phrases (`Leveraging the API...`, `Building on this...`, `Utilizing the config...`)
- Do not pad verb phrases or delay the action. Write the shortest form (`in order to` → `to`, `ensure that X is set` → `set X`, `By doing X, you can Y` → state Y directly).
- Do not address the reader as a participant (`Let's`, `Here's`, `Here are`). State the content directly.
- Do not hedge in clusters (`It might be worth considering`, `You may want to think about`). Either recommend or state the tradeoff.
- State recommendations directly. Do not use false balance (`While X is true, Y is also important`).

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
