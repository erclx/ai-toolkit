---
name: aitk-snippets
description: Reusable prompt snippets for Claude and Gemini. Use for adding snippets, renaming slugs, or editing snippets.toml.
---

# Snippets

## Conventions

- Filename is the slug. `claude-edit.md` is invoked as `claude-edit`.
- Kebab-case only, no capitals, no underscores.
- Plain markdown only. No YAML frontmatter, no structure requirements.
- One focused purpose per snippet. If it needs sections it is a system prompt, not a snippet.
- `<placeholder>` syntax for fill-in values, never `[placeholder]`.

## Categories

- Categories are flat slug lists in `snippets.toml`. No inheritance.
- Use `aitk snippets create` to add a snippet. It handles both the file and the TOML entry.
- To add manually: create the `.md` file, then add the slug to the correct category in `snippets.toml`.

## Sync checklist

When adding a snippet:

- Register the slug in `snippets.toml` under the correct category

When renaming a snippet:

- Update both the filename and the slug entry in `snippets.toml`

## Full reference

- `docs/snippets.md`: system overview, slug conventions, categories, CLI
