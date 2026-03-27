# Snippet reference

## What a snippet is

A snippet is a short, focused prompt stored as a plain markdown file. Invoke one to insert a prepared instruction into any AI chat without retyping it. Snippets cover one purpose each; if a prompt needs headers or multiple goals, it belongs in a system prompt.

## Invocation channels

- Chrome extension: type `>slug` in a supported chat UI (claude.ai, gemini.google.com) to insert the snippet text inline
- Claude Code terminal: prefix the file path with `@` (e.g. `@snippets/claude-feature.md`)
- Snippets always install flat as `snippets/{slug}.md` regardless of source folder structure

## Use patterns

- Run-as-is: invoke and send immediately; the snippet is self-contained and needs no extra context
- Invoke-then-add-context: invoke the snippet, then append specifics in the same message (e.g. invoke `claude-feature`, then add the feature name or extra constraints)
- Invoke-on-history: invoke after a discussion; the snippet uses prior conversation as implicit context with no additional input needed (e.g. invoke `claude-figma` after discussing a design)

## Authoring

- One focused purpose per snippet. If it needs headers or multiple goals, use a system prompt instead.
- Self-contained. No references to external files or assumed prior context.
- No user fill-in placeholders. If a value depends on context, the user adds it after invocation.
- Plain markdown only; no YAML frontmatter, no headers, no nested structure
- Filename is the slug: kebab-case, no capitals, no underscores

## Examples

### Correct

```markdown
I want to implement the following. Scan relevant files and list conflicts. Do not implement. # user adds feature after invocation
Scan relevant files and list conflicts. Do not implement. # run-as-is, no context needed
```

### Incorrect

```markdown
I want to implement: <feature or task name> # user fill-in placeholder — redundant, add context after invocation
See ARCHITECTURE.md before starting. # external dependency, not self-contained

## Overview\n## Steps # headers present — belongs in a system prompt
```
