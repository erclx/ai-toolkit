---
title: Snippet reference
description: Snippet reference and authoring conventions
---

# Snippet reference

## Scope

Governs a snippet file: what one is for, whether a prompt qualifies as one, how it is invoked, and the structure of its body.

Does not govern:

- Skill folders, which carry frontmatter, references, and scripts a snippet has none of: `skill.md`
- Voice, rhythm, and sentence construction in snippet prose: the `write-human` skill
- Punctuation, formatting, and word choice in snippet prose: `markdown.md`

## What a snippet is

A snippet is a short, focused prompt stored as a plain markdown file. Invoke one to insert a prepared instruction into any AI chat without retyping it. Each snippet covers one purpose. If a prompt needs headers or multiple goals, use a system prompt instead.

## Admission

Two tests decide whether a prompt becomes a snippet, and both have to pass. Apply them when adding one and when auditing the catalog.

- Cadence: a prompt invoked many times across sessions qualifies. A one-shot audit, migration, or bootstrap prompt does not, and belongs in notes outside the catalog.
- Audience: a prompt the consuming project would invoke ships in `snippets/`. One only the authoring repository can run stays outside every installable folder, which is a rule for a repository that authors snippets for others rather than for one that only consumes them.

A subfolder under `snippets/` names where a prompt is invoked rather than what it is about. A prompt that reads or writes the project's own files goes in a folder, and one carrying its whole context in the message goes at the root.

Overlapping a skill that does the same job is not disqualifying on its own. A snippet fires when a person asks for it by name and a skill fires on a description match, so the two coexist when those paths differ and the outputs do. Record the reason where the project keeps its decisions, or drop the snippet.

## Invocation channels

- Chrome extension: type `>slug` in a supported chat UI (claude.ai, gemini.google.com) to insert the snippet text inline
- Claude Code terminal: prefix the plugin path with `@` (e.g. `@claude/snippets/claude/feature-recap`). `claude/snippets` is a symlink to the authoring root, so the folder a snippet is written in is the folder it is invoked from

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
