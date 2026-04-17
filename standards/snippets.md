---
title: Snippet reference
description: Snippet reference and authoring conventions
---

# Snippet reference

## What a snippet is

A snippet is a short, focused prompt stored as a plain markdown file. Invoke one to insert a prepared instruction into any AI chat without retyping it. Each snippet covers one purpose. If a prompt needs headers or multiple goals, use a system prompt instead.

## Invocation channels

- Chrome extension: type `>slug` in a supported chat UI (claude.ai, gemini.google.com) to insert the snippet text inline
- Claude Code terminal: prefix the install path with `@` (e.g. `@snippets/claude/feature`)
- Snippets install preserving the source folder structure. A snippet at `claude/edit.md` installs as `snippets/claude/edit.md` and is invoked as `@snippets/claude/edit`

## Use patterns

- Run-as-is: invoke and send immediately. The snippet is self-contained and needs no extra context.
- Invoke-then-add-context: invoke the snippet, then append specifics in the same message (e.g. invoke `claude-feature`, then add the feature name or extra constraints)
- Invoke-on-history: invoke after a discussion. The snippet uses prior conversation as implicit context with no additional input needed (e.g. invoke `claude-figma` after discussing a design).

## Authoring

- One focused purpose per snippet. If it needs headers or multiple goals, use a system prompt instead.
- Self-contained. No references to external files or assumed prior context.
- No user fill-in placeholders. If a value depends on context, the user adds it after invocation.
- Plain markdown only. No YAML frontmatter, no headers, no nested structure.
- Filename is the slug: kebab-case, no capitals, no underscores

## Structure

- Lead with a verb. Open with an imperative that states the job immediately.
- One instruction per sentence. Do not stack multiple actions into one sentence.
- For sequential steps, use a numbered list with one action per item.
- When the output has a fixed shape, show it in a fenced code block with a language identifier.
- Put constraints and exclusions last, not inline with the main instructions.

## Examples

### Correct

```markdown
I want to implement the following. Scan relevant files and list conflicts. Do not implement. # user adds feature after invocation
Scan relevant files and list conflicts. Do not implement. # run-as-is, no context needed
```

### Incorrect

```markdown
I want to implement: <feature or task name> # redundant fill-in, add context after invocation instead
See ARCHITECTURE.md before starting. # external dependency, not self-contained

## Overview\n## Steps # headers belong in a system prompt, not a snippet
```
