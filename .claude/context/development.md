---
title: Development
description: Local dev workflow, scripts, and husky hooks
---

# Development

## Overview

Owns the local development loop: toolchain setup, the run commands, and the git hooks that gate commits and pushes. CI runs the same stages through `bun run check:ci`, covered in `ci.md`. Domain behavior for what each script does lives in the entry for that domain. `CONTRIBUTING.md` at the repository root states the contributor-facing subset of this entry and points back here for the rest.

## Layout

- `scripts/` owns every shell script except the Claude Code hooks, grouped into a folder per domain
- `.claude/hooks/` owns the Claude Code hooks
- `.husky/` owns the git hooks

## Setup

- Install [Bun](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`
- Install bash 4+ on macOS: `brew install bash`.
- Install dependencies: `bun install`

## Scripts

| Command                 | Purpose                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `bun run check`         | Verification scoped to changed files. Auto-formats, regenerates indexes, asserts clean.  |
| `bun run check:ci`      | Every stage via `--all`, asserting formatting instead of applying it. Still regenerates. |
| `bun run check:format`  | Read-only prettier and shfmt format check.                                               |
| `bun run check:spell`   | Read-only cspell check against project dictionaries.                                     |
| `bun run check:shell`   | Read-only shellcheck against `scripts/`, `tooling/`, and `.claude/hooks/`.               |
| `bun run check:types`   | Read-only `tsc --noEmit` against `src/`.                                                 |
| `bun run check:install` | Clones the repo to tmp and asserts `aitk init` lands a fresh scaffold.                   |
| `bun run format`        | Auto-fix prettier and shfmt formatting.                                                  |
| `bun run clean`         | Wipe `node_modules/`, clear bun cache, reinstall.                                        |
| `bun run update`        | Interactive `bun update` followed by verification.                                       |
| `bun run snapshot`      | Snapshot project state for diffs.                                                        |

## Scoped verification

`bun run check` gates three stages on the changed-file set. Shell runs on any `.sh` change, types and tests on any `src/` change. Format, spelling, and the three regeneration stages always run, because their inputs are diffuse. Skipping tests, types, and shell on a markdown-only edit drops roughly 16 of the 31 CPU-seconds measured across the gate, and the test suite alone accounts for most of that.

The changed set unions the branch diff against the merge base with `origin/main`, the working tree, and untracked files, which matches what a pull request will contain. Every fallback widens rather than narrows. A missing merge base runs every stage.

The baseline is `origin/main` and not local `main` for a reason. On `main` itself the local ref is HEAD, so the merge base resolves to HEAD and every commit not yet pushed drops out of the changed set. `pre-push` would then skip the scoped stages on a direct push to `main`, which `.github/workflows/verify.yml` does not catch either, because it triggers on `pull_request` and `workflow_dispatch` and never on push. Comparing against the remote ref keeps committed work visible. When `origin/main` does not resolve, which happens transiently during a concurrent `fetch --prune`, the fallback to local `main` treats a merge base equal to HEAD as a signal to run every stage.

Pass `--all` to force the full suite, and `--help` to print the argument list. `bun run check:ci` passes `--all`, so CI stays the backstop for a wrong local scoping decision on the pull request path.

Measure CPU seconds and not wall clock when judging a stage's cost. The suite fans 415 tests across every core, so it is the most expensive stage and among the fastest, and ranking by wall time hides it. Test-count growth is invisible in wall time and linear in CPU.

## Manifest validation

The Plugin manifests stage runs `claude plugin validate --strict` over every plugin and marketplace manifest the repository carries. It always runs, because a manifest edit is not the only thing that invalidates one and the whole stage costs about a third of a second.

It discovers its inputs instead of naming them. Two `git ls-files` listings, tracked and untracked, match `*.claude-plugin/plugin.json` and `*.claude-plugin/marketplace.json`, so a marketplace manifest added later is covered the day it lands with no edit to the script. Both listings honor `.gitignore`, which is what keeps linked worktrees and dependency copies from being validated as if they were ours.

The stage is guarded on `claude` resolving on `PATH` and reports a skip when it does not. CI installs the JavaScript runtime and two shell tools and nothing else, so an unguarded stage would fail the build on a machine that never had the plugin CLI. The guard makes the stage an author-side gate that CI does not currently reach.

`--strict` promotes warnings to failures, which is what makes the stage catch a manifest missing metadata rather than only one that fails to parse. The cost is that a Claude Code release introducing a new warning fails `bun run check` for everyone until the manifest answers it.

## Gotchas

- `bun run check:install` runs `git clone` on the project root, so it verifies the last commit and never the working tree. An uncommitted fix, or an uncommitted regression, is invisible to it. Commit first or the result describes code you are not shipping.
- That gate's assert loop is the only thing between a silently truncated install and a green run, because `runDomains` in `src/init/run.ts` catches a failed domain and lets init report the ones that worked. Every domain init installs needs at least one asserted path, or that domain can install nothing while the gate stays green.
- The gate runs `aitk init --stack base` rather than a bare `init`, which now resolves to the same install since `base` is the default. The explicit flag stays because it pins what the assertions cover rather than inheriting whatever the default becomes. A domain that installs conditionally needs its condition met in the gate invocation, beyond having a path in the loop.
- Nothing typechecked until `check:types` was added, so a dropped import shipped green through format, spell, shell, and the test suite. The suite catches one only where a test covers the caller, and the migration keeps adding untested call sites. Declare `typescript` in `devDependencies` rather than relying on it hoisting from an astro peer, or the gate resolves by accident.

## Shell scripts

All `.sh` files live under `scripts/`, except Claude Code hooks, which live in `.claude/hooks/`. Do not place shell scripts anywhere else.

## Claude hooks

`.claude/hooks/` holds the toolkit's own Claude Code hooks, wired through `.claude/settings.json`. Three carry the same names and behavior as the hooks `aitk claude init` seeds from `tooling/claude/seeds/.claude/hooks/`, covered in `claude-plugin/cli.md`.

`dev-command-reminder.sh` is toolkit-only and has no seed counterpart. It fires once per session when a `Bash` command runs `check`, `format`, or `check:install`, and points the agent at this entry. The matcher tests the command string rather than the tool name, because `Bash` is the highest-frequency tool in a session and a loose matcher would add latency to every shell call. It stays silent on `check:types` and `test`, which need no reminder.

The filter, the match, and the session id come out of one `jq` pass, so the hot path costs a single process and the second `jq` runs only when the hook actually fires. Splitting the fields through `@tsv` instead looks equivalent and is not: `@tsv` escapes a newline to a literal `\n`, which puts a backslash where the matcher expects whitespace or end of string, and every multi-line command stops matching. A run with no `session_id` exits rather than sharing one marker file, since per-session dedupe needs a real id.

`bare-flag-repair.sh` shares the `Bash` matcher and clears `core.bare` when worktree entry has left it set. Git refuses every operation while the flag is on, which puts `post-checkout` and the rest of the husky hooks out of reach, so a tool call is the only event that still fires ahead of the command that would fail. `verify.sh` keeps its own call to the same repair, but a planning or review session reads git constantly and runs the suite never, so the suite alone leaves such a session broken for its whole length.

The hook writes to the shared git config as a side effect of an unrelated `Bash` call, so it announces the repair through `additionalContext` rather than clearing the flag silently. It sources `repair_bare_flag` from `scripts/lib/worktree.sh` rather than restating the predicate, and stubs `log_warn` before the source so the library warning lands in a variable instead of on stdout, where an unframed line corrupts the hook protocol. The flag read comes first and costs one process, ahead of the payload parse, because every invocation but a handful stops there. That measured at roughly 2ms against 3.6ms for `dev-command-reminder.sh` on the same matcher, so the two stay separate hooks.

`check:shell` lints `.claude/hooks/` alongside `scripts/` and `tooling/`. It has to, because the shell stage is gated on any `.sh` change. Linting a narrower set than the gate keys on produces a stage that fires on a hook edit, inspects other directories, and reports a pass that says nothing about the file that triggered it. Keep the glob and the gate pattern in step whenever either moves.

## Husky hooks

- `pre-commit` runs `lint-staged` (prettier, cspell, shfmt, shellcheck on staged files).
- `commit-msg` runs `commitlint` against the conventional commit format.
- `pre-push` runs `bun run check`. After pushing, run `git status`. If files changed, commit the diff as `style(<scope>):` and push again.
- `post-merge` archives the task each merged pull request closed and stays silent otherwise. It is the only trigger that fires after a merge, covered in `claude-plugin/skills.md`. It reads `ORIG_HEAD..HEAD` rather than the tip, since one pull routinely fast-forwards over several merges and reading `git log -1` would strand every task but the last.
- `post-rewrite` delegates to `post-merge` on the `rebase` argument, so a `pull.rebase=true` machine gets the same check. It exits on `amend`, which rewrites nothing on the board.

Husky runs every hook as `sh -e "$hook"`, so the shebang on both is advisory and the file is POSIX sh under errexit whatever it declares. A bare `grep` that matches nothing aborts the hook and prints a husky failure on a clean pull, which is why each test sits inside an `if` condition rather than standing alone. Errexit exempts a condition and nothing else.

`check:shell` globs `*.sh` under `scripts`, `tooling`, and `.claude/hooks`, so no husky hook is linted. That cost nothing while all three were one-liners and now leaves two real scripts uncovered. Run `shellcheck --shell=sh .husky/post-merge .husky/post-rewrite` by hand after editing either.

## Session scratch

`.claude/plans/`, `.claude/review/`, `.claude/memory/`, and `.claude/tasks/` are gitignored and live at the main worktree root. A linked worktree resolves them there rather than writing its own copy.

The task board is a folder of one file per task, which is what keeps two concurrent sessions from overwriting each other on a board that has no history to recover from. Its `index.md` is regenerated by a `PostToolUse` hook rather than by `bun run check`, because the whole-repo index walk filters candidates through `git check-ignore` and so never sees a gitignored folder. Positional regen reaches it, since the walk-up never consults git.

A plan that ships moves to `.claude/.tmp/plans-archive/` under its original name, swept there by `claude-docs`. Deletion was the earlier policy and cost a shipped plan outright, because `.claude/plans/` is gitignored and nothing backs it up. A re-shipped slug overwrites the earlier file, which keeps the folder holding intact plans under the names they were written with.

A task that ships moves to `.claude/.tmp/task-archive/` the same way, through `aitk tasks archive`. The `Pull request:` line `git-pr` writes onto the task is what lets the merge close it, since every merge on `main` is a squash carrying that number in its subject while the branch name never lands. The command owns the move, the `priority.md` row removal, and the index regen as one unit, so the hook and `claude-tasks` cannot archive differently.
