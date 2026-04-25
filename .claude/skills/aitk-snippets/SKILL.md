---
name: aitk-snippets
description: Reusable prompt snippets for Claude and Gemini. Use for adding snippets, renaming slugs, or editing snippet folder structure.
---

# Snippets

Read `docs/snippets.md` for system overview, categories, and structure before editing.

## Authoring rules

- Kebab-case only, no capitals, no underscores.
- Plain markdown only. No YAML frontmatter.
- No user fill-in placeholders. If a value depends on context, the user adds it after invocation.
- Use `aitk snippets create` to add a snippet. To add manually: create a `.md` file in the correct folder.
- Toolkit-internal snippets (maintenance, authoring, runbooks) go in `snippets/aitk/`. Reserve `snippets/claude/` for snippets a target project would invoke.

## Sync checklist

When adding a snippet:

- Place the file in `snippets/{category}/{name}.md` (or `snippets/{name}.md` for base)
- Update `docs/snippets.md` categories table and snippets table

When renaming a snippet:

- Notify any projects using the old slug to re-sync

## Reference

- `docs/snippets.md`: system overview, categories, CLI
- `standards/snippets.md`: what a snippet is, invocation channels, use patterns, authoring conventions
