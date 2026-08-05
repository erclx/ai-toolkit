---
title: Verification
description: How bun run check scopes stages to the changed-file set, why the baseline is the remote ref, and the gotchas of running the suite
---

# Verification

## Scoped verification

`bun run check` gates three stages on the changed-file set. Shell runs on any `.sh` change, types and tests on any `src/` change. Format, spelling, and the four regeneration stages always run, because their inputs are diffuse. Skipping tests, types, and shell on a markdown-only edit drops roughly 16 of the 31 CPU-seconds measured across the gate, and the test suite alone accounts for most of that.

The changed set unions the branch diff against the merge base with `origin/main`, the working tree, and untracked files, which matches what a pull request will contain. Every fallback widens rather than narrows. A missing merge base runs every stage.

The baseline is `origin/main` and not local `main` for a reason. On `main` itself the local ref is HEAD, so the merge base resolves to HEAD and every commit not yet pushed drops out of the changed set. `pre-push` would then skip the scoped stages on a direct push to `main`. `.github/workflows/verify.yml` now catches that case, since it triggers on pushes to `main` as well as on pull requests, but it catches it after the push rather than before. Comparing against the remote ref keeps committed work visible.

When `origin/main` does not resolve, which happens transiently during a concurrent `fetch --prune`, the fallback to local `main` treats a merge base equal to HEAD as a signal to run every stage.

Pass `--all` to force the full suite, and `--help` to print the argument list. `bun run check:ci` passes `--all`, so CI stays the backstop for a wrong local scoping decision on the pull request path.

Measure CPU seconds and not wall clock when judging a stage's cost. The suite fans 415 tests across every core, so it is the most expensive stage and among the fastest, and ranking by wall time hides it. Test-count growth is invisible in wall time and linear in CPU.

## Gotchas

### The install gate

`bun run check:install` runs `git clone` on the project root, so it verifies the last commit and never the working tree. An uncommitted fix, or an uncommitted regression, is invisible to it. Commit first or the result describes code you are not shipping.

Its assert loop is the only thing between a silently truncated install and a green run, because `runDomains` in `src/init/run.ts` catches a failed domain and lets init report the ones that worked. Every domain init installs needs at least one asserted path, or that domain can install nothing while the gate stays green.

A passing `bun run check` prints three `Failed, run manually` lines. Vitest passes a test's stderr through, and `src/init/run.test.ts` exercises that same failing-domain branch deliberately, so grepping the check output for failure strings reports a regression that does not exist. Read the closing `✓ Verification passed` line and the vitest summary instead.

The gate runs `aitk init --stack base` rather than a bare `init`, which now resolves to the same install since `base` is the default. The explicit flag stays because it pins what the assertions cover rather than inheriting whatever the default becomes. A domain that installs conditionally needs its condition met in the gate invocation, beyond having a path in the loop.

### The other stages

Nothing typechecked until `check:types` was added, so a dropped import shipped green through format, spell, shell, and the test suite. The suite catches one only where a test covers the caller, and the migration keeps adding untested call sites. Declare `typescript` in `devDependencies` rather than relying on it hoisting from an astro peer, or the gate resolves by accident.

The Indexes stage asserts drift against the working tree, so the first `bun run check` after a frontmatter edit reports its own regeneration as drift and exits red. Stage or commit the rewritten `index.md` and run again. This is the same regenerate-then-assert shape as the two stages in `regeneration.md`, with the difference that the walk writes files the session never opened, so the failure names work nobody did by hand.

`.cspell/banned-spellings.txt` is a third dictionary holding the British spellings `aitk markdown audit` reports, and an `overrides` entry in `cspell.json` scopes it to the files that assert or explain the set rather than loading it repo-wide. Both gate a push now, the spell check over the whole tree and the audit over its ban half, so a repo-wide load would leave the six words enforced by whichever ran first rather than by the rule that owns them. A file that needs one of them is added to the override list, never to `project-terms.txt`, which reads as vocabulary this repository writes.

The list is stated as a property rather than a count, since a count of the files carrying a banned spelling goes stale against the same corpus the audit measures. It read three while six were listed, and no stage compares the sentence to the array beside it.

The Skill references stage asserts drift over `claude/skills/*/references` as a whole, while `scripts/core/regen-skill-references.sh` writes only the files a `standards/bundled/` entry names in its `consumers` field. A hand-authored runbook under that folder therefore reports as drift on the first `bun run check` after it is edited, and no regeneration clears it because none produced it. Stage the file and run again.
