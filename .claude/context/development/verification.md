---
title: Verification
description: How bun run check scopes stages to the changed-file set, why the baseline is the remote ref, and the gotchas of running the suite
---

# Verification

## Scoped verification

`bun run check` gates three stages on the changed-file set. Shell runs on any `.sh` change, types and tests on any `src/` change. Format, spelling, and the four regeneration stages always run, because their inputs are diffuse. Skipping tests, types, and shell on a markdown-only edit drops roughly 16 of the 31 CPU-seconds measured across the gate, and the test suite alone accounts for most of that.

The changed set unions the branch diff against the merge base with `origin/main`, the working tree, and untracked files, which matches what a pull request will contain. Every fallback widens rather than narrows. A missing merge base runs every stage.

The baseline is `origin/main` and not local `main` for a reason. On `main` itself the local ref is HEAD, so the merge base resolves to HEAD and every commit not yet pushed drops out of the changed set. `pre-push` would then skip the scoped stages on a direct push to `main`.

`.github/workflows/verify.yml` now catches that case, since it triggers on pushes to `main` as well as on pull requests, but it catches it after the push rather than before. Comparing against the remote ref keeps committed work visible.

When `origin/main` does not resolve, which happens transiently during a concurrent `fetch --prune`, the fallback to local `main` treats a merge base equal to HEAD as a signal to run every stage.

Pass `--all` to force the full suite, and `--help` to print the argument list. `bun run check:ci` passes `--all`, so CI stays the backstop for a wrong local scoping decision on the pull request path.

Measure CPU seconds and not wall clock when judging a stage's cost. The suite fans 415 tests across every core, so it is the most expensive stage and among the fastest, and ranking by wall time hides it. Test-count growth is invisible in wall time and linear in CPU.

## Gotchas

### A shell script's own test file does not gate the script

Types and tests run on any `src/` change, per the scoping rule above, so a shell script under `claude/skills/*/scripts/` gates only the Shell stage even when a `src/*.test.ts` file covers it. `claude/skills/claude-orchestrate/scripts/poll.sh` and `src/orchestrate-poll.test.ts` are one such pair. A branch touching only the script reports clean on `bun run check` and on `bash -n` alike while the classifier crashes on a carried line, caught only by running `bun test src/orchestrate-poll.test.ts` by hand. Run the specific test file for a `claude/skills/` script before trusting a green `bun run check` that never touched `src/`.

### The install gate

`bun run check:install` runs `git clone` on the project root, so it verifies the last commit and never the working tree. An uncommitted fix, or an uncommitted regression, is invisible to it. Commit first or the result describes code you are not shipping.

Its assert loop is the only thing between a silently truncated install and a green run, because `runDomains` in `src/init/run.ts` catches a failed domain and lets init report the ones that worked. Every domain init installs needs at least one asserted path, or that domain can install nothing while the gate stays green.

A passing `bun run check` prints three `Failed, run manually` lines. Vitest passes a test's stderr through, and `src/init/run.test.ts` exercises that same failing-domain branch deliberately, so grepping the check output for failure strings reports a regression that does not exist. Read the closing `✓ Verification passed` line and the vitest summary instead.

The gate runs `aitk init --stack base` rather than a bare `init`, which now resolves to the same install since `base` is the default. The explicit flag stays because it pins what the assertions cover rather than inheriting whatever the default becomes. A domain that installs conditionally needs its condition met in the gate invocation, beyond having a path in the loop.

### Rank a stage by processor seconds

Rank verification stages by CPU seconds rather than by elapsed time, because a stage that fans across cores finishes fast and costs the most. `bun run check` timed by wall clock made the 415 tests look like the cheapest stage at 931ms, which led to recommending the duplicate prettier pass be dropped instead. Re-timing with `/usr/bin/time -f 'user %U sys %S wall %e cpu %P'` showed the tests are the most expensive stage at 11.76 CPU seconds and 1169 percent peak CPU, 38 percent of a roughly 31 CPU second total, delivered in one wall second. State which measure a cost claim rests on. Wall clock still answers how long a human waits, which is a separate question.

### The other stages

A single test file runs through `bun --bun vitest run <path>` and never `bunx vitest run <path>` or `bun run vitest run <path>`, which is the form `package.json` already spells in its `test` script. Without `--bun`, vitest resolves under node, where a module reaching git through `$` from `bun` fails to import at collection time and the file reports zero tests rather than a failure. Every module that shells out does so through that import, so the wrong form reads as a clean run over exactly the code whose behavior lives outside the process.

The other reading is worse, because the wrong form can report failures a green tree does not have. Scoping to `src/context/` through `bunx` reported `3 failed | 1 passed` while `bun run check` was green on the same tree, which reads as a regression the change introduced. `src/context/citations.ts` and `src/indexes/walk.ts` both import Bun globals, so most of that suite trips it. A collection failure naming a package the project depends on, such as `Cannot find package 'bun' imported from src/git-ignore.ts`, is one signature.

It is not the only one, and the other reaches past collection. A module calling `Bun.Glob`, `Bun.TOML`, or `Bun.YAML` without importing anything collects and runs, then throws `ReferenceError: Bun is not defined` at the call site, so the file reports ordinary test failures pointing at a source line rather than at the runtime. That reads exactly like a regression the change introduced, which is what makes it worth naming: re-run the same file through `bun --bun` before opening the source, since the tests pass unchanged under the right form. Measured 2026-08-21 against `src/claude/skills-reach.test.ts` and again against `src/sync/check.test.ts`.

A third form fails a different way: bare `bun test` runs the suite under Bun's own test runner rather than under vitest at all, which `package.json`'s `test` script never does. `it.concurrent(name, async ({ expect }) => ...)` reads its `expect` off a vitest-only test-context argument bare `bun test` never supplies, so every such test throws `TypeError: expect is not a function` at the assertion line instead of failing to collect, reading as a broken suite rather than a broken invocation. Measured against `src/hooks-guard.test.ts`, where all 44 tests failed that way under `bun test` and passed unchanged under `bun run test`.

Nothing typechecked until `check:types` was added, so a dropped import shipped green through format, spell, shell, and the test suite. The suite catches one only where a test covers the caller, and the migration keeps adding untested call sites. Declare `typescript` in `devDependencies` rather than relying on it hoisting from an astro peer, or the gate resolves by accident.

The Indexes stage asserts drift against the working tree, so the first `bun run check` after a frontmatter edit reports its own regeneration as drift and exits red. Stage or commit the rewritten `index.md` and run again. This is the same regenerate-then-assert shape as the two stages in `.claude/context/development/regeneration.md`, with the difference that the walk writes files the session never opened, so the failure names work nobody did by hand.

`.cspell/banned-spellings.txt` is a third dictionary holding the British spellings `aitk markdown audit` reports, and an `overrides` entry in `cspell.json` scopes it to the files that carry, assert, or explain the set rather than loading it repo-wide. Both gate a push now, the spell check over the whole tree and the audit over its ban half, so a repo-wide load would spell-approve everywhere the words the ban gate still fails on and leave the two stages disagreeing about one word. A file that needs one of them is added to the override list, never to `project-terms.txt`, which reads as vocabulary this repository writes.

Its membership is the shipped `SPELLINGS` plus `analyse`, a word no set carries and a comment in `src/markdown/bans.ts` explains the absence of. The two are therefore not the same list and neither derives from the other, which is what `bans.test.ts` asserts. Stating the rule alone was not enough: the file claimed to be the shipped set while omitting `centre` and carrying `analyse`, and it passed because the base dictionary accepts `centre` on its own. An omission here stays invisible until that dictionary tightens and then fails a file nobody touched, so the assertion is what closes it rather than the comment.

The list is stated as a property rather than a count, since a count of the files carrying a banned spelling goes stale against the same corpus the audit measures. It read three while six were listed, and no stage compares the sentence to the array beside it.
