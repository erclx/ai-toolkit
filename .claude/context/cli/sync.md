---
title: Sync
description: The sync engine and its adapters, the install stamp and what it covers, attribution from git history, and the freshness report
---

# Sync

`src/sync/` holds one engine that gov, snippets, and standards all install and sync through, plus the git workflow `aitk sync` runs afterward. The install stamp at `.claude/aitk.json` is what lets the engine tell a file the toolkit moved from a file the project edited, and the freshness report reads the same plan a sync would apply.

The folder splits by job: the git workflow across `target.ts`, `git.ts`, and `workflow.ts`, the stamp in `stamp.ts`, the drift report in `check.ts`, and the history fallback in `history.ts`.

## The sync engine and its adapters

- An adapter supplies only a source lookup and, optionally, surfaces the file walk cannot see. Snippets landed against the engine with no change to it, which is the evidence that `SyncAdapter` generalizes rather than describing gov. Treat a required engine change in a later adapter as a finding, and prefer widening the adapter interface over branching inside the engine.
- Standards is the adapter that needed the engine widened, and it took three optional fields rather than a branch on the domain name: `nonInteractive`, `isExcluded`, and `onComplete`. Each defaults to the behavior gov and snippets already had, so a widening cannot silently change an existing adapter.
- The non-interactive policy is a discriminated union rather than a boolean. A headless run applies for a toolkit-owned domain and refuses for one whose files a project edits, and the refusing variant carries its own message and hint so the engine never holds domain copy.
- The refusal is per-file rather than per-domain. A domain-wide `refuse` stands in for a fact nobody can compute, which makes standards unattended-hostile because one file among twelve might be customized. With a stamp the engine refuses only when a file it cannot prove untouched would be overwritten, and a purely mechanical update applies headlessly.
- The sync commit stages the paths the syncs actually changed rather than `git add -A`. The workflow already reads those paths to classify each domain, so the commit matches its own message. `check_clean_tree` stays regardless, since it is what makes any staging choice survivable.

## The install stamp

- A content hash answers whether a file changed. Only a record written at install time answers who changed it, and those two need opposite actions. That is the whole reason `.claude/aitk.json` exists rather than recomputing against the source, which is what `planSync` already did.
- The stamp's path list is a second input to the walk, not a lookup keyed by the current path. A relocated file is never walked, so a lookup would never consult its entry and the stamp would buy nothing a recomputed hash does not. Folding stamped paths into the walk is what makes a move visible.
- `orphaned` and `stranded` are separate states because they need opposite treatment. A project-authored rule is orphaned and never converges, so counting it as drift left `--exit-code` failing forever with no remedy. A stamped file at a root the toolkit abandoned is stranded, which is a relocation waiting on a decision.
- The stamp writes after the copies land, so a partial apply that throws leaves the previous stamp rather than a claim the target does not meet. A stamp that lies is worse than no stamp, because the next report calls updated files stale.

## What the stamp covers

- A missing or corrupt stamp degrades to the unattributed report rather than failing, which is the only path an unstamped target has.
- Tooling is outside the stamp and `src/tooling/` never calls `planSync`, running its own inject and manifest machinery instead. Naming the domains a target has not stamped, rather than the domains the toolkit could stamp, is what tells an uncovered domain from a clean one.
- The anchor sits per domain rather than at the top of the stamp. Domains sync independently, so one shared revision lets one domain's sync advance the commit another measures its upstream range from, dropping that domain's changes out of the read. Per-file attribution never sees it, because `attribute` compares hashes and never reads the anchor, which is what makes it fail quietly.
- `covers` is derived from the domains actually recorded, never from the constant list of domains the engine can stamp. A compile-time constant claimed coverage of domains a target had never stamped, which is the ambiguity the field exists to remove.

## Attribution from git history

An unstamped file falls back to the toolkit's git history, matching installed content against every version that path ever held in `src/sync/history.ts`. The stamp records what was installed, and history holds the same fact for anyone who installed before the stamp existed, so a match recovers `stale` and names the commit.

Reconstructing rather than trusting is what keeps the fallback from softening the refusal. No match means the content matches nothing the toolkit ever published, which is a local edit and stays `drifted`. A shipped ledger of per-release hashes was the alternative, and it would also cover a registry install. It lost as a generated artifact plus a drift stage carried forever, for a state each target leaves permanently on its next sync.

The fallback reads history as one `git log --raw` call per domain rather than one per file, and computes git's blob name locally instead of shelling into `hash-object`. A repository normalizing line endings on checkout stores blobs the working tree never holds, so the local computation can miss. It fails toward `drifted`, which is the label that refuses.

History is absent exactly where the stamp is, since a registry install ships `src/` without `.git`. `historyUnavailable` separates a toolkit that could not attribute from one that attributed and found a local edit, because only the first is a capability the install lacks. It degrades the way `toolkitCommit` already does rather than failing the sync.

## Surfaces reported without a change

Three report sections sit outside the domain scan in `src/sync/check.ts`, each covering something `planSync` structurally cannot. All three are report-only, and the reason is the same in each case: the engine turns a difference into a `copy` and a retired surface into a `delete`, and every file here holds content the project wrote.

Seeds get their own reader in `src/sync/seeds-report.ts` rather than a `SyncAdapter`. Three things blocked the adapter. `listInstalled` globs `**/*.md` under one root while seeds span the target root for `CLAUDE.md`, `.claude/` for the rest, and include a `.json` and four `.sh` files. And `planSync` queues a copy for every non-matching file, which would overwrite `CLAUDE.md` wholesale and defeat the section merge `claude-seed-sync` exists to run. The reader reuses `readHistoryIndex` and `findInstalledOrigin` directly, because `recoverAttribution` is private to the engine and takes an adapter seeds have no way to supply. Seeds carry no stamp, so `customized` is unreachable and an unattributed difference stays `drifted`.

`collectSuperseded` in `src/sync/layout.ts` derives retired artifacts by pairing `SUBDIRS` from `src/claude/seeds.ts` against an uppercase-stem sibling. The existing `collectRetired` adapter hook was the wrong tool: it exists for `.claude/GOV.md`, a generated file, and the engine deletes whatever it returns. Deriving from the seed tree rather than a fixed filename list means a folder added later is covered without a code change, at the cost of missing a suffixed variant like `TASKS-ARCHIVE.md`.

`detectUnmigrated` covers the state that read as clean. `installedStampDomains` lists only domains whose install marker exists, so a project holding `standards/` at its root reported zero entries rather than a problem. It counts toward `--exit-code` because the relocation closes it, while superseded artifacts and seed drift are excluded for the reason `orphaned` already is.

## aitk sync

`aitk sync [target]` runs every installed domain sync in sequence (standards, snippets, governance, claude), then a git workflow step that detects which domains changed and previews the commit and pull request body before prompting. Committing creates `chore/aitk-sync-YYYYMMDD-HHMM` when the run is on `main` or `master` and stays on the current branch otherwise. The pull request body lists up to three changed filenames per domain, then a count for the rest.

Claude sync runs under `AITK_NON_INTERACTIVE=1` so the embedded call does not prompt. The three other domain syncs inherit stdin and prompt for their own changes, and the combined pull request preview is the confirmation gate for the workflow alone. `aitk claude sync` writes only `.gitignore`, so the changed-file tracking watches that path and a gitignore-only change still reports under a `claude/` domain line. Seed audits stay a manual step through the `claude-seed-sync` skill, which `aitk sync` points at when `.claude/` is present.

Governance is the one domain whose sync condition differs from its detection condition. It reports as absent without `.claude/rules/`, yet still syncs when only the retired `.claude/GOV.md` remains, so that the sync can delete it.

The workflow is skipped when the target is not a git root, and the pull request path is hidden when `gh` is missing while committing still works. It stops with a warning when the timestamped branch already exists locally or on the remote, and two runs inside one minute collide by design.

## Freshness

`aitk sync --check` reports drift and writes nothing. It reads the same `planSync` a sync would apply, so the report cannot disagree with the action it predicts. Drift between syncs is normal, so the check exits 0 by default and CI opts into failing with `--exit-code`.

Each domain bounds its upstream read by its own anchor and its own toolkit source path, so `standards/` commits are measured from when standards last synced rather than from whatever synced most recently. Plugin skills under `claude/` are never copied into a target and load live, so they cannot go stale. New ones appear in a separate read-only section read from the oldest anchor across domains, since over-reporting a skill costs a line while measuring from the newest would hide one.

The report closes by naming the domains a target has left unstamped, alongside the standing caveat that tooling is never stamped at all.
