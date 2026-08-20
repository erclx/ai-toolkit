---
description: Route markdown edits to the markdown standard for headings, lists, punctuation, banned words, and frontmatter wording
paths:
  - '**/*.md'
---

# Markdown mechanics standards

## Authority

- Follow `standards/markdown.md` inside the aitk plugin for headings, paragraph and list structure, code spans, punctuation, emphasis, file references, the banned words and spellings, and the wording of a `title` or `description`. It is the single source.
- Report it rather than proceeding silently when that file does not resolve. It ships with the plugin and this rule ships with the CLI, so a project that installed governance alone does not have it.
- Read it before a substantial markdown edit. Do not work the banned words or characters from memory.
- Run `aitk markdown audit <path>` after the edit, and rewrite the sentence carrying a hit rather than swapping the token for a near-synonym.
- Voice, rhythm, and sentence construction are a separate topic. `500-prose` routes them.
