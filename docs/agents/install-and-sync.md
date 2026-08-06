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

### Tooling

Tooling records the stack chain an install resolved rather than per-file hashes,
since `src/tooling/` runs its own inject machinery and has no walk to attribute.
The chain is ordered nearest stack first, which is what a `--skip` run needs:
recording the leaf alone would send the next report measuring against a layer the
target deliberately does not carry. The report loads exactly those stacks, scans
them the way `aitk tooling sync` would, and counts what differs per category
under `tooling.counts`.

`measured` is the field the section exists for. A target carrying no chain
reports `measured: false`, which separates tooling nobody has ever looked at from
tooling that is current. Both produce zero changes otherwise. Every target
installed before the record shipped starts unmeasured and leaves on its next
`aitk tooling sync`, since backfilling would mean inferring the chain from
installed files, which is the guess the record replaces.

A workspace root records nothing, because each package resolves its own chain and
one written at the root would be that same guess. Run the check against a package
to measure it. Tooling never counts toward `--exit-code`, on the grounds seeds
are already excluded on, since it reports golden configs a project is expected to
edit and a job counting those stays red with no remedy.

### Surfaces reported beside the domains

Four sections sit outside the per-domain scan, because each names something
that walk cannot see. None of them produces a change, and no sync command
applies any of them.

All four report only against a toolkit-managed target, which is one carrying a
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

#### Seeds, superseded artifacts, and unmigrated domains

`seeds` classifies every seed the toolkit ships against the target's copy, as
`matching`, `stale`, `drifted`, or `missing`. `missing` has no per-domain
equivalent, since the domain walk lists what a target installed and cannot see a
file that never arrived. There is no `customized` verdict here, because that one
needs a stamp and seeds carry none, so a file history cannot attribute stays
`drifted`. Reconcile the section with `claude-seed-sync`, which merges one
section at a time rather than replacing a file the project edits.

A markdown seed installs rewritten rather than copied, since the `stub: true`
marker the toolkit's own seed gate reads is stripped on the way in. The
comparison above runs against what the install would write, so a marked seed a
target never touched still reports `matching`. Every other seed copies byte for
byte.

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

That skill reads this field rather than listing the folder itself, so the entry
is the detection on both sides of the handoff and the two cannot disagree. The
count is what makes the difference visible: it counts only files whose basename
the toolkit ships, so a root folder holding the project's own documents beside
the installed ones reports the installed subset, where a listing reports every
file and proposes relocating the lot.

#### The reverse walk

`reverse` is the one section built by walking the target rather than the
catalog. Every other surface enumerates toolkit-owned keys and asks whether the
target matches, so a folder the toolkit deleted appears in none of them. It
carries `unclaimed`, `migrations`, and `historyUnavailable`.

`unclaimed` names a folder the target holds at a top-level path the toolkit once
shipped and has since deleted. The candidate roots come from the toolkit's own
history rather than from a list, so a root dropped later is covered without a
code change. Scoping to those roots is what keeps the walk useful: walking the
whole tree reports every project folder as unclaimed, which is true and says
nothing.

The managed gate above applies here too, and it is the one place it surprises.
A directory holding a dropped folder and nothing else reports an empty `reverse`
rather than the folder, because it carries none of the three markers. Read an
empty section on an unmanaged target as a walk that never ran rather than as a
clean result.

Each entry carries `rel`, a file count, and an `attribution` of `dropped`,
`project`, or `unattributed`. A dropped folder and one the project wrote are the
same bytes at the same path, so the verdict is traced from history rather than
guessed from the filesystem.

Content matching a version the toolkit published reads as `dropped` and carries
the `since` commit that published it. Names the toolkit shipped holding content
it never published read as `unattributed`, which is a state in its own right
rather than a soft yes. No overlap at all reads as `project`, and the render
drops those while the JSON keeps them.

Only files whose path the toolkit once held are hashed, so a project folder
colliding on a retired name costs the walk no reads. The cost is that a file the
toolkit shipped and the target renamed goes unmatched, the same limit the
`unmigrated` count carries.

`migrations` names a proposal-only skill with a live case in this target, which
is the treatment `unmigrated` already gives `migration-standards`. It fires on a
`CLAUDE.md` past 250 lines for `migration-claude-md`, and on a `docs/` folder
holding markdown with no populated `.claude/context/` for `migration-context`.
Each entry carries the skill name and the measurement behind it, so a consumer
can check the proposal before running it. Without the field both skills are
documented and unreachable from any report.

#### What counts toward the gate

`unmigrated` counts toward `--exit-code`, since running the relocation closes it.
`superseded` and every seed state are excluded, for the reason `orphaned` already
is: only the user can move content they wrote, so failing a job on it leaves the
job red with no mechanical remedy.

The whole `reverse` section is excluded on the same grounds, and more strongly.
Every entry in it is a judgment about a file the project may own, and one of its
three verdicts is a labelled unknown by design. The unmigrated detection shipped
that exact false positive once, failing a push with no action that cleared it,
so this section reports and gates nothing.

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
