---
title: Skill review paths
description: The roadmap gate that stopped an unsourced version claim, the two-pass model a pull request review posts under, and the rebase stage the worker's return leg carries
---

# Skill review paths

## The roadmap gate

`claude-orchestrate` asserted an active version from a roadmap this repository never had. `.claude/ROADMAP.md` is specified by `standards/bundled/roadmap.md`, written by `claude-roadmap`, and read by `claude-orchestrate` and `claude-pr-review`, and the file has never existed here. Every read path skips a missing file by instruction, so nothing failed loudly and the `Active: vX.Y` output line was unsourced on every run since the skill shipped.

Drafting the roadmap was the obvious fix and the standard forbids it. All eight MVP features in `.claude/REQUIREMENTS.md` have shipped, and the Lifecycle section of `standards/bundled/roadmap.md` says the scope is exhausted once the last version ships, with later work arriving as discrete items rather than extending the roadmap. A table of the current maintenance labels would satisfy the format and break the lifecycle rule in the same file.

So the claim was stripped rather than sourced. The skill reads `priority.md` for order, keeps `index.md` for what is queued, and treats the roadmap as optional, reporting what it says with a date from `git log` instead of naming a version as fact. The date is what keeps the report honest when the file is old, since trading an unsourced claim for a confidently stale one repeats the defect by another route. Sequencing read from a committed roadmap returns when a requirements pass defines a next scope, which the distribution work shipped without.

### Where the gate sits

The writer kept drafting over that same exhausted scope for another cycle. `claude-orchestrate` gained the gate and `claude-roadmap` did not, so invoking the skill directly still produced the document the standard forbids. Its only guard tested that `.claude/REQUIREMENTS.md` exists and names MVP features, which a fully delivered scope satisfies exactly as a fresh one does. The gate sits in the writer now, where a refusal reaches every caller rather than the one that happened to carry it.

What the gate reads is a section's presence rather than a shipped flag. `standards/requirements.md` gained a Lifecycle section stating that later scope arrives as a new section and that a roadmap sequences the MVP list alone, so a file carrying a section the standard names nowhere is one whose MVP list has already shipped. Nothing was added to mark a feature shipped, because the same section forbids annotating MVP entries with status and a flag would have been the thing it bans.

`## Distribution` stays outside the trigger set. The standard tells a project shipping to outside consumers to include that section from the start, so a greenfield project carries it before a single feature ships and a gate reading it would stop the loop at step one while asserting a scope was sequenced that never was. The cost is that a project whose only later scope is that section passes the gate, which this repository is, since the distribution work landed here without the requirements pass that would have named a section freely. Both remaining gaps under-fire rather than stop wrongly, which is the direction a guard reading a convention should fail in.

## Asserting a routing decision

A router is reviewable only through what it says. `toolkit-operator` writes nothing by design, so the local pass and the pull request pass both read a body claiming a route and neither can tell whether the route fires. The drift report it reads shipped with three sandbox arms and was confirmed against six real targets, while the router consuming that report had never been executed by anything, and the ship report still read as though the update path were proven.

The `reply` expectation is what closes it. It reads `result` off the envelope `max_turns` already reads, so scoring a route costs nothing beyond the run, and the token worth pinning is the name of the skill or command the route hands to. Five arms were using it before the router shipped, `claude/setup-init/fresh` among them, so the mechanism was in place and the arms written for the report asserted only the file it produced.

Pinning phrasing is the cost, and it is why every route pin is paired. A reply naming `migration-standards` in a sentence declining to route still passes, so each arm carries a `manual` entry stating the negative a substring cannot express, and the arms whose skills may execute nothing assert the tree as well: the root layout is still at the root and nothing appeared under `.claude/`. Where a handoff may legitimately continue into the skill it names, as a fresh target's does into `setup-init`, no tree assertion is declared at all, since none separates the router doing the work from the router routing to something that does it. The arms themselves are catalogued in `.claude/context/sandbox/coverage.md`.

## The review two-pass model

`claude-pr-review` reads that same roadmap path and asserts nothing from it, so it carries no defect to fix there. Its read informs a review comment, and the body sits inside a rewrite's file set where an edit would have bought a rebase for no behavior change.

That rewrite landed as a second pass the skill had never described. `claude-pr-review` posts twice over a pull request's life, a first pass and a close-out, and `claude-orchestrate` step 7 assumed the second one while the skill body defined only the first. The body path carries the head commit now, `body-<number>-<short-sha>.md`, because keying on the pull request number alone stops two sessions reviewing different pull requests from colliding and says nothing about one session posting twice. Callers invented five spellings for the second file across roughly twenty-five scratch files, and the sessions that had already written the defect down overwrote their first-pass body anyway. A name the caller has to choose is a name the caller gets wrong, so the fix is that the second segment is derived.

Deriving it also decides what a close-out reads. `gh pr view --json reviews` returns `commit.oid` per review, so the last comment the skill posted names the commit the prior pass covered, and the close-out reads that range to the head rather than the whole change. The same field settles the rebase case without a second mechanism: after a force-push the prior commit no longer reaches the head, `git merge-base --is-ancestor` exits non-zero, and the skill pays for a full pass and states that in the body. Scoping by the prior review's timestamp instead would have needed its own rebase test, since a commit's author date can predate the push that put it on the branch.

### The heading contract

The heading is the half a reader sees without opening anything, so it reports state rather than pass number. `## Review` covers every pass carrying a finding and `## Review closed` is reserved for one carrying none, so the state comes off the most recent comment rather than off a label on a kind of pass. A close-out does not close the pull request, which is why the rule reads the latest heading rather than promising the closed one is last. Coupling it to the pass number instead was measured wrong on two reviews in five, since twenty-one of fifty-three close-outs reported an open finding under a heading asserting closure. `claude-address-review` nests `## Review response` under the first of those, so a thread reads as opened, answered, still open, closed.

Sharing a prefix across that family is why the detection matches the first line for equality rather than testing a prefix. A prefix test also accepts `## Review response`, and it happened to be safe only because `claude-address-review` posts through `gh pr comment`, which lands in `.comments` and never in `.reviews`. Nothing recorded that dependency, so the close-out would have started scoping to the worker's reply the day that skill switched to posting a review. An equality test costs the same and owes nothing to a sibling's choice of command.

## The rebase stage

`claude-address-review` gained a stage between the doc refresh and the push, because a branch that answered every finding still stopped merging once a sibling landed first. No worker skill mentioned rebasing at all, so the return leg closed the review and handed back a branch nobody could merge. Detection needed no new surface, since the orchestrator's poll already reports `CONFLICT` on the transition rather than only when the head moves.

The stage sits after the fixes rather than before them so one force-push carries both, which is also what keeps the reviewer reading a single delta. It tests with `git fetch origin main` followed by `git merge-tree --write-tree`, chosen over `gh pr view --json mergeable` because that field returns `UNKNOWN` exactly when a poll asks.

### The no-findings path

The test runs ahead of the no-findings guard rather than inside the fix path. Placing it at step 5 alone put it behind a guard that stops with a pass when the pull request carries no comments, and a branch goes stale from `main` moving rather than from anything the review said, so the case the stage exists for was the one shape it could not reach. The guard now decides on the test rather than on the finding count, and a run carrying no findings skips to the rebase.

Opening that path meant the three steps behind it stopped being true. The reply maps each finding to what changed, the terminal comment says every finding was addressed, and the output line counts them, all against a pull request carrying none. Each gets a rebase-only form rather than an empty list, and the reply takes a `## Rebase` heading rather than `## Review response`, since the second claims a review the run never read and would sit under a `## Review` that does not exist. The heading also stays outside that family so the close-out's first-line equality test cannot match it.

### Two runs of the test

It also runs twice. `git merge-tree` reads committed history and the fixes are uncommitted at step 5, so a branch that merges clean as committed, whose fixes touch lines `main` moved, passes the first test and reaches the remote unmergeable. The second run sits after `git-followup` commits, and it costs an extra force-push only in that narrow case. The fixes are uncommitted by then, so the stage stashes before the rebase and pops after, and the resolution rules cover hunks from both. Both halves are conditional on a dirty tree, since a run answering every finding as a conscious-accept leaves nothing to stash and an unconditional pop would restore an unrelated entry from an earlier session. That same run has no commit for `git-followup` to carry either, which is why the push leg names a direct force-push for it.

### Conflict resolution

The rules are stated where the stage runs, which is what makes it safe. A wholesale `--ours` or `--theirs` drops one side silently and passes every check, since both sides are valid content, and a generated file merged by hand produces a diff the next regen discards. Half of the live case was exactly that, two `index.md` files carrying no `auto: false`. The other half was authoring rather than merging, an entry that opens by counting what follows and now had to count three, which is why the worker owns this and the orchestrator cannot.

No comment channel was built for it. Both sides of every hunk sit in the conflict, `main` is what the operator approved, and `git log origin/main` names what landed, so a per-conflict comment would restate the diff and add a surface the worker waits on. A hunk the tree does not settle stops instead and reaches the operator as an ordinary finding on the next pass, which holds only because the stage forbids guessing rather than leaving it to judgment.

`git-followup` absorbed the consequence at its push, forcing under a lease when the tracking branch no longer reaches the head. Its plain `git push` was rejected on a rewritten branch, so the stage would have dead-ended one step past the resolution it exists to perform. The re-read is already covered above, since the close-out's ancestry test falls back to a full pass on exactly this branch shape.

## The origin split at Step 6

`claude-autoship` Step 6 splits findings by origin before it reads severity. A critical or should-fix finding the branch inherited stops the chain, and one this run caused is repaired in place at any severity, bounded at a single pass the way Step 3 bounds verify. Severity alone was the original test and it read "Do not auto-fix findings", which is the sentence twelve recorded runs stopped on while holding defects nobody else had shipped. Each cost a round trip to hand back work the same session had created moments earlier.

Origin is causation rather than authorship, which is the half that decides the hard cases. Staleness a run induces in a file it never opened is its own, so the test reaches a sibling skill body left wrong by a change to the origin-key set. The plan's file list is not the boundary either. It scopes what a run builds, and reading it as a review boundary is scope discipline applied to the wrong question, which is how one run gated a fix on the file it landed in rather than on who caused it.

An offer to fix is a stop however it is worded. Naming a finding self-inflicted in the report and closing on a menu of resolutions leaves the operator holding the work, so the step forbids presenting the repair as a choice and the receipt records the fix as landed.
