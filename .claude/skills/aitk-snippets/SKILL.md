---
name: aitk-snippets
description: Reusable prompt snippets for Claude and Gemini. Use for adding snippets, renaming slugs, or editing snippet folder structure.
---

# Snippets

## Conventions

- Filename is the local name. `claude/edit.md` installs as `snippets/claude/edit.md` and is invoked as `@snippets/claude/edit`.
- Kebab-case only, no capitals, no underscores.
- Plain markdown only. No YAML frontmatter.
- One focused purpose per snippet. If it needs sections it is a system prompt, not a snippet.
- No user fill-in placeholders. If a value depends on context, the user adds it after invocation.

## Categories

- Base snippets live at `snippets/` root. Invoked as `@snippets/{name}`.
- Category snippets live in `snippets/{category}/`. Invoked as `@snippets/{category}/{name}`.
- Folder structure is preserved on install. No flattening, no prefix.
- No TOML manifest. The folder structure is the source of truth.
- Use `aitk snippets create` to add a snippet. It prompts for category, writes the file, and confirms the install path.
- To add manually: create a `.md` file in the correct folder.

## Sync checklist

When adding a snippet:

- Place the file in `snippets/{category}/{name}.md` (or `snippets/{name}.md` for base)
- Update `docs/snippets.md` categories table and snippets table

When renaming a snippet:

- Rename the file. The slug derives from the path, so nothing else in source needs updating.
- Notify any projects using the old slug to re-sync

## Full reference

- `docs/snippets.md`: system overview, categories, CLI
- `standards/snippets.md`: what a snippet is, invocation channels, use patterns, authoring conventions
