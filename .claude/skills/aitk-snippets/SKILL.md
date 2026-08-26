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
- Admission and placement follow the cadence and audience tests in `standards/snippets.md`. Read them before adding a snippet or judging one already in the catalog.
- Those tests land here as three folders. `snippets/` holds what a target invokes with no project files behind it, `snippets/claude/` what reads or writes a project's own files, and `internal/snippets/` what only this repository runs, which the plugin never ships.

## Presets

`snippets/snippets.toml` defines virtual presets (curated slug lists) that `aitk snippets install` resolves alongside folder-derived categories. Folder-based categories (`base`, `claude`) need no toml entry.

- `aitk init` installs no snippets unless `--snippets <category>` names one, and its recovery command for the skipped default suggests `essentials`. Keep that preset tight: only snippets the user reaches for in nearly every session.
- Slugs may include a folder prefix (`claude/feature-recap`). They resolve to `.claude/snippets/<slug>.md` on install.
- New presets append a section to `snippets.toml` and nothing else. `aitk snippets list` resolves them at runtime, so the context entry holds no preset row.
- Changing which slugs `essentials` carries means re-checking the snippets path asserted in `scripts/core/install-check.sh`. It names one slug that preset installs, and dropping that slug fails `bun run check:install` on a correct install.

## Sync checklist

When adding a snippet:

- Place the file in `snippets/{category}/{name}.md` (or `snippets/{name}.md` for base)
- Leave `.claude/context/snippets.md` alone unless the layout or a decision changed. `aitk snippets list` is the catalog, so the entry keeps no per-snippet or per-category record to update.
- If the snippet belongs in `essentials`, add it to `snippets/snippets.toml`

When renaming a snippet:

- Notify any projects using the old slug to re-sync
- Update any `snippets.toml` preset entries that reference the old slug

## Reference

- `.claude/context/snippets.md`: system overview, categories, CLI
- `standards/snippets.md`: what a snippet is, invocation channels, use patterns, authoring conventions
