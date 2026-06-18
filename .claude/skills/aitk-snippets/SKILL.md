---
name: aitk-snippets
description: Reusable prompt snippets for Claude and Gemini. Use for adding snippets, renaming slugs, or editing snippet folder structure.
---

# Snippets

Read `.claude/context/snippets.md` for system overview, categories, and structure before editing.

## Authoring rules

- Kebab-case only, no capitals, no underscores.
- Plain markdown only. No YAML frontmatter.
- No user fill-in placeholders. If a value depends on context, the user adds it after invocation.
- Use `aitk snippets create` to add a snippet. To add manually: create a `.md` file in the correct folder.
- Toolkit-internal snippets (maintenance, authoring, runbooks) go in `snippets/aitk/`. Reserve `snippets/claude/` for snippets a target project would invoke.
- Before adding a snippet, check invocation cadence. Prompts invoked many times across sessions belong in `snippets/`. One-shot-per-project audit, migration, or bootstrap prompts go to external notes.

## Presets

`snippets/snippets.toml` defines virtual presets (curated slug lists) that `aitk snippets install` resolves alongside folder-derived categories. Folder-based categories (`base`, `claude`) need no toml entry.

- `essentials` is the default `aitk init` install. Keep it tight: only snippets the user reaches for in nearly every session.
- Slugs may include a folder prefix (`claude/feature-recap`). They resolve to `snippets/<slug>.md` on install.
- New presets append a section to `snippets.toml` and a row in `.claude/context/snippets.md`.

## Sync checklist

When adding a snippet:

- Place the file in `snippets/{category}/{name}.md` (or `snippets/{name}.md` for base)
- Update `.claude/context/snippets.md` categories table and snippets table
- If the snippet belongs in `essentials`, add it to `snippets/snippets.toml`

When renaming a snippet:

- Notify any projects using the old slug to re-sync
- Update any `snippets.toml` preset entries that reference the old slug

## Reference

- `.claude/context/snippets.md`: system overview, categories, CLI
- `standards/snippets.md`: what a snippet is, invocation channels, use patterns, authoring conventions
