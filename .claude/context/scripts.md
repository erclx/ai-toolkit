---
title: Scripts
description: Bash scripts, lib functions, sandbox hooks
---

# Scripts reference

## Overview

Owns every bash script in the repo: the domain entry points behind each `aitk` command, repo maintenance, sandbox provisioning, and the shared library functions the rest source. The TypeScript side that parses arguments and dispatches here lives in `cli.md`.

## Layout

- `scripts/` owns the domain entry points, one `manage-<domain>.sh` per CLI domain
- `scripts/core/` owns repo maintenance: bootstrap, verify, regen, snapshot, clean
- `scripts/<domain>/` owns the subcommands for that domain, one file per verb. `sync` and `init` have no such folder, and `claude` and `standards` keep only a list command there
- `scripts/lib/` owns shared functions, sourced and never executed directly
- `scripts/sandbox/` owns scenario provisioning, covered in `sandbox.md`

## Decisions

- Entry points are meant to dispatch only, and five of ten do. `claude`, `sandbox`, `sync`, `init`, and `standards` hold their domain logic in the dispatcher instead, because they never grew a verb folder. Read the dispatcher before assuming a command's behavior sits one file down.
- Bash keeps only what it is good at as domains migrate. `read_frontmatter_field` stayed here because the list commands call it once per field inside a loop, where routing through the CLI would cost a process per read. Coarse operations called once per invocation shell into `aitk` instead.
- `log_*` writes to stderr and data goes to stdout, so JSON and lists pipe clean through any wrapper. This is why `--help` is the one exception that prints to stdout.
- Configs always overwrite and seeds preserve user edits. A config is toolkit-owned and a seed grows with the project, so the two need opposite sync behavior.
- The timeline frame opens in the dispatcher rather than in each subcommand. Prompts and `log_*` assume a frame is already open, so opening it at the top prevents dangling output on error paths.

## Gotchas

- Domain scripts require bash 4+. `scripts/lib/ui.sh` guards the version on source and exits with `brew install bash` instructions when stock macOS bash 3.2 is detected.
- `exec` replaces the process and drops the parent trap, so every subcommand re-arms `trap close_timeline EXIT` itself before any early exit, including `--json` paths.
- Subcommand scripts never emit their own `┌`. The dispatcher already did, and a second one produces two frames per invocation.
- The optional rule-name filter in `build_rules_payload` has no caller today. It is kept because the signature is shared surface.
- `TOOLING_STACK_EXCLUDE` currently holds only `claude`. Excluded names print a redirect error pointing at the correct CLI and exit 1.
- When adding a command that calls `select_option` or `ask`, verify the non-interactive path works with `AITK_NON_INTERACTIVE=1`. `select_option` returns its first option under that flag, so the first option must be the one a headless caller should get. Listing a review or preview option first sends agents down an interactive branch, which is how three sync commands ended up opening a diff editor per drifted file.

## Core scripts

| Script             | `bun run`   | What it does                                                                                                      |
| ------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------- |
| `bootstrap.sh`     | `bootstrap` | Installs deps, links the CLI globally, and appends the Claude Code aliases to `~/.zshrc`. Idempotent, re-runnable |
| `verify.sh`        | `check`     | Runs format, format check, index drift, consumed-copy drift, skill-reference drift, spell, shell, and tests       |
| `update.sh`        | `update`    | Interactive dep update via `bun update --interactive`, then verify                                                |
| `clean.sh`         | `clean`     | Wipes `node_modules/`, clears bun cache, reinstalls from lockfile                                                 |
| `snapshot.sh`      | `snapshot`  | Writes project file tree to `.claude/.tmp/project/PROJECT-SNAPSHOT.md` for Claude chat context                    |
| `regen-indexes.sh` |             | Thin wrapper calling `aitk indexes regen` by path so a linked worktree uses its own CLI                           |

CI runs only the format, spell, and shell stages. The drift checks and the test suite are enforced by the pre-push hook alone. See `ci.md`.

## manage-sync.sh

`aitk sync [target]` runs all installed domain syncs in sequence (standards, snippets, governance, claude), then runs a git workflow step. The git workflow detects which domains changed, shows a preview of the commit and PR body, then prompts with three options: "Commit and open PR" (creates `chore/toolkit-sync-YYYYMMDD-HHMM`, commits, pushes, opens a PR via `gh`), "Commit only" (commits onto the current branch when on a feature branch, or creates the timestamped branch first when on `main`/`master`), and "Cancel" (skips the workflow entirely). The PR body lists up to three changed filenames per domain, then a count for the rest.

Claude sync runs under `AITK_NON_INTERACTIVE=1` so the embedded call does not prompt. The combined PR preview is the single confirmation gate. `aitk claude sync` writes only `.gitignore`, so the changed-file tracking watches that path and a gitignore-only change still reports under a `claude/` domain line. Seed audits stay a manual step through the `claude-seed-sync` skill. `aitk sync` prints a tip pointing at the skill when `.claude/` is present.

Governance sync also removes any stale `.claude/GOV.md` left from earlier installs. The retired surface is no longer rebuilt.

The git workflow step is skipped if the target is not a git root (no `.git/`). When `gh` is not installed the PR option is hidden but Commit only still works. The timestamped branch name normally avoids collisions. If the chosen name already exists locally or on the remote the workflow stops with a warning.

## UI framing across exec boundaries

`scripts/manage-gov.sh` is the reference manager. It opens the frame unconditionally in `main()`, and its verb scripts set their own EXIT trap and emit section headers via `log_step` without ever emitting `┌`.

The tooling domain no longer has a dispatcher. `src/commands/tooling.ts` registers each verb directly, handling `sync`, `inject`, and `prune-gitignore` in TypeScript and shelling out to `scripts/tooling/{ref,create,list,verify}.sh` for the rest.

A TypeScript command that both bash and users invoke owns its frame and takes `--nested` to suppress it. `aitk tooling inject` frames itself so direct invocation does not emit dangling `│` lines, while `manage-claude.sh` and the tooling sandbox scenarios pass `--nested` because they have already opened one. This is the same split `VERIFY_NESTED` makes in `scripts/core/verify.sh`. A migrated domain keeps the same frame because `src/ui.ts` mirrors `lib/ui.sh`.

See `docs/agents.md` for the canonical output shape this framing produces, and the `bash-script` plugin skill for the authoring contract when generating new domain scripts.

## lib

### `ui.sh`

Source this in any script that needs terminal output. When `AITK_NON_INTERACTIVE=1` is set, `select_option` auto-selects the first option and `ask` returns the default without blocking. `select_or_route_scenario` reads `SANDBOX_SCENARIO` and skips the picker when set, letting agents target a specific scenario via `aitk sandbox <cat>:<cmd> <scenario>`. Also provides the color palette.

| Function                                                              | What it does                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `open_timeline`, `close_timeline`                                     | Open `┌` (with optional banner) and close `└` on stderr. Pair with `trap … EXIT`.          |
| `log_info`, `log_warn`, `log_error`, `log_step`, `log_add`, `log_rem` | Framed log lines on stderr. `log_error` exits 1.                                           |
| `select_option`                                                       | Interactive picker. Sets `SELECTED_OPTION`. Errors with a framed message on non-TTY stdin. |
| `ask`                                                                 | Prompt for a value with a default. Exports the result to a named variable.                 |
| `select_or_route_scenario`                                            | Sandbox-aware picker. Skips when `SANDBOX_SCENARIO` is set.                                |
| `guard_root`                                                          | Rejects the toolkit root as a target.                                                      |
| `require_project_root`                                                | Errors when run outside the repo or inside a sandbox.                                      |

### `gov.sh`

Sourced by `gov/build.sh`. Do not duplicate this logic if adding a second consumer.

| Function              | What it does                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `build_rules_payload` | Concatenate rule `.md` files into a temp file with frontmatter stripped. Optional space-separated filter narrows to named rules. Returns path. |
| `strip_frontmatter`   | Strip the YAML frontmatter block from a markdown file. Emit the rest to stdout.                                                                |

### `tooling.sh`

Consumed by `scripts/tooling/{list,ref,sync,create}.sh` for discovery and name validation. Any future folder under `tooling/` that is not a real stack routes through the same helper.

| Function                    | What it does                                                     |
| --------------------------- | ---------------------------------------------------------------- |
| `list_tooling_stacks`       | Emit names of every directory under `tooling/`, minus excluded.  |
| `is_tooling_stack_excluded` | Return 0 if the name is in `TOOLING_STACK_EXCLUDE`, 1 otherwise. |

### `frontmatter.sh`

Sourced by `scripts/docs/list.sh`, `scripts/standards/list.sh`, and `scripts/core/regen-skill-references.sh`. The index engine that used to sit alongside this function is TypeScript now, in `src/indexes/`.

| Function                 | What it does                                                                  |
| ------------------------ | ----------------------------------------------------------------------------- |
| `read_frontmatter_field` | Read a YAML field from a markdown file's frontmatter. Strips wrapping quotes. |
