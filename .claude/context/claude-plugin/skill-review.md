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

A router is reviewable only through what it says. Almost every `toolkit-operator` route ends in a handoff or a report rather than a file, so the local pass and the pull request pass both read a body claiming a route and neither can tell whether the route fires. The drift report it reads shipped with three sandbox arms and was confirmed against six real targets, while the router consuming that report had never been executed by anything, and the ship report still read as though the update path were proven.

The `reply` expectation is what closes it. It reads `result` off the envelope `max_turns` already reads, so scoring a route costs nothing beyond the run, and the token worth pinning is the name of the skill or command the route hands to. Five arms were using it before the router shipped, `claude/setup-init/fresh` among them, so the mechanism was in place and the arms written for the report asserted only the file it produced.

Pinning phrasing is the cost, and it is why every route pin is paired. A reply naming `migration-standards` in a sentence declining to route still passes, so each arm carries a `manual` entry stating the negative a substring cannot express, and the arms whose skills may execute nothing assert the tree as well: the root layout is still at the root and nothing appeared under `.claude/`.

Where a handoff may legitimately continue into the skill it names, as a fresh target's does into `setup-init`, no tree assertion is declared at all, since none separates the router doing the work from the router routing to something that does it. The arms themselves are catalogued in `.claude/context/sandbox/coverage.md`.

## The review two-pass model

`claude-pr-review` reads that same roadmap path and asserts nothing from it, so it carries no defect to fix there. Its read informs a review comment, and the body sits inside a rewrite's file set where an edit would have bought a rebase for no behavior change.

That rewrite landed as a second pass the skill had never described. `claude-pr-review` posts twice over a pull request's life, a first pass and a close-out, and `claude-orchestrate` step 7 assumed the second one while the skill body defined only the first. The body path carries the head commit now, `body-<number>-<short-sha>.md`, because keying on the pull request number alone stops two sessions reviewing different pull requests from colliding and says nothing about one session posting twice.

Callers invented five spellings for the second file across roughly twenty-five scratch files, and the sessions that had already written the defect down overwrote their first-pass body anyway. A name the caller has to choose is a name the caller gets wrong, so the fix is that the second segment is derived.

### When the head repeats

Deriving from the head leaves a later pass with no legal name whenever the head stops moving, which is an ordinary state rather than an error. A fix landing in gitignored records produces no commit, since the return leg delegates its push to `git-followup` and that skill stops on an unchanged tree, and a finding the worker accepts as recorded produces no change at all. The close-out is still owed on both routes, because the newest heading is what an operator reads to decide whether the branch is blocked.

So a repeated head takes a third segment off the `## Review response` comment the pass answers. The thread is what moved, the id is a real object rather than a suffix someone picked, and the head still leads the name, so the second body sorts beside the first. Both prohibitions survive intact instead of gaining an exception. A pass index was the other candidate and it loses because nothing in the thread carries it, so a session would count prior comments to pick the next one, which is the hand-chosen suffix the rule already forbids.

The number sits only in the comment `url`. `gh pr view --json comments` returns a GraphQL node id under `id`, which names the same comment in a form the thread does not show. Extracting it needs a null guard, since the jq that splits the url aborts on an empty selection and an aborted command reads as an error rather than as the empty result the stop is written against.

Selecting the response also has to be scoped by the prior pass's `submittedAt` rather than by the heading alone. A heading match alone takes the newest response in the thread whatever its age, so a re-run after a close-out resolves the id that close-out already used and rebuilds the collision the third segment exists to prevent. Nothing about that run is anomalous, since the skill is invocable by hand, so the unscoped read fails on an ordinary path rather than at an edge. Testing whether the derived name is already on disk was the other candidate and it is weaker, because the scratch folder is gitignored and a second machine holds none of it, so the test passes exactly where the record it consults is missing.

An empty derivation is a head repeating with no response behind it, so the pass has nothing to add and stops rather than writing a second body over one commit. Where a response does sit there, it is also the entire read: the equality that triggers the naming case makes Step 2's range empty, so the comment rather than the delta is what says whether a prior finding landed.

Deriving it also decides what a close-out reads. `gh pr view --json reviews` returns `commit.oid` per review, so the last comment the skill posted names the commit the prior pass covered, and the close-out reads that range to the head rather than the whole change. The same field settles the rebase case without a second mechanism: after a force-push the prior commit no longer reaches the head, `git merge-base --is-ancestor` exits non-zero, and the skill pays for a full pass and states that in the body. Scoping by the prior review's timestamp instead would have needed its own rebase test, since a commit's author date can predate the push that put it on the branch.

### The heading contract

The heading is the half a reader sees without opening anything, so it reports state rather than pass number. `## Review` covers a pass carrying a finding at any severity and `## Review closed` covers a pass carrying none, so the state comes off the most recent comment rather than off a label on a kind of pass. A close-out does not close the pull request, which is why the rule reads the latest heading rather than promising the closed one is last.

Coupling it to the pass number instead was measured wrong on two reviews in five, since twenty-one of fifty-three close-outs reported an open finding under a heading asserting closure. `claude-address-review` nests `## Review response` under the first of those, so a thread reads as opened, answered, still open, closed.

Sharing a prefix across that family is why the detection matches the first line for equality rather than testing a prefix. A prefix test also accepts `## Review response`, and it happened to be safe only because `claude-address-review` posts through `gh pr comment`, which lands in `.comments` and never in `.reviews`. Nothing recorded that dependency, so the close-out would have started scoping to the worker's reply the day that skill switched to posting a review. An equality test costs the same and owes nothing to a sibling's choice of command.

A finding withdrawn on a reply's argument leaves that count too, so a pass withdrawing every finding it carried reads as a close-out while still owing a body the short close-out line cannot carry, since that line credits a fix nobody made. `.claude/context/claude-internal.md` holds why a reply reaches the thread at all and which class of reply stays off it.

### One threshold under the heading and the dispatch

The threshold moved four times on 2026-08-14, and the defect this section records is the cost of each move rather than any one value it took. It ran as a heading on any finding with a dispatch floored at should-fix, then both at should-fix, then a heading at should-fix with a dispatch on any finding, and it now sits with both on any finding.

The first arrangement left a minors-only pass between two rules that disagreed, so such a pass read as open while no rule told anyone to act on it. The same situation was handled two ways within one hour, one thread closing with the item named in prose and a zero count and the other staying open on a count of one. Unifying both at should-fix answered that and held for hours, until a live minors-only pass closed cleanly and dispatched nobody and the work sat until the operator ran the address skill by hand.

Taking the dispatch floor off rather than the heading rule was the third arrangement, and it rests on the measurement that made the grade load-bearing: across 8 findings on an archived pass, 3 were posted as minor and 2 of those were defects a worker fixed rather than recorded. A grade running that low cannot decide whether anyone is sent. What it left behind is a thread reading closed while work was owed on it, which the operator met in practice and reversed the same day. The ladder itself went on glossing a minor as visibility only through both arrangements, which is a claim about who acts rather than a definition of the grade, so it now names the lowest grade and says the ranking decides nothing about the dispatch.

So the heading came down to the dispatch rather than the dispatch going back up to the heading. A pass carrying anything posts the open heading and sends the session holding the branch, and the closed heading is reserved for a pass carrying nothing at all, which makes it the marker worth scanning for. The summary line stops reporting the merge as clear under either heading, since a thread reading open cannot also report that nothing blocks it.

The cost is that a reader can no longer take the merge decision from the heading alone and reads it off the counts on the summary line instead. That cost was stated when the option was offered and accepted with it. What it buys is one threshold governing both again, which is the invariant the poll's stalled state already assumed.

Restating the threshold is what made each move expensive. Eight files carried 32 statements of it, measured at `69c6213e`, and one surface contradicted itself on main: the orchestrate skill's dispatch step said any severity while the bullet under it named a floor the line above had removed. `claude-pr-review` now states the rule once and every other surface cites that skill by name. A citation is the whole mechanism available, since the surfaces ship separately and none of them can import anything, so what this buys is one edit for the next move rather than eight.

What a citation does not buy is a check. `poll.sh` and the `pr-review` sandbox scenario both pin heading strings the skill owns, and nothing compares either against the body that states the rule, so a skill edit missing one leaves an arm scoring green against a rule nothing follows. Building that check was declined rather than deferred: comparing a script's literals against prose is a parser over prose, which is a larger question than the threshold it would guard. The gap is recorded here instead, and it is the reason a change to the rule reads every pinning surface by hand.

A minor the dispatched worker declines goes to the `## Findings` section of the task the branch closes, which the queue-refill sweep already names as the destination for a finding that changes another task. That routing does not follow the threshold, since a declined minor needs a surface surviving the merge whatever heading the pass carried.

Whether a finding is new in the diff or pre-existing and out of it is the real difference behind the two handlings, and it stays off the thread. It is a second axis on a ladder already called imprecisely, and the single threshold closes the gap without it.

`poll.sh` carries the detection, because a rule firing only when a session reads it is what produced the inconsistency. A third jq filter takes the last family review's first line rather than its commit, and a `STALLED` state names a pull request whose open pass covers the head with nothing following it. Reporting a standing condition rather than a transition would fire on every later run and the board would never read `No movement.`, so the classification writes a marker into the baseline field it derives and reports once per entry.

The heading alone cannot decide it, which the marker hides rather than fixes. One threshold under the heading and the dispatch means an open pass is a dispatch owed and made, so the healthy thread is a worker still working and every dispatched pull request would be named minutes into the work it was sent to do. A signal firing on the healthy path is one an operator learns to skip, which is the always-on failure the runbook already records from the other direction. The same filter therefore emits the pass's age beside its heading, computed in jq because `date -d` is GNU-only, and the state adds a floor of two hours. That is several times a review-to-follow-up cycle and well short of a thread left overnight, and a project whose workers run longer raises the constant. A review carrying no timestamp reads as age zero and classifies nothing, matching the answer a pull request the run could not read already gets.

Keying on elapsed time rather than on two consecutive quiet polls also drops the history the state needed. A baseline written before the field exists reads as not yet reported, which is what it is, so the first run after an upgrade names a thread already past the floor instead of waiting a poll to confirm what it can already see. The prose half still cannot be dropped, since the script reports and never instructs and the state catches only a thread already in the wrong shape.

Unifying the heading with the dispatch widened what the state reaches back to every stalled dispatch, since a pass carrying anything posts the open heading this reads. A stalled minor now reports on the same terms as a stalled blocking finding, where the split arrangement left it invisible. The state stays a heading test either way, so nothing here pins the summary line's counts, which is a second string from `claude-pr-review` that this script would have to track through every edit.

## The rebase stage

`claude-address-review` gained a stage between the doc refresh and the push, because a branch that answered every finding still stopped merging once a sibling landed first. No worker skill mentioned rebasing at all, so the return leg closed the review and handed back a branch nobody could merge. Detection needed no new surface, since the orchestrator's poll already reports `CONFLICT` on the transition rather than only when the head moves.

The stage sits after the fixes rather than before them so one force-push carries both, which is also what keeps the reviewer reading a single delta. It tests with `git fetch origin main` followed by `git merge-tree --write-tree`, chosen over `gh pr view --json mergeable` because that field returns `UNKNOWN` exactly when a poll asks.

### The no-findings path

The test runs ahead of the no-findings guard rather than inside the fix path. Placing it at step 5 alone put it behind a guard that stops with a pass when the pull request carries no comments, and a branch goes stale from `main` moving rather than from anything the review said, so the case the stage exists for was the one shape it could not reach. The guard now decides on the test rather than on the finding count, and a run carrying no findings skips to the rebase.

Opening that path meant the three steps behind it stopped being true. The reply maps each finding to what changed, the terminal comment says every finding was addressed, and the output line counts them, all against a pull request carrying none. Each gets a rebase-only form rather than an empty list, and the reply takes a `## Rebase` heading rather than `## Review response`, since the second claims a review the run never read and would sit under a `## Review` that does not exist. The heading also stays outside that family so the close-out's first-line equality test cannot match it.

### Two runs of the test

It also runs twice. `git merge-tree` reads committed history and the fixes are uncommitted at step 5, so a branch that merges clean as committed, whose fixes touch lines `main` moved, passes the first test and reaches the remote unmergeable. The second run sits after `git-followup` commits, and it costs an extra force-push only in that narrow case.

The fixes are uncommitted by then, so the stage stashes before the rebase and pops after, and the resolution rules cover hunks from both. Both halves are conditional on a dirty tree, since a run answering every finding as a conscious-accept leaves nothing to stash and an unconditional pop would restore an unrelated entry from an earlier session. That same run has no commit for `git-followup` to carry either, which is why the push leg names a direct force-push for it.

### Conflict resolution

The rules are stated where the stage runs, which is what makes it safe. A wholesale `--ours` or `--theirs` drops one side silently and passes every check, since both sides are valid content, and a generated file merged by hand produces a diff the next regen discards. Half of the live case was exactly that, two `index.md` files carrying no `auto: false`. The other half was authoring rather than merging, an entry that opens by counting what follows and now had to count three, which is why the worker owns this and the orchestrator cannot.

No comment channel was built for it. Both sides of every hunk sit in the conflict, `main` is what the operator approved, and `git log origin/main` names what landed, so a per-conflict comment would restate the diff and add a surface the worker waits on. A hunk the tree does not settle stops instead and reaches the operator as an ordinary finding on the next pass, which holds only because the stage forbids guessing rather than leaving it to judgment.

`git-followup` absorbed the consequence at its push, forcing under a lease when the tracking branch no longer reaches the head. Its plain `git push` was rejected on a rewritten branch, so the stage would have dead-ended one step past the resolution it exists to perform. The re-read is already covered above, since the close-out's ancestry test falls back to a full pass on exactly this branch shape.

## The origin split at Step 6

`claude-autoship` Step 6 splits findings by origin before it reads severity. A critical or should-fix finding the branch inherited stops the chain, and one this run caused is repaired in place at any severity, bounded at a single pass the way Step 3 bounds verify. Severity alone was the original test and it read "Do not auto-fix findings", which is the sentence twelve recorded runs stopped on while holding defects nobody else had shipped. Each cost a round trip to hand back work the same session had created moments earlier.

Origin is causation rather than authorship, which is the half that decides the hard cases. Staleness a run induces in a file it never opened is its own, so the test reaches a sibling skill body left wrong by a change to the origin-key set. The plan's file list is not the boundary either. It scopes what a run builds, and reading it as a review boundary is scope discipline applied to the wrong question, which is how one run gated a fix on the file it landed in rather than on who caused it.

An offer to fix is a stop however it is worded. Naming a finding self-inflicted in the report and closing on a menu of resolutions leaves the operator holding the work, so the step forbids presenting the repair as a choice and the receipt records the fix as landed.
