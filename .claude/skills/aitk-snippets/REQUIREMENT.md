---
name: aitk-snippets
description: Scope boundary for reusable prompts, the placement test that decides which ones ship, and what keeps the catalog worth listing
---

# Aitk snippets requirement

## Gap

Without this skill, a session files a snippet by what its topic sounds like rather than by who invokes it, adds a prompt run once per project to a catalog every session pays to list, gives a snippet frontmatter or a fill-in placeholder it does not carry, and renames a slug while presets keep naming the old one.

Placement by topic is the one with a recorded cost. `v9.4` moved a whole category to `internal/` on the strength of its subject, which put runbooks out of reach of the target projects whose role those runbooks describe. The files were correct and unreachable, and nothing failed, since a snippet the plugin does not ship produces no error anywhere.

## Must

- Decide placement by who invokes the snippet, sending a prompt a target project would run to the shipped folder and one only this repository can run to `internal/`
- Check invocation cadence before adding, keeping the catalog to prompts reached across sessions and leaving one-shot audit, migration, and bootstrap prompts out of it
- Update every preset naming a slug when that slug changes, since a preset resolves by name and a stale entry installs nothing
- Keep `essentials` to what a session reaches for nearly every time, because it is what `aitk init` installs by default

## Must not

- Give a snippet YAML frontmatter or a user fill-in placeholder. It is plain markdown, and a value depending on context is supplied after invocation.
- Record a per-snippet or per-category row anywhere. The `list` command is the catalog and a written copy dates the moment a file lands.
- Filter an internal snippet at a code entry point. The plugin symlinks the folder and an installer dereferences it, so location is the only boundary that holds.

## Guards

- Install and sync agree on a destination layout keeping one folder level. A snippet nested deeper installs to a path sync can never match again.

## Out of scope

- What a snippet is, its invocation channels, and its authoring conventions, which the bundled snippets standard states
- Creating a snippet inside a target project, which the shipped `create-standard` skill does after resolving which surface it is writing to
- Skills, which carry frontmatter and load on a description match rather than on an explicit invocation: `aitk-claude`
