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

`bun run check` gates three stages on the changed-file set. Shell runs on any `.sh` change, types and tests on any `src/` change. Format, spelling, and the four regeneration stages always run, because their inputs are diffuse. Skipping tests, types, and shell on a markdown-only edit drops roughly 16 of the 31 CPU-seconds measured across the gate, and the test suite alone accounts for most of that.

The changed set unions the branch diff against the merge base with `origin/main`, the working tree, and untracked files, which matches what a pull request will contain. Every fallback widens rather than narrows. A missing merge base runs every stage.

The baseline is `origin/main` and not local `main` for a reason. On `main` itself the local ref is HEAD, so the merge base resolves to HEAD and every commit not yet pushed drops out of the changed set. `pre-push` would then skip the scoped stages on a direct push to `main`. `.github/workflows/verify.yml` now catches that case, since it triggers on pushes to `main` as well as on pull requests, but it catches it after the push rather than before. Comparing against the remote ref keeps committed work visible. When `origin/main` does not resolve, which happens transiently during a concurrent `fetch --prune`, the fallback to local `main` treats a merge base equal to HEAD as a signal to run every stage.

Pass `--all` to force the full suite, and `--help` to print the argument list. `bun run check:ci` passes `--all`, so CI stays the backstop for a wrong local scoping decision on the pull request path.

Measure CPU seconds and not wall clock when judging a stage's cost. The suite fans 415 tests across every core, so it is the most expensive stage and among the fastest, and ranking by wall time hides it. Test-count growth is invisible in wall time and linear in CPU.

## Consumed copies

The Consumed copies stage runs `scripts/core/regen-claude-copies.sh` and then asserts no drift across `.claude/standards`, `.claude/snippets`, `.claude/internal`, and `.claude/rules`. Regenerating and then asserting is what turns an edit to a source surface into a failure that names the copy, rather than a stale copy nothing reads as wrong.

Three of the four are whole-directory mirrors. `.claude/rules/` is not, because the toolkit authors 38 rules and consumes 22 of them, and installing the framework and ui rules here would fire a React rule on a fixture this repository writes. It resolves through `aitk gov regen` instead, which reads the stack named in `internal/governance.toml` and installs it with the same machinery `aitk gov install` uses for a target.

The producer clears `.claude/rules/` before installing, so a rule dropped from the record disappears rather than lingering as an unsourced file. That is also why `internal/rules/` exists: a rule governing toolkit authoring alone needs a source somewhere outside `governance/rules/`, which ships to every target. The internal mirror excludes `internal/rules/` so those rules land at one path rather than two.

## Hero

The Hero stage runs `scripts/core/regen-hero.sh`, which fills `assets/hero.html.tmpl` from five catalogs and writes `assets/hero.html`, then asserts no drift on that file. It is the same regenerate-then-assert shape as Consumed copies, applied to a documentation image so no count on the README frame is maintained by hand.

The assert covers the HTML and not the PNG beside it. A capture is a chromium render whose bytes move with the browser version, so asserting the image would fail on a machine whose browser differs rather than on a stale count. A second assert closes the gap that leaves without rendering anything: the two files move together or the image is stale, so their last-touching commit has to be the same commit. Comparing the branch's changed-file list instead would pass any branch that touched both somewhere, including one that regenerated the HTML alone in a later commit. The cost is that a capture cannot ship as a follow-up commit, so regenerate, capture, and commit both files in one step.

The frame carries no version number. `package.json` is bumped on `main` by the release tooling, and a pull request builds against the merge commit, so an embedded version drifts on every open branch the moment a release lands and the stage then fails for work that touched nothing. Counts have the same shape and are kept, because a catalog change is what the stage exists to catch and the branch that changes a catalog is the one that goes red.

`assets/hero.html` is in `.prettierignore` because the stage and the formatter would otherwise both own it and serialize it differently. The Format stage runs first and rewrites the file, the Hero stage rewrites it back, and the drift assert then reports against whichever version was committed last. The pre-push hook reformats and asks for the result to be committed as `style(<scope>):`, which is exactly the path that would commit the formatter's version and deadlock the stage. One writer per generated file is the rule the entry beside it already applies to the release tooling.

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
- The Indexes stage asserts drift against the working tree, so the first `bun run check` after a frontmatter edit reports its own regeneration as drift and exits red. Stage or commit the rewritten `index.md` and run again. This is the same regenerate-then-assert shape as Consumed copies and Hero, with the difference that the walk writes files the session never opened, so the failure names work nobody did by hand.

## Shell scripts

All `.sh` files live under `scripts/`, except Claude Code hooks, which live in `.claude/hooks/`. Do not place shell scripts anywhere else.

## Claude hooks

`.claude/hooks/` holds the toolkit's own Claude Code hooks, wired through `.claude/settings.json`. Five carry the same names as the hooks `aitk claude init` seeds from `tooling/claude/seeds/.claude/hooks/`, covered in `claude-plugin/cli.md`, and four of those are byte-identical to their seeded copies.

### The stdin guard

Every hook that reads a payload opens with `IFS= read -r -d '' -t 2 input` and exits non-zero with a usage line on an empty payload. Under Claude Code the payload arrives and stdin closes, so the read returns at once and the bound is never paid. An unbounded `cat` instead blocks forever when a caller runs the hook by hand or from a tool call whose stdin is an open socket, which holds the background task open and with it the session. Only `bare-flag-repair.sh` is exempt, and it is exempt because it reads no payload.

`read` rather than `timeout cat`, because macOS ships no `timeout` and a missing one empties every payload and refuses every legitimate call. The obvious descriptor test `[ -t 0 ]` is the wrong one, since it reports false on an open socket, which is where the hang came from. Nothing compares the two hook trees, so a guard landing in one leaves the other broken with every stage still passing. `src/hooks-guard.test.ts` walks both directories rather than a fixed list, asserting a bounded refusal and an untouched working path per file.

### The dev command reminder

`dev-command-reminder.sh` is toolkit-only and has no seed counterpart. It fires once per session when a `Bash` command runs `check`, `format`, or `check:install`, and points the agent at this entry. The matcher tests the command string rather than the tool name, because `Bash` is the highest-frequency tool in a session and a loose matcher would add latency to every shell call. It stays silent on `check:types` and `test`, which need no reminder.

The filter, the match, and the session id come out of one `jq` pass, so the hot path costs a single process and the second `jq` runs only when the hook actually fires. Splitting the fields through `@tsv` instead looks equivalent and is not: `@tsv` escapes a newline to a literal `\n`, which puts a backslash where the matcher expects whitespace or end of string, and every multi-line command stops matching. A run with no `session_id` exits rather than sharing one marker file, since per-session dedupe needs a real id.

### The bare flag repair

`bare-flag-repair.sh` shares the `Bash` matcher and clears `core.bare` when worktree entry has left it set. Git refuses every operation while the flag is on, which puts `post-checkout` and the rest of the husky hooks out of reach, so a tool call is the only event that still fires ahead of the command that would fail. `verify.sh` keeps its own call to the same repair, but a planning or review session reads git constantly and runs the suite never, so the suite alone leaves such a session broken for its whole length.

The hook writes to the shared git config as a side effect of an unrelated `Bash` call, so it announces the repair through `additionalContext` rather than clearing the flag silently. It sources `repair_bare_flag` from `scripts/lib/worktree.sh` rather than restating the predicate, and stubs `log_warn` before the source so the library warning lands in a variable instead of on stdout, where an unframed line corrupts the hook protocol. The flag read comes first and costs one process, ahead of the payload parse, because every invocation but a handful stops there. That measured at roughly 2ms against 3.6ms for `dev-command-reminder.sh` on the same matcher, so the two stay separate hooks.

### Linting the hooks

`check:shell` lints `.claude/hooks/` alongside `scripts/` and `tooling/`. It has to, because the shell stage is gated on any `.sh` change. Linting a narrower set than the gate keys on produces a stage that fires on a hook edit, inspects other directories, and reports a pass that says nothing about the file that triggered it. Keep the glob and the gate pattern in step whenever either moves.

## Husky hooks

- `pre-commit` runs `lint-staged` (prettier, cspell, shfmt, shellcheck on staged files).
- `commit-msg` runs `commitlint` against the conventional commit format.
- `pre-push` runs `bun run check`. After pushing, run `git status`. If files changed, commit the diff as `style(<scope>):` and push again.
- `post-merge` archives the task each merged pull request closed and stays silent otherwise. It is the only trigger that fires after a merge, covered in `.claude/context/claude-plugin/skill-archiving.md`. It reads `ORIG_HEAD..HEAD` rather than the tip, since one pull routinely fast-forwards over several merges and reading `git log -1` would strand every task but the last.
- `post-rewrite` delegates to `post-merge` on the `rebase` argument, so a `pull.rebase=true` machine gets the same check. It exits on `amend`, which rewrites nothing on the board.

Husky runs every hook as `sh -e "$hook"`, so the shebang on both is advisory and the file is POSIX sh under errexit whatever it declares. A bare `grep` that matches nothing aborts the hook and prints a husky failure on a clean pull, which is why each test sits inside an `if` condition rather than standing alone. Errexit exempts a condition and nothing else.

`check:shell` globs `*.sh` under `scripts`, `tooling`, and `.claude/hooks`, so no husky hook is linted. That cost nothing while all three were one-liners and now leaves two real scripts uncovered. Run `shellcheck --shell=sh .husky/post-merge .husky/post-rewrite` by hand after editing either.

## Session scratch

`.claude/plans/`, `.claude/review/`, `.claude/memory/`, and `.claude/tasks/` are gitignored and live at the main worktree root. A linked worktree resolves them there rather than writing its own copy.

The task board is a folder of one file per task, which is what keeps two concurrent sessions from overwriting each other on a board that has no history to recover from. Its `index.md` is regenerated by a `PostToolUse` hook rather than by `bun run check`, because the whole-repo index walk filters candidates through `git check-ignore` and so never sees a gitignored folder. Positional regen reaches it, since the walk-up never consults git.

`.claude/memory/` carries the same shape and now the same mechanism. Its entries take `title`, `description`, and a sentence-case `category`, so the shared renderer groups the catalog by kind, and `.claude/hooks/memory-index.sh` regenerates `index.md` on every write. The folder was a hand-appended `MEMORY.md` before, and it had drifted to more rows than files.

A memory entry that leaves the folder moves to `.claude/.tmp/memory-archive/`, the one archive that stayed under the scratch tree the other three left. Nothing cites a retired memory the way a task file cites a plan or a groundwork track, and a phase label derives from the task archive while no surface reads this one, so it is an undo buffer for a bulk pass rather than a record a later session opens. Deletion was never safe here: the folder is gitignored, so a wrong call over a folder this size has nothing to recover from.

A plan that ships moves to `.claude/plans-archive/` under its original name, swept there by `claude-docs`. Deletion was the earlier policy and cost a shipped plan outright, because `.claude/plans/` is gitignored and nothing backs it up. A re-shipped slug overwrites the earlier file, which keeps the folder holding intact plans under the names they were written with.

A task that ships moves to `.claude/task-archive/` the same way, through `aitk tasks archive`. The `Pull request:` line `git-pr` writes onto the task is what lets the merge close it, since every merge on `main` is a squash carrying that number in its subject while the branch name never lands. The command owns the move, the `priority.md` row removal, and the index regen as one unit, so the hook and `claude-tasks` cannot archive differently.
