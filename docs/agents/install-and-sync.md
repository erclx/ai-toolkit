---
title: Install and sync
description: What each install and sync verb writes, refuses, or leaves alone, and how drift is attributed in a target project
---

# Install and sync

The behavior notes behind the verbs listed in `commands.md`. Each one records what the verb writes, what it refuses, and what it deliberately leaves alone.

## Domain sync

`aitk gov sync` updates only rules already present under `.claude/rules/` and
never adds new ones. A rule the toolkit does not ship is left alone, which is
how project-authored rules survive. It also removes a stale `.claude/GOV.md`
from the retired build. Use `aitk gov install` to add rules.

`aitk standards sync` matches by filename against `.claude/standards/` and
regenerates that folder's `index.md` on every completed run. It is the one sync
that refuses under `AITK_NON_INTERACTIVE=1` when drift exists, logging a warning
and exiting 0 without writing, because standards are seeds a project edits. Run
it interactively, or use the `claude-seed-sync` skill for a per-section audit
that preserves customizations.

`aitk snippets sync` behaves the same way against `.claude/snippets/`. It
matches by path relative to that directory, so a snippet the toolkit no longer
ships, or one authored directly in the target, is reported and skipped rather
than deleted. It is not preset-aware, so a project that installed `essentials`
does not grow new snippets on a sync. Use `aitk snippets install` to add them.

## Install guards

`aitk gov install` and `aitk snippets install` require their first argument
under `AITK_NON_INTERACTIVE=1`. Both used to fall back to an interactive picker
that resolved to its first option headlessly, so `aitk gov install` with no
stack installed whichever stack sorted first and `aitk snippets install` with no
category installed every category. Each now reports the valid names on stderr
and exits 1. Every documented agent path already passes the argument, including
`aitk init`. The confirm-then-apply prompt after it still resolves to `Yes`
headlessly, so a call that names its stack or category is unchanged.

`aitk gov install` also refuses the toolkit root as a target, matching
`aitk snippets install`. Both resolve the target before anything else, so a path
that does not exist fails rather than being scaffolded.

## Standards selection

`aitk standards install --only <names>` takes a comma-separated list and
defaults to `all`, so a call that omits it installs the whole corpus as before.
A name resolves with or without its `.md` extension, and one that matches no
standard fails the run with exit 1 rather than being dropped, because a typo
would otherwise omit a standard silently and compute the closure over the wrong
set. `aitk init --standards <selection>` passes the same value through.

The selection expands to the standards it depends on, so nothing lands with a
dangling reference. A citation is a backticked filename in a standard's body,
resolved case-exactly against the flat `standards/` root, which is what drops a
citation naming a target's own `.claude/ARCHITECTURE.md` or a bundled standard
install never copies. Whatever the expansion adds is listed under its own step
in the output.

A citation inside a standard's `Does not govern:` list is a handoff rather than
a dependency, and the closure stops at it. That entry names a concern a sibling
owns and this standard does not, so a caller who did not ask for that concern
does not need the file. Each one is reported under a `Scope handoffs not
installed` step, naming what to add to `--only` if the project wants it after
all.

That split is what keeps a selection to a slice. Nearly all the citation density
in the corpus sits inside those scope lists, so following them pulls the whole
corpus in behind any single name. Following dependencies alone, a single name
lands between one and three of the fifteen.

## Governance regen

`aitk gov regen` is the one governance verb that runs against the toolkit root,
because the `.claude/rules/` it writes there is produced output rather than an
operator's working copy. It reads the stack recorded in `internal/governance.toml`,
installs it alongside anything under `internal/rules/`, and clears the
destination first so a rule the record stopped naming disappears. It takes
`--root <path>` and defaults to the toolkit root, prints nothing on success, and
reports the reason on stderr with exit 1 when the record names a stack or rule
that does not resolve. `scripts/core/regen-claude-copies.sh` calls it, and the
Consumed copies stage of `bun run check` asserts the result is committed.

## Whole-project sync

`aitk sync` runs every installed domain sync, then offers to commit the result
and open a pull request. Under `AITK_NON_INTERACTIVE=1` it applies the domain
syncs and then refuses the git workflow, reporting the branch and commit it
would have created and exiting 0. Nothing is staged, committed, or pushed
headlessly. Run it interactively to reach the commit and pull request options.
It also refuses a target whose working tree is dirty, so commit or stash first.

## Drift reporting

`aitk sync --check` reports drift and writes nothing, so it needs no clean tree
and is safe to run at any time. Each file is classified as `stale` when it still
matches what the toolkit installed, `customized` when the project edited it,
`stranded` when it sits at a path the toolkit no longer installs to, `orphaned`
when the project authored it, or `drifted` when no stamp covers it. Use `--json`
for the machine-readable report and `--exit-code` to fail a CI job. Orphaned
files are excluded from that exit code, since a project-authored rule never
converges. Attribution reads `.claude/aitk.json`, which every install and sync
writes.

A target installed before stamping shipped has no such file, and the report
falls back to the toolkit's own git history. Installed content matching any
version that history ever published proves the file is untouched, so it reports
`stale` naming the commit it came from, and content matching no published
version stays `drifted`. A toolkit reached outside a git clone, which is what a
registry install is, cannot run that fallback and reports
`historyUnavailable` alongside the unattributed files.

Each domain carries its own toolkit anchor in that file, so syncing one domain
never advances the revision another measures from, and each reports the upstream
commits touching its own source path. The `covers` field names the domains a
target has actually stamped, so a domain that was never stamped is legible
rather than reading as a clean one.

### Surfaces reported beside the domains

Three sections sit outside the per-domain scan, because each names something
that walk cannot see. None of them produces a change, and no sync command
applies any of them.

All three report only against a toolkit-managed target, which is one carrying a
`.claude/` directory, a `CLAUDE.md`, or a domain still at the root layout. The
report says so through `managed` in the JSON and routes an unmanaged directory to
`aitk init`. Seeds are why the gate exists, since they enumerate from the toolkit
source rather than from what a target installed, so an unmanaged directory would
otherwise report every seed as `missing`.

A root-layout domain counts as a marker on its own, because the detection fires
only on root files the toolkit ships and a project in the old layout is one the
toolkit installed. When `managed` is false every section comes back empty rather
than the render alone going quiet, so a consumer reading `--json` never acts on a
finding the rendered half withheld.

`seeds` classifies every seed the toolkit ships against the target's copy, as
`matching`, `stale`, `drifted`, or `missing`. `missing` has no per-domain
equivalent, since the domain walk lists what a target installed and cannot see a
file that never arrived. There is no `customized` verdict here, because that one
needs a stamp and seeds carry none, so a file history cannot attribute stays
`drifted`. Reconcile the section with `claude-seed-sync`, which merges one
section at a time rather than replacing a file the project edits.

`superseded` names a file a newer seed folder replaced, such as `.claude/TASKS.md`
against the `.claude/tasks/` that now ships. The entry carries `replacedBy` and
nothing else, and the file is never deleted, since the content belongs to the
project and only its author can decide where it moves. The list derives from the
seed tree rather than from a fixed set of filenames, so a folder added later is
covered without a code change. Only an exact stem matches, which leaves a
suffixed variant such as `TASKS-ARCHIVE.md` unreported.

`unmigrated` names a domain sitting at the root layout an older toolkit installed
to, with nothing at the path the current one reads. It carries `rootPath`,
`installPath`, and a file count. Without it a project holding `standards/` at its
root reports zero entries for that domain and reads as clean, which is the most
misleading state the report can produce. Route it to `migration-standards`.

`unmigrated` counts toward `--exit-code`, since running the relocation closes it.
`superseded` and every seed state are excluded, for the reason `orphaned` already
is: only the user can move content they wrote, so failing a job on it leaves the
job red with no mechanical remedy.

## Bootstrap

`aitk init` installs up to six core domains and reports each one independently. A
domain that fails does not abort the run, so the command finishes the rest and
exits 1 naming the failures. Passing any flag skips the confirmation prompt,
which is what makes it scriptable. `--stack` defaults to `base`, and the default
does not read as a passed flag, so a bare `aitk init` installs governance and
still prompts. `--skip` takes `wiki`, `standards`, and `governance`, and warns
without aborting on any other value. `--standards` defaults to `all` and reaches
`aitk standards install` only when it names something narrower, so the default
run spawns the command it always did.

## Unguarded tooling primitives

`aitk tooling inject` and `aitk tooling prune-gitignore` are the unguarded
primitives beneath `sync`. They apply one stack with no scan and no prompt, and
they deliberately skip the check that rejects `claude`, which is how `aitk
claude` drives its own stack through them. Use `sync` unless you are scripting
provisioning. Both frame their own output, so pass `--nested` when calling from
inside an already-open frame.
