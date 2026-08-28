# Contributing

aitk is a portfolio project. Issues are welcome. Pull requests are accepted by invitation only.

What follows is the local loop for an invited contributor, and for anyone running the CLI from a clone.

## Setup

Bun runs the CLI and every script. The shell scripts need `zsh` or bash 4 or newer, so macOS needs `brew install bash` first. The [readme](README.md#development) covers the clone, install, and bootstrap path.

## Verifying a change

`bun run check` is the gate. It auto-formats, regenerates the generated files, and runs the stages the changed files call for. Use `bun run format` when a change needs formatting alone.

The `pre-push` hook runs `bun run check`, and that run can rewrite files. Check `git status` after a push and commit any diff as `style(<scope>):`.

The [development notes](.claude/context/development/index.md) carry the full script table, what each stage gates on, and the rest of the hooks.

## Where to author

Standards and snippets author at `standards/` and `snippets/` in the repository root. Neither installs into a target project. A session reads a standard with `aitk standards <name>` and fires a snippet through its `@` reference off the live plugin symlink.

Snippets also carry a consumed copy at `.claude/snippets/`, which `bun run check` regenerates from the root source and fails the run on when the two drift. Edit the root copy. A change written under `.claude/snippets/` is overwritten on the next check with nothing to explain where it went. Standards carry no such copy, so `standards/<name>.md` is the only file to edit and the only one to cite from a file staying in this repository.

Governance rules split the same way, though through a different mechanism. Author under `governance/rules/`, which `aitk gov install` writes into a target project's `.claude/rules/`.

## Commits

Conventional commits are enforced. The `commit-msg` hook runs commitlint against `@commitlint/config-conventional`, so a message that does not parse is rejected before it lands.

## Agents

The repository is agent-first. Every command has a non-interactive path and a JSON catalog, and each domain carries a skill an agent loads before editing that domain. `CLAUDE.md` is the entry point for that layer. A pull request meets the same hooks and checks whether a person or an agent wrote it.
