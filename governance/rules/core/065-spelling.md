---
description: Route .cspell/ dictionary additions to the right seeded file and keep each sorted
paths:
  - '.cspell/**'
---

# Spelling standards

## Dictionary routing

- Rewrite a typo rather than adding it. Add only a real term.
- Add a term from a tool, library, or platform the project depends on to `.cspell/tech-stack.txt`, whether it is the dependency's own name or vocabulary from its config, API, or spec.
- Add jargon, an acronym, a handle, or another project-specific term to `.cspell/project-terms.txt`.
- Add a third dictionary only when cspell still flags a term neither file covers. Declare its path in `cspell.json` with `addWords: true` before adding words to it.

## File shape

- Keep every dictionary file sorted alphabetically.
