---
title: Scripts
description: Bash scripts, lib functions, sandbox hooks
---

# Scripts reference

## Overview

Owns every bash script in the repo: the domain entry points behind each `aitk` command, repo maintenance, sandbox provisioning, and the shared library functions the rest source. The TypeScript side that parses arguments and dispatches here lives in `cli.md`.

## Layout

- `scripts/` owns `manage-sandbox.sh`, the one remaining entry point. Every other domain dispatcher has been deleted
- `scripts/core/` owns repo maintenance: bootstrap, verify, regen, snapshot, clean
- `scripts/<domain>/` owns the subcommands for that domain, one file per verb. `standards`, `gov`, and `docs` keep only a list command there, `claude` keeps nothing, and `snippets` and `tooling` keep only authoring helpers
- `scripts/gov/`, `scripts/snippets/`, `scripts/standards/`, and `scripts/tooling/` hold verbs with no dispatcher above them. Their domains are TypeScript now and `src/commands/` routes into what is left
- `scripts/lib/` owns shared functions, sourced and never executed directly
- `scripts/sandbox/` owns scenario provisioning, covered in `sandbox.md`

## Decisions

- `manage-sandbox.sh` is the last entry point and stays bash permanently by decision. It holds its domain logic in the dispatcher rather than in a verb folder, so read it before assuming a scenario's behavior sits one file down.
- A migrated domain loses its dispatcher entirely. `tooling/`, `gov/`, `snippets/`, `standards/`, and `claude/` still hold the verb scripts that have not moved, but nothing in `scripts/` routes to them. `src/commands/<domain>.ts` does.
- A dispatcher holding domain logic migrates in one pull request per file rather than verb by verb. `sync`, `init`, and `standards` went together because they shared the two documents listing dispatchers, and splitting them would have collided there for no review benefit.
- A dispatcher that grew domain logic migrates that logic out to `src/<domain>/` rather than into the command file. `manage-claude.sh` was the largest single script at 465 lines and held seed collection, gitignore scanning, and a settings merge, none of which a command file can unit-test because `src/exec.ts` throws under vitest.
- Bash keeps only what it is good at as domains migrate. `read_frontmatter_field` stayed here because `gov/list.sh`, `docs/list.sh`, and `standards/list.sh` call it once per field inside a loop, where routing through the CLI would cost a process per read. Coarse operations called once per invocation shell into `aitk` instead.
- A recorded verdict is only as wide as its own reasoning. The frontmatter-loop cost above was applied to all six list verbs, and three of them never paid it: `snippets/list.sh` and `claude/seeds-list.sh` read with plain `read -r` loops and `tooling/list.sh` used `awk`. Those three migrated. Check a stated reason against each file before counting one as settled.
- The four remaining verb scripts stay bash because of who calls them, not how large they are. `tooling/verify.sh`, `tooling/ref.sh`, `snippets/create.sh`, and `tooling/create.sh` are toolkit-internal authoring helpers a human runs at a terminal here. They write nothing into a target and no skill consumes them, so they carry none of the agent-path obligations that moved the other five.
- `log_*` writes to stderr and data goes to stdout, so JSON and lists pipe clean through any wrapper. This is why `--help` is the one exception that prints to stdout.
- Configs always overwrite and seeds preserve user edits. A config is toolkit-owned and a seed grows with the project, so the two need opposite sync behavior.
- The timeline frame opens in the dispatcher rather than in each subcommand. Prompts and `log_*` assume a frame is already open, so opening it at the top prevents dangling output on error paths.

## Gotchas

- Domain scripts require bash 4+. `scripts/lib/ui.sh` guards the version on source and exits with `brew install bash` instructions when stock macOS bash 3.2 is detected.
- `exec` replaces the process and drops the parent trap, so every subcommand re-arms `trap close_timeline EXIT` itself before any early exit, including `--json` paths.
- Subcommand scripts never emit their own `┌`. The dispatcher already did, and a second one produces two frames per invocation.
- Deleting a bash file needs a sweep by path (`source`, `exec`, `bash <path>`), not by function name. Twelve sandbox scripts sourced `lib/inject.sh` without calling any of its functions, and a sweep by function name missed every one of them along with five live `exec` sites.
- `TOOLING_STACK_EXCLUDE` currently holds only `claude`. Excluded names print a redirect error pointing at the correct CLI and exit 1.
- When adding a command that calls `select_option` or `ask`, verify the non-interactive path works with `AITK_NON_INTERACTIVE=1`. `select_option` returns its first option under that flag, so the first option must be the one a headless caller should get. Listing a review or preview option first sends agents down an interactive branch, which is how three sync commands ended up opening a diff editor per drifted file.
- A picker that stands in for a required argument must refuse headlessly rather than default. The confirm-then-apply prompts keep `nonInteractiveDefault`, since the caller already named what to apply. `aitk gov install` and `aitk snippets install` return 1 with the valid names when the argument is missing, because defaulting there picked a whole stack or category for the caller.
- `check-skill-paths.sh` scans `claude/skills/**` after `regen-skill-references.sh` has written into it, so a `wiki/` reference added to a `standards/bundled/*.md` file fails the stage against a generated copy the author cannot edit in place. The failure message names `standards/bundled/` for that reason. The same shape reaches `assert_no_drift`, which is scoped by folder glob and so flags a hand-authored file such as `claude/skills/setup-plugins/references/plugin-catalog.md` with a message about regenerated files.

## Core scripts

| Script                 | `bun run`   | What it does                                                                                                                         |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `bootstrap.sh`         | `bootstrap` | Installs deps, links the CLI globally, and appends the Claude Code aliases to `~/.zshrc`. Idempotent, re-runnable                    |
| `verify.sh`            | `check`     | Format, three drift stages, the skill-path guard, and spell always run. Shell, types, and tests gate on changed files unless `--all` |
| `update.sh`            | `update`    | Interactive dep update via `bun update --interactive`, then verify                                                                   |
| `clean.sh`             | `clean`     | Wipes `node_modules/`, clears bun cache, reinstalls from lockfile                                                                    |
| `snapshot.sh`          | `snapshot`  | Writes project file tree to `.claude/.tmp/project/PROJECT-SNAPSHOT.md` for Claude chat context                                       |
| `regen-indexes.sh`     |             | Thin wrapper calling `aitk indexes regen` by path so a linked worktree uses its own CLI                                              |
| `check-skill-paths.sh` |             | Fails when a file under `claude/skills/` references a `wiki/` path, which resolves to nothing in a target                            |

CI runs every stage through `bun run check:ci`, which passes `--all`. The local run scopes shell, types, and tests to the changed-file set, so it is the weaker of the two. See `ci.md`.

## UI framing across exec boundaries

No domain has a dispatcher any more. `src/commands/tooling.ts` handles `sync`, `inject`, `prune-gitignore`, and `list` in TypeScript and shells out for `ref`, `create`, and `verify`. `src/commands/gov.ts` handles `install`, `sync`, and `build`, and shells out for `list` alone. `src/commands/standards.ts` handles `install` and `sync`, and shells out for `list` alone. `src/commands/snippets.ts` handles `install`, `sync`, and `list`, and shells out for `create` alone. `src/commands/claude.ts` is TypeScript end to end, as are `sync` and `init`, which reach no verb script at all.

`scripts/standards/list.sh` sets its own EXIT trap and emits section headers via `log_step` without ever emitting `┌`, which is what lets the command layer above it own the frame.

A migrated list verb has to open that frame itself, and the gap is easy to miss because it only shows through the CLI. The bash verb never emitted `┌`, so a baseline captured by running the script directly matches a frameless port exactly while `aitk snippets list` loses the header `registerPassThroughVerbs` used to print. Capture equivalence baselines at the boundary the user invokes, not at the script.

`claude seeds list` is a real Commander subcommand rather than the hand-rolled routing it replaced. That routing existed only because the verb's script was `scripts/claude/seeds-list.sh` where `registerPassThroughVerbs` builds `scripts/<domain>/<verb>.sh`. The parent `seeds` command keeps an action handler so an unknown or missing subcommand still reports the two errors the bash `case` emitted, since Commander falls through to the parent when no subcommand name matches.

Deleting a dispatcher moves the responsibility for opening the frame, because a bash verb script closes a frame it never opened. `src/commands/gov.ts` calls `intro('aitk gov')` before it execs a pass-through, taking over the job the dispatcher used to do. It skips the call when the args carry `-h` or `--help`, since a help screen prints its own frame.

A TypeScript command that both bash and users invoke owns its frame and takes `--nested` to suppress it. `aitk tooling inject` frames itself so direct invocation does not emit dangling `│` lines, while the tooling sandbox scenarios pass `--nested` because they have already opened one. This is the same split `VERIFY_NESTED` makes in `scripts/core/verify.sh`. A migrated domain keeps the same frame because `src/ui.ts` mirrors `lib/ui.sh`.

Once both sides of a call are TypeScript the flag stops being needed at all. `aitk claude` used to shell into `aitk tooling inject --gitignore --nested`, and now calls `injectGitignore` directly inside the already-open frame, which drops a process per invocation.

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

Narrowed to one function. The payload builder that used to live here is `src/gov/payload.ts`, and `strip_frontmatter` is `src/frontmatter.ts`.

| Function      | What it does                                                                                           | Fate                   |
| ------------- | ------------------------------------------------------------------------------------------------------ | ---------------------- |
| `rule_subdir` | Emit a source rule's subdirectory relative to the rules root, or empty when the rule sits at the root. | Stays bash permanently |

`rule_subdir` has three remaining callers and all are sandbox scripts, which stay bash by decision. `ruleSubdir` in `src/gov/install.ts` is the TypeScript copy the migrated installer uses. The two must agree, since a rule installed to the wrong subdirectory is one the sandbox scenarios then fail to find.

The bash `strip_frontmatter` treated the first `---` on any line as the start of a frontmatter block, so a document whose body carried two horizontal rules lost everything between them. `stripFrontmatter` in `src/frontmatter.ts` anchors to the first line instead and leaves such a body intact. The docs migration took the TypeScript reading, which means `aitk docs <topic>` now emits sections the bash silently swallowed.

The divergence is latent on the current corpus. All 22 documents under `docs/` and `.claude/context/` strip byte-identically under both, so the fix guards documents not yet written rather than repairing today's output. Three other inputs diverge and each favors the TypeScript: a file with no trailing newline, a block opening on line 2, and an unterminated block. The last two are the ones worth knowing, since the bash emitted nothing at all for an unterminated block and swallowed a mid-document block that was never frontmatter.

### `tooling.sh`

Consumed by `scripts/tooling/{ref,verify,create}.sh` for discovery and name validation. `listStacks` in `src/tooling/manifest.ts` is the TypeScript equivalent, and it discovers by `manifest.toml` rather than by directory.

| Function                    | What it does                                                     |
| --------------------------- | ---------------------------------------------------------------- |
| `list_tooling_stacks`       | Emit names of every directory under `tooling/`, minus excluded.  |
| `is_tooling_stack_excluded` | Return 0 if the name is in `TOOLING_STACK_EXCLUDE`, 1 otherwise. |

### `frontmatter.sh`

Sourced by `scripts/docs/list.sh`, `scripts/standards/list.sh`, and `scripts/core/regen-skill-references.sh`. The index engine that used to sit alongside this function is TypeScript now, in `src/indexes/`.

| Function                 | What it does                                                                  |
| ------------------------ | ----------------------------------------------------------------------------- |
| `read_frontmatter_field` | Read a YAML field from a markdown file's frontmatter. Strips wrapping quotes. |
