---
name: internal-snippets
description: Scope boundary for reusable prompts, the placement test that decides which ones ship, and what keeps the catalog worth listing
---

# Internal snippets requirement

## Gap

Without this skill, a session files a snippet by what its topic sounds like rather than by who invokes it, adds a prompt run once per project to a catalog every session pays to list, gives a snippet frontmatter or a fill-in placeholder it does not carry, and renames a slug while presets keep naming the old one.

Placement by topic is the one with a recorded cost. A whole category once moved to `internal/` on the strength of its subject, which put orchestrator runbooks out of reach of the target projects running that role. The files were correct and unreachable, and nothing failed, since a snippet the plugin does not ship produces no error anywhere.

## Must

- Apply the bundled standard's cadence and audience tests rather than a second copy of them, since the shipped `create-snippet` skill reads that standard and reaches nothing written here
- Map those tests onto this repository's three folders, sending a prompt a target project would run to a shipped folder and one only this repository can run to `internal/`
- Update every preset naming a slug when that slug changes, since a preset resolves by name and a stale entry installs nothing
- Keep `essentials` to what a session reaches for nearly every time, because it is the preset every skipped-snippets recovery command in `aitk init` suggests

## Must not

- Give a snippet YAML frontmatter or a user fill-in placeholder. It is plain markdown, and a value depending on context is supplied after invocation.
- Record a per-snippet or per-category row anywhere. The `list` command is the catalog and a written copy dates the moment a file lands.
- Filter an internal snippet at a code entry point. The plugin symlinks the folder and an installer dereferences it, so location is the only boundary that holds.

## Guards

- Install and sync agree on a destination layout keeping one folder level. A snippet nested deeper installs to a path sync can never match again.

## Out of scope

- What a snippet is, its invocation channels, and its authoring conventions, which the bundled snippets standard states
- Creating a snippet inside a target project, which the shipped `create-snippet` skill does after resolving which surface it is writing to
- Skills, which carry frontmatter and load on a description match rather than on an explicit invocation: `internal-claude`
