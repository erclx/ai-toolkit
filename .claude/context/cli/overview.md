---
title: Overview
description: What the CLI domain owns, the folder layout, and the gotchas that cross every command
---

# Overview

`src/` is the TypeScript CLI entry point. It uses commander to register subcommands and execa to dispatch most of them to the corresponding `manage-*.sh` script in `scripts/`. Domains are being migrated off bash one at a time. Use `@/` absolute imports, mapped to `src/` in `tsconfig.json`.

The layer boundary: TypeScript owns argument parsing plus every migrated domain, and bash owns what has not moved yet. See `.claude/context/scripts/index.md` for the bash side.

## Layout

- `src/` owns the entry point (`cli.ts`), the exec helper that resolves `PROJECT_ROOT` and spawns bash (`exec.ts`), the shared terminal UI matching `lib/ui.sh` style (`ui.ts`), and the cross-domain file and GitHub helpers
- `src/commands/` owns one file per `aitk` subcommand, each one not yet migrated a thin pass-through to a `manage-*.sh` script
- `src/design/`, `src/slides/`, `src/transcripts/` own the domains built TS-first, documented as feature entries in `.claude/context/design.md`, `.claude/context/slides.md`, and `.claude/context/transcripts.md`
- `src/indexes/` owns the index engine, documented in `.claude/context/indexes.md`
- `src/tooling/` owns the tooling inject and scan engine, documented in `.claude/context/tooling.md`
- `src/sync/` owns the sync engine, the `aitk sync` git workflow, the install stamp, and the drift report, with the per-domain adapters in `src/gov/`, `src/snippets/`, and `src/standards/`
- `src/init/` owns the `aitk init` option surface, the preview and count, the domain step list, and the partial-failure runner
- `src/docs/` and `src/wiki/` own the two read-only domains, which reach for no shared engine because neither syncs into a target
- `src/claude/` owns seed planning, the gitignore preview, and the user settings merge
- `src/tasks/` owns the task-board archive, the one domain whose primary caller is a git hook rather than a person
- `src/comments/` owns the comment census, reasoned about in `.claude/context/cli/audits.md`
- `src/context/` owns the context-folder audit, reasoned about alongside it
- `src/capture/` owns the documentation capture render, the one folder under `src/` the package excludes

## Gotchas

### Wiring and output

- Set `process.exitCode` in a command action. Calling `process.exit()` ends the process before an async stdout write drains, which silently truncates piped output at the 64K pipe buffer while still reporting the right exit code. Redirecting to a file hides it, so this only shows up through a pipe.
- Diagnostics belong on stderr in every mode, including `--json`. A JSON record carries an action and a reason, not the file and field that failed, so an error is invisible to an operator unless stderr also gets it.
- `Bun.Glob` has no exclude option. A walker that must skip vendored trees filters scanned paths by segment, and forgetting to leaves the skip silently absent wherever `git check-ignore` is unavailable.
- A bare positional and a subcommand coexist on one command: `aitk docs list` resolves to the subcommand and `aitk docs agents` falls through to the positional. This is what preserves the bash shorthand where any non-verb argument means `get`. A doc named after a verb would be shadowed, which the bash `case` did too.
- A topic resolves against two spellings, `<dir>/<topic>.md` and `<dir>/<topic>/index.md`, so a domain that outgrows one file keeps the name its callers already type. The file wins when both exist, and a folder with no `index.md` resolves to nothing because the catalog is what reaches the sub-areas. Both listers pin their own depth, so a split domain needs a folder pass added to each.
- `import.meta.dir` is undefined under vitest, so `src/exec.ts` throws on import there. Engine modules take the toolkit root as a parameter rather than importing `PROJECT_ROOT`, which keeps them testable and leaves root resolution in the command layer. Tests build fixtures with `mkdtempSync(join(tmpdir(), 'aitk-<domain>-'))`.

### Writing into a tree someone else owns

- `src/wiki/` scaffolds `.claude/wiki/` in a target and reports a root `wiki/` left by an older scaffold rather than migrating it. A move is a decision the operator owns, since the two roots can both hold pages.
- Porting a guard means porting its side effects. The bash `guard_root` ran `cd "$target"`, which validated the target existed as a by-product of resolving it. A port that reproduces only the stated purpose drops that check, and `mkdir -p` downstream then scaffolds a typo'd path into a new tree.
- Writing a file through `mktemp` then `mv` replaces it rather than editing it, so the destination inherits the temp file's mode. `merge_user_setting` did this to `~/.claude/settings.json` and silently tightened a 644 file to 600 on every run. Editing a file the operator owns means reading its mode first and restoring it after the write, which is what `writeSettings` does.
- Rewriting a config an operator hand-maintains at a different indent width is a diff they did not ask for. `detectIndent` reads the existing width and `serializeSettings` writes it back, so only the changed keys show up in the diff.

## CLI

The command surface and its flags live in `docs/agents.md`. That file is the canonical invocation contract for agents.
