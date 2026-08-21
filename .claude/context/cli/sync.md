---
title: Sync
description: The sync engine and its adapters, the install stamp and what it covers, attribution from git history, and the freshness report
---

# Sync

`src/sync/` holds one engine that gov, snippets, and standards all install and sync through, plus the git workflow `aitk sync` runs afterward. The install stamp at `.claude/aitk/config.json` is what lets the engine tell a file the toolkit moved from a file the project edited, and the freshness report reads the same plan a sync would apply.

The folder splits by job: the git workflow across `target.ts`, `git.ts`, and `workflow.ts`, the stamp in `stamp.ts`, the drift report in `check.ts`, and the history fallback in `history.ts`.

## The sync engine and its adapters

- An adapter supplies only a source lookup and, optionally, surfaces the file walk cannot see. Snippets landed against the engine with no change to it, which is the evidence that `SyncAdapter` generalizes rather than describing gov. Treat a required engine change in a later adapter as a finding, and prefer widening the adapter interface over branching inside the engine.
- Standards was the adapter that needed the engine widened, taking three optional fields rather than a branch on the domain name: `nonInteractive`, `isExcluded`, and `onComplete`. Each defaults to the behavior gov and snippets already had, so a widening cannot silently change an existing adapter.
- That adapter went with the standards install channel, and the three fields outlived it unevenly. `isExcluded` and `onComplete` default cleanly and cost nothing unused. `nonInteractive` has no declarer left, so the `refuse` branch in `src/sync/engine.ts` and the `hasUnattributedDrift` it guards are unreachable rather than merely unused. Removing them is a decision to take deliberately, since the reasoning behind the extension point is recorded and would go with the code.
- The non-interactive policy is a discriminated union rather than a boolean. A headless run applies for a toolkit-owned domain and would refuse for one whose files a project edits, and the refusing variant carries its own message and hint so the engine never holds domain copy.
- The sync commit stages the paths the syncs actually changed rather than `git add -A`. The workflow already reads those paths to classify each domain, so the commit matches its own message. `check_clean_tree` stays regardless, since it is what makes any staging choice survivable.

## The install stamp

- A content hash answers whether a file changed. Only a record written at install time answers who changed it, and those two need opposite actions. That is the whole reason `.claude/aitk/config.json` exists rather than recomputing against the source, which is what `planSync` already did.
- The stamp's path list is a second input to the walk, not a lookup keyed by the current path. A relocated file is never walked, so a lookup would never consult its entry and the stamp would buy nothing a recomputed hash does not. Folding stamped paths into the walk is what makes a move visible.
- `orphaned` and `stranded` are separate states because they need opposite treatment. A project-authored rule is orphaned and never converges, so counting it as drift left `--exit-code` failing forever with no remedy. A stamped file at a root the toolkit abandoned is stranded, which is a relocation waiting on a decision.
- The stamp writes after the copies land, so a partial apply that throws leaves the previous stamp rather than a claim the target does not meet. A stamp that lies is worse than no stamp, because the next report calls updated files stale.
- `.claude/aitk/` takes a loose config file the toolkit owns and nothing else. Installed content a project reads and edits keeps its own folder, which is `.claude/rules/`, `.claude/snippets/`, and `.claude/tooling/`, and generated data keeps the folder its producer names, which is `.claude/audits/baseline.json`. All four are toolkit-owned and none of them moves, so ownership is not the test and being a bare file in the shared root is.

## What the stamp covers

- A missing or corrupt stamp degrades to the unattributed report rather than failing, which is the only path an unstamped target has.
- Tooling is a stamp domain without being a scanned one. `src/tooling/` never calls `planSync`, so it records the stack chain it resolved instead of file hashes, and `SCANNED_DOMAINS` in `src/sync/check.ts` is the narrower list the adapter, source-path, and install-marker lookups are keyed on, and the closing unstamped line reads it too. Three stamp domains stand against two scanned ones.
- Adding a domain means deciding which of the two lists it joins. Retiring one means editing both, and `STAMP_DOMAINS` is the edit that reaches a target's existing file.
- `isStamp` validates only the domain records whose key names a current `StampDomain` and ignores the rest, rather than rejecting the whole file on an unknown key. Rejecting it makes `readStamp` return undefined, which `putDomain` then reads as an unstamped target and rewrites from nothing, so retiring one domain from the union would silently discard every other domain's hashes on the next sync. `sortDomains` drops the retired key at that write, which retires it with no migration. The `standards` key a target holds from the closed install channel is the case this covers.
- The chain is ordered and stored whole rather than as a leaf name. A stack extends another, and a `--skip` run installs fewer layers than the leaf's chain reproduces, so the report loads the recorded stacks directly rather than re-resolving. Re-resolving would report drift against a layer the target deliberately does not carry.
- `chain` is optional on `DomainStamp`, which keeps a stamp written before tooling joined the domains parsing rather than reading as corrupt and discarding the three records it does carry.
- A workspace root records no chain. One chain written there is a guess at what its packages hold, and the report saying unmeasured is the true answer. The detection reads `workspaces` in `package.json` and `pnpm-workspace.yaml`, and lives in `src/tooling/stamp.ts` so `src/sync/` never learns what a workspace is.
- Only a whole-stack install records. A flag-scoped `aitk tooling inject --gitignore` installs one category, and a chain recorded from it would send the report scanning for configs and deps the caller never asked for. The `claude` stack is excluded at that call site rather than in `prepare`, which is what keeps `aitk claude` able to drive injection.
- Naming the domains a target has not stamped, rather than the domains the toolkit could stamp, is what tells an uncovered domain from a clean one.
- The anchor sits per domain rather than at the top of the stamp. Domains sync independently, so one shared revision lets one domain's sync advance the commit another measures its upstream range from, dropping that domain's changes out of the read. Per-file attribution never sees it, because `attribute` compares hashes and never reads the anchor, which is what makes it fail quietly.
- `covers` is derived from the domains actually recorded, never from the constant list of domains the engine can stamp. A compile-time constant claimed coverage of domains a target had never stamped, which is the ambiguity the field exists to remove.

## Attribution from git history

An unstamped file falls back to the toolkit's git history, matching installed content against every version that path ever held in `src/sync/history.ts`. The stamp records what was installed, and history holds the same fact for anyone who installed before the stamp existed, so a match recovers `stale` and names the commit.

Reconstructing rather than trusting is what keeps the fallback from softening the refusal. No match means the content matches nothing the toolkit ever published, which is a local edit and stays `drifted`. A shipped ledger of per-release hashes was the alternative, and it would also cover a registry install. It lost as a generated artifact plus a drift stage carried forever, for a state each target leaves permanently on its next sync.

The fallback reads history as one `git log --raw` call per domain rather than one per file, and computes git's blob name locally instead of shelling into `hash-object`. A repository normalizing line endings on checkout stores blobs the working tree never holds, so the local computation can miss. It fails toward `drifted`, which is the label that refuses.

History is absent exactly where the stamp is, since a registry install ships `src/` without `.git`. `historyUnavailable` separates a toolkit that could not attribute from one that attributed and found a local edit, because only the first is a capability the install lacks. It degrades the way `toolkitCommit` already does rather than failing the sync.

## Surfaces reported without a change

Four report sections sit outside the domain scan in `src/sync/check.ts`, each covering something `planSync` structurally cannot. All four are report-only, and the reason is the same in each case: the engine turns a difference into a `copy` and a retired surface into a `delete`, and every file here holds content the project wrote.

All four are gated on `isManagedTarget`, which reads a `.claude/` directory, a `CLAUDE.md`, or a detected unmigrated domain. Seeds are the reason the gate exists. They enumerate from the source rather than from what a target installed, so an unmanaged directory reported every seed as `missing` and routed to a section-merge skill, while the three scanned domains correctly stayed quiet because `installedStampDomains` already gates them on an install marker.

An unmigrated domain counts as a marker because `detectUnmigrated` fires only on root files whose basename the toolkit ships, so it firing proves the toolkit installed there before the layout moved. Reading the two path markers alone split the report against itself: a root-layout target with neither marker rendered as unmanaged while the JSON still carried its unmigrated domain, and `toolkit-operator` reads the JSON, so the rendered half routed to install while the router routed to the relocation. An unmanaged target now returns every section empty rather than only suppressing the render, so no consumer can act on a finding the render withheld.

### Seeds

Seeds get their own reader in `src/sync/seeds-report.ts` rather than a `SyncAdapter`. Three things blocked the adapter. `listInstalled` globs `**/*.md` under one root while seeds span the target root for `CLAUDE.md`, `.claude/` for the rest, and include a `.json` and four `.sh` files. And `planSync` queues a copy for every non-matching file, which would overwrite `CLAUDE.md` wholesale and defeat the section merge `claude-seed-sync` exists to run.

The reader reuses `readHistoryIndex` and `findInstalledOrigin` directly, because `recoverAttribution` is private to the engine and takes an adapter seeds have no way to supply. Seeds carry no stamp, so `customized` is unreachable and an unattributed difference stays `drifted`.

### Superseded artifacts

`collectSuperseded` in `src/sync/layout.ts` derives retired artifacts by pairing `SUBDIRS` from `src/claude/seeds.ts` against an uppercase-stem sibling. The existing `collectRetired` adapter hook was the wrong tool: it exists for `.claude/GOV.md`, a generated file, and the engine deletes whatever it returns. Deriving from the seed tree rather than a fixed filename list means a folder added later is covered without a code change, at the cost of missing a suffixed variant like `TASKS-ARCHIVE.md`.

### Unmigrated domains

`detectUnmigrated` covers the state that read as clean. `installedStampDomains` lists only domains whose install marker exists, so a project holding `standards/` at its root reported zero entries rather than a problem. It counts toward `--exit-code` because the relocation closes it, while superseded artifacts and seed drift are excluded for the reason `orphaned` already is.

### The reverse walk

`src/sync/reverse.ts` is the only section built by walking the target rather than the catalog. It reports beside `superseded`, `unmigrated`, and `newSkills` rather than absorbing them. Each of those answers a narrower version of the same question and none is wrong today, so folding them in would change what two shipped sections print in the same change that introduces a third. A later consolidation can read one interface instead of inventing it.

The candidate set is read from history rather than declared. `readDroppedRoots` takes one `git log --all --diff-filter=D --name-only` over the whole repository and keeps every top-level path that records a deletion and no longer exists in the working tree. Both halves are load-bearing: a path with deletions that still exists is a live root the forward direction already covers, and a path that never lost a file was never dropped. Scoping to those roots is what separates a useful finding from a listing of the project, since walking the whole tree reports every project folder as unclaimed.

Attribution reuses `findInstalledOrigin` rather than a second history reader, and it keys on the path the toolkit once held under that root. Only files whose relative path appears in the index are hashed, so a project folder colliding on a retired name costs no reads.

Three verdicts come out of that one pass. Content matching a published blob is `dropped` and names the commit. A path the toolkit shipped holding content it never published is `unattributed`, which is what history proving nothing looks like rather than a weak `dropped`. No path overlap at all is `project`, and the render drops those while the JSON keeps them, since a name collision printed on every run is a line no remedy closes.

The walk reaches none of that on an unmanaged target. `isManagedTarget` gates it the way it gates its three siblings, and the early branch returns `emptyReverseReport()`, so a project holding a dropped root reports nothing unclaimed until it carries a `.claude/` directory, a `CLAUDE.md`, or an unmigrated domain. A consumer staging a folder to observe the walk stages the marker too, or it reads an empty section as a clean answer.

### Migration candidates and the gate

`detectMigrations` gives the two proposal-only skills the report field `unmigrated` already gives `migration-standards`. Both tests read what the skill itself acts on, so a proposal the report makes is one the skill has work to do for. The `CLAUDE.md` line threshold is the `context.md` checkpoint raised, because that file legitimately carries more than one domain, and it gates a proposal rather than a failure so being approximate costs a line an operator can ignore.

Nothing in the reverse section reaches `hasDrift`. Every entry is a judgment about a file the project may own and one verdict is a labelled unknown by design, which is the false positive `detectUnmigrated` shipped once and needed `countToolkitOwned` to close. The sandbox `unclaimed` arm asserts the exit code stays 0 with a finding present.

The arm restores a dropped file at its published bytes rather than writing one by hand, because content is what the attribution matches on and a hand-written file would assert the wrong verdict. Both of its history reads take the listing through a process substitution rather than a pipeline ending in an early exit, for the reason `.claude/context/sandbox/authoring.md` states over every scenario file.

## aitk sync

`aitk sync [target]` runs every installed domain sync in sequence (standards, snippets, governance, claude), then a git workflow step that detects which domains changed and previews the commit and pull request body before prompting. Committing creates `chore/aitk-sync-YYYYMMDD-HHMM` when the run is on `main` or `master` and stays on the current branch otherwise. The pull request body lists up to three changed filenames per domain, then a count for the rest.

Claude sync runs under `AITK_NON_INTERACTIVE=1` so the embedded call does not prompt. The three other domain syncs inherit stdin and prompt for their own changes, and the combined pull request preview is the confirmation gate for the workflow alone. `aitk claude sync` writes only `.gitignore`, so the changed-file tracking watches that path and a gitignore-only change still reports under a `claude/` domain line. Seed audits stay a manual step through the `claude-seed-sync` skill, which `aitk sync` points at when `.claude/` is present.

Governance is the one domain whose sync condition differs from its detection condition. It reports as absent without `.claude/rules/`, yet still syncs when only the retired `.claude/GOV.md` remains, so that the sync can delete it.

The workflow is skipped when the target is not a git root, and the pull request path is hidden when `gh` is missing while committing still works. It stops with a warning when the timestamped branch already exists locally or on the remote, and two runs inside one minute collide by design.

## Freshness

`aitk sync --check` reports drift and writes nothing. It reads the same `planSync` a sync would apply, so the report cannot disagree with the action it predicts. Drift between syncs is normal, so the check exits 0 by default and CI opts into failing with `--exit-code`.

Each domain bounds its upstream read by its own anchor and its own toolkit source path, so `standards/` commits are measured from when standards last synced rather than from whatever synced most recently. Plugin skills under `claude/` are never copied into a target and load live, so they cannot go stale. New ones appear in a separate read-only section read from the oldest anchor across domains, since over-reporting a skill costs a line while measuring from the newest would hide one.

Tooling renders its own section, and it prints whether it was measured before it prints any count. A target with no chain recorded produces the same zero a current target does, so naming the state is the whole reason the section exists. It stays out of `hasDrift` on exactly the seeds grounds, since a golden config is one a project is expected to edit and a job counting it stays red with no remedy. Being unmeasured is not the reason, because an unmeasured report carries zero changes and would pass a count either way.

The report closes by naming the scanned domains a target has left unstamped. Tooling is excluded there despite being a stamp domain, because its section renders on every managed target and a second mention states one fact under two remedies. A scanned domain nobody installed has no section at all, which is what the closing line is for.
