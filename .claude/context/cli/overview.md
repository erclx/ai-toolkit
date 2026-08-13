---
title: Overview
description: What the CLI domain owns, the folder layout, and the gotchas that cross every command
---

# Overview

`src/` is the TypeScript CLI entry point. It uses commander to register subcommands and execa to dispatch most of them to the corresponding `manage-*.sh` script in `scripts/`. Domains are being migrated off bash one at a time. Use `@/` absolute imports, mapped to `src/` in `tsconfig.json`.

The layer boundary: TypeScript owns argument parsing plus every migrated domain, and bash owns what has not moved yet. See `.claude/context/scripts/index.md` for the bash side.

## Layout

- `src/` owns the entry point (`cli.ts`), the package root every other module resolves against (`project-root.ts`), the exec helper that spawns bash (`exec.ts`), the shared terminal UI matching `lib/ui.sh` style (`ui.ts`), and the cross-domain file and GitHub helpers
- `src/commands/` owns one file per `aitk` subcommand, each one not yet migrated a thin pass-through to a `manage-*.sh` script
- `src/design/`, `src/slides/`, `src/transcripts/` own the domains built TS-first, documented as feature entries in `.claude/context/design.md`, `.claude/context/slides.md`, and `.claude/context/transcripts.md`
- `src/indexes/` owns the index engine, documented in `.claude/context/indexes.md`
- `src/tooling/` owns the tooling inject and scan engine, documented in `.claude/context/tooling.md`
- `src/sync/` owns the sync engine, the `aitk sync` git workflow, the install stamp, and the drift report, with the per-domain adapters in `src/gov/`, `src/snippets/`, and `src/standards/`
- `src/init/` owns the `aitk init` option surface, the preview and count, the domain step list, and the partial-failure runner
- `src/docs/` and `src/wiki/` own the two read-only domains, which reach for no shared engine because neither syncs into a target
- `src/claude/` owns seed planning, the gitignore preview, and the user settings merge
- `src/tasks/` owns the task-board archive, the one domain whose primary caller is a git hook rather than a person, and the two record verbs a skill reaches for when worktree isolation refuses its own write
- `src/worktree.ts` owns `mainWorktreeRoot()`, which every shared-scratch verb resolves its root through. It sat duplicated in the tasks and records command files until a third caller was due
- `src/comments/` owns the comment census, reasoned about in `.claude/context/cli/audits.md`
- `src/context/` owns the context-folder audit, reasoned about alongside it
- `src/markdown/` owns the attribute-standard audit, reasoned about alongside both, and the fence walker every other markdown reader now shares
- `src/git-files.ts` owns `listRepositoryFiles()`, the tracked-plus-untracked listing the citation check and the markdown corpus both take their file set from
- `src/capture/` owns the documentation capture render, the one folder under `src/` the package excludes

## Gotchas

### Wiring and output

- Exit and stream discipline moved to `internal/rules/core/095-cli-output.md`, which globs `src/**/*.ts` so it loads on an edit here rather than waiting to be looked up. It holds the `process.exitCode` requirement and the stderr-in-every-mode rule.
- Exit-code coverage spawns the CLI from `src/commands/exit-code.test.ts`, because an action imported in process would set the code on the test runner. The two `feedback.ts` branches gated on `isToolkitSource` need a copy of `src/` under a temp root, since `PROJECT_ROOT` resolves from the CLI's own location rather than from the working directory.
- A linked worktree carries an empty `node_modules` and resolves packages from an ancestor, so a fixture symlinking `node_modules` walks up for the populated one rather than naming the repository root.
- The `feedback` guard on `process.stdin.isTTY` is the one error path a pipe cannot reach. `script -qec` allocates a pty and forwards the child status, both util-linux spellings, so that case skips off Linux.
- `Bun.Glob` has no exclude option. A walker that must skip vendored trees filters scanned paths by segment, and forgetting to leaves the skip silently absent wherever `git check-ignore` is unavailable.
- A bare positional and a subcommand coexist on one command: `aitk docs list` resolves to the subcommand and `aitk docs agents` falls through to the positional. This is what preserves the bash shorthand where any non-verb argument means `get`. A doc named after a verb would be shadowed, which the bash `case` did too. `aitk standards <name>` takes the same shape, so a standard sharing a subcommand's name is the same trade there.
- Registering an action on a parent carrying subcommands replaces commander's own no-action fallback, which writes help to stderr and exits 1. `outputHelp()` defaults to stdout, so the bare path has to pass `{ error: true }` or the help block lands in the data stream.
- A topic resolves against two spellings, `<dir>/<topic>.md` and `<dir>/<topic>/index.md`, so a domain that outgrows one file keeps the name its callers already type. The file wins when both exist, and a folder with no `index.md` resolves to nothing because the catalog is what reaches the sub-areas. Both listers pin their own depth, so a split domain needs a folder pass added to each.
- `PROJECT_ROOT` derives from `import.meta.url` rather than Bun's `import.meta.dir`, which the test runner leaves undefined and which made the module holding it throw on import there. Both spellings resolve the same directory under Bun, so the derivation is the whole of the change and it is what puts a module reading the package root within reach of a test.
- The constant sits in `src/project-root.ts` rather than beside `execScript`, since a path constant and a process spawn share no reason to change. Importing it from `exec.ts` loaded `execa` to read one string, which is what `040-performance` bans, and the eleven modules wanting the root and no subprocess were paying it.
- An engine module still takes the toolkit root as a parameter wherever the caller's root decides the answer, which keeps root resolution in the command layer. `src/standards/read.ts` is the one module holding both: a project root it is handed, and the package root it imports as the last-resort search behind it, so a standard resolves in a project that installed none. Tests build fixtures with `mkdtempSync(join(tmpdir(), 'aitk-<domain>-'))`, which for that module is also the only place the package root is separable from the authoring root.

### Writing into a tree someone else owns

- `src/wiki/` scaffolds `.claude/wiki/` in a target and reports a root `wiki/` left by an older scaffold rather than migrating it. A move is a decision the operator owns, since the two roots can both hold pages.
- Porting a guard means porting its side effects. The bash `guard_root` ran `cd "$target"`, which validated the target existed as a by-product of resolving it. A port that reproduces only the stated purpose drops that check, and `mkdir -p` downstream then scaffolds a typo'd path into a new tree.
- Preserving a destination's mode and indent width moved to `internal/rules/core/096-operator-files.md`, which globs `src/**/*.ts`. `writeSettings` is the live implementation of the mode half, after `merge_user_setting` silently tightened `~/.claude/settings.json` from 644 to 600 on every run, and `detectIndent` plus `serializeSettings` are the indent half.

## CLI

The command surface and its flags live in `docs/agents/`. That folder is the canonical invocation contract for agents.
