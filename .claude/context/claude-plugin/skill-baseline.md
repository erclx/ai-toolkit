---
title: Skill diff baseline
description: The merge-base block six skills share, the read against write asymmetry when it fails to resolve, and the narrower test autoship carries
---

# Skill diff baseline

The diff baseline is a block that originated in `claude-docs` and now runs in five more skills. It resolves a merge base against `origin/main`, falls back to local `main`, and scopes what a skill reads to the change under review. Preferring the remote is what stops a local `main` trailing behind from pulling other people's merged commits into the set.

## An unresolvable baseline

A `git init` project on `main` with no remote resolves no usable baseline, which is the ordinary shape of a scaffolded target project rather than an edge case. That costs only the committed half of the diff, since the working tree and untracked files still scope correctly. The marking step recovers the committed half by reading `git log -p -1`, which supplies content where a bare file list would not. The wireframe sweep and the context refresh run on the working tree and untracked files, and skip only when that set is empty. Neither ever substitutes the whole tree for a missing baseline, because both write, and a set that wide would stub a wireframe per uncovered surface and rewrite every context entry. The asymmetry with the marking step is deliberate and worth keeping: on a scaffolded project the last commit is the scaffold commit, so the `git log -p -1` recovery is the whole tree by another route, which a step that only reads can tolerate and a step that writes cannot. Widening what a step reads is safe. Widening what a step writes is not.

## The shared-resource rule

That baseline is the worked case behind a rule split across two skills. One step in `claude-docs` resolved the diff baseline and three consumed it, and the fallback for an unresolvable baseline was written against the marking step, which only reads. Under that same fallback the two sweeps that write would have stubbed a wireframe for every uncovered surface and rewritten every context entry.

So `claude-feature` obliges a plan that establishes a resource with more than one consumer to list them and mark each read or write, and `claude-pr-review` carries the matching lens beside Integration and Contract. Both skills ship to target projects, where a consumer is a call site, a module, or a component rather than a skill step, so the clause names the unit generically. The review half is what catches the miss, since an author who never noticed the resource was shared will not notice the authoring clause either. `claude-review` stays out of it, because an author reviewing their own change cannot catch a consumer they never enumerated.

Root `CLAUDE.md` and the `CLAUDE.md` seed each own the policy statement, and the skill owns only the mechanism, so the skill states what it does without re-deriving why. The seed keeps its own copy because a scaffolded project cannot point at the toolkit's file.

## The port to four more skills

That baseline then reached four more skills, which had never had it. `claude-review`, `docs-sync`, `claude-standards-audit`, and `git-pr` each resolved a base against bare local `main`, so on `main` every committed change dropped out and the skill reported a clean result rather than admitting it could not see the work. `git-pr` spelled it `git diff main..HEAD`, a two-dot range that compares tips and resolves no merge base, so a grep for the bare form never matched it and an advanced local `main` showed up as reversed changes in the description. Its `git log main..HEAD` carried the matching defect on the commit side, where a local `main` trailing `origin/main` leaves commits in the range that the diff already excludes, so the description lists work whose changes appear nowhere in it. Both halves read `<base>` now, which is what keeps the commits and the changes describing one branch. Four of the eleven corrected sites were guards, which is the half that decides whether a fix lands at all: correcting the working read and leaving the guard ships a skill that still stops before it reaches the corrected code.

Porting the block also corrected the test for an unusable baseline. `claude-docs` calls the base unusable when it came from local `main` and equals HEAD, which keys on where the ref came from and misses the case where `origin/main` resolves a merge base that also equals HEAD. That is the ordinary shape of a feature branch before its first commit, so the narrow test would have gone blind on the sessions these skills run in. `claude-docs` never pays for it, because it unions the committed, working, and untracked sets and the committed half going empty costs it nothing. Any skill reading the committed half alone needs the wider test, which is that the base equals HEAD whichever ref resolved it. Correcting the wording in `claude-docs` itself is a follow-up rather than part of the port, since nothing there reads it wrongly today.

## The narrower test autoship carries

`claude-autoship` was held back from that port on purpose and became the fifth skill to take the baseline. Its classifier decides whether a review runs at all, so widening what it sees turns a branch that looked prose-only into a mixed one and changes behavior rather than only correctness. It shipped with the bug filed against that classifier instead of inside a five-file diff, since a stale baseline is one of the ways the file list comes back empty and the vacuous test is what then waves it through.

Its unusable test is narrower than the four siblings', which is the wider rule applied rather than an exception to it. A skill reading the committed half alone needs the base-equals-HEAD arm, and the classifier diffs the base against the working tree, so the uncommitted work stays in the set when that arm would fire. Autoship reaches Step 5 before `git-stage` has committed anything, so the base equals HEAD on every ordinary run and porting the arm verbatim would stop the chain every time. The skill body says so at the point of the omission, because the next reader porting the block will otherwise correct it back.

The empty list is what stops the chain instead. Routing it into review rather than stopping would re-create the silent skip by a longer path, since a review of no files produces no findings and the findings step reads that as a clean pass. The prose-only skip survives untouched, because the defect was a broken read making every branch look prose-only rather than the skip itself.

A plan whose output is entirely gitignored still reaches the stop rather than a fix, which is a separate defect that surfaces six steps later at `git-stage`. The stop names that case apart from a plan yet to produce output, since the two want opposite responses and a single message covering both sends the operator to the wrong check. Advising a re-run once the output is tracked is the wrong fix for scratch that is gitignored by design, and followed literally it commits scratch to close a stopped run.
