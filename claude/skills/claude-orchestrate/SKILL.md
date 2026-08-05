---
name: claude-orchestrate
description: Asserts the orchestrator role for the current session, holds the build loop and the queue-refill sweep, and dispatches to the feature, review, and worktree skills. Use when asked to "be the orchestrator", "run the orchestrator", "orchestrate this project", or to set up the control session for parallel feature builds. Do NOT build features or merge PRs in this session.
disable-model-invocation: true
---

# Claude orchestrate

This session is the orchestrator: the one warm session that holds the
cross-feature picture. It plans and reviews. It does not build, and it does not
merge. Building happens in cold worker sessions the human launches. Merging is
the human's gate.

This skill holds the framing, the board procedure, and the dispatch. Every step
that builds something runs an existing skill. The queue rules below decide which
one runs and when.

Run `aitk docs operating-model` for the model this skill enacts: the two roles
and what each owns, the loop end to end, why the worker's self-review and this
session's review are different passes, and how a feature is sized.

## On invocation

Read the board in parallel, resolving the paths at the main worktree root per Worktrees in `CLAUDE.md`:

- `.claude/tasks/priority.md`: execution order and what each task is waiting on
- `.claude/tasks/index.md`: what is queued
- `.claude/plans/*.md`: features already planned and ready to hand off
- `.claude/ROADMAP.md`: sequencing rationale, when the file exists
- open PRs via `gh pr list --json number,title,headRefName,isDraft`

Then output the state of play so the human knows what to launch, review, and merge.

`priority.md` is the ordering source. `index.md` sorts by filename and says nothing about order, so read the sequence from the first and never infer it from the second. When `priority.md` is absent, report the queue and say the order is unrecorded.

The roadmap is optional and this skill does not require it. It carries why a sequence is what it is, changes only when strategy changes, and is absent in a project whose scope has already shipped. Report what it says and name it as the source. Never assert an active version the file does not state, and say nothing about one when the file is missing.

A compaction is a moment this skill cannot detect, so the human asks for each side of it and this skill reads the matching runbook when they do. On a request to write the handoff or save the session, read `${CLAUDE_SKILL_DIR}/references/orchestrator-handoff.md` and follow it. It writes `.claude/tasks/session.md` with the state of play, the decisions taken under delegated authority, the mistakes worth not repeating, and the standing cautions. On a request to resume after a compaction, read `${CLAUDE_SKILL_DIR}/references/orchestrator-resume.md`, which reads that file back with the board and the groundwork behind the live work. Write nothing to the handoff that the board, a task file, or a groundwork folder already carries.

The review trigger takes the same shape. `references/orchestrator-poll.md` holds the loop prompt and the condition under which the poll runs, and `scripts/poll.sh` is what the prompt invokes. A session holding a recurring-prompt scheduler starts and cancels that loop itself, and no hook or check does, so the condition holds only while whoever holds the loop applies it.

That routing lives in this body and this skill is user-invoked, so a session that has dropped the body routes nothing and the request lands as ordinary conversation. Approaching a compaction is when a long session is likeliest to have dropped it, which is the same moment the handoff exists for. Re-invoke `/aitk:claude-orchestrate` first whenever the session has run long or the ask goes unanswered. The two runbooks sit at `references/orchestrator-handoff.md` and `references/orchestrator-resume.md` inside this skill's own folder, so a person who knows their plugin root opens either one directly and follows it without this skill loaded at all.

## Output

```plaintext
Orchestrator ready.

Roadmap: vX.Y, <the Now row's outcome>, as of <date>.

Ready to build (hand each to its own worker):

<feature>
  plan: .claude/plans/feature-<slug>.md
  → /claude-autoship

<feature>
  no plan yet. A handoff without a plan has no scope
  → /claude-feature here first

In review (your turn):

PR #<n> <title>
  → /claude-pr-review

Merge order: #<a> before #<b> (shared seam: <files>).

Next: <the single most useful action>
```

Omit any section with nothing in it. Recommend a handoff only for a plan whose file set is disjoint from every track already in flight, per Parallelism below.

Omit the `Roadmap` line when `.claude/ROADMAP.md` is absent. Quote the `Now` row rather than restating it, and date the line from `git log -1 --format=%ad --date=short -- .claude/ROADMAP.md` so an old sequence reads as old instead of as the state of play.

That command returns nothing for a roadmap that exists but has never been committed, which is the state `claude-roadmap` leaves behind when it writes the file and declines to stage it. Write `uncommitted` as the date in that case. A blank there would read as a formatting slip rather than as the newest possible sequence.

### Every later turn

The block above covers invocation alone. A sweep report, a board report, and an analysis each end in something the human decides, so each opens with the same three slots and puts its evidence underneath:

```plaintext
State: <what changed since they last looked>

Decisions:
  1. <one line each, or "none open">

Next: <the single most useful action>
```

Keep the detail below the block and keep it skippable. A decision reached at the bottom of three paragraphs has been buried, which is the failure this shape exists to prevent. Reuse the vocabulary above rather than inventing a second one, and keep a file set on the row claiming it so the reader can check a disjointness claim instead of taking it.

Write no shape for a correction. A correction is a sentence, and a format for admitting error invites ceremony where plainness is the whole value.

## The loop

1. Own the roadmap while a scope exists to sequence. Capture a needed draft or resequence of `.claude/ROADMAP.md` in the plan or a task file, naming the MVP list in `.claude/REQUIREMENTS.md` as the source, so a worker runs `claude-roadmap` in its branch and the tracked edit ships in a PR rather than dirtying main. Stop owning it once that list has shipped, since later work then arrives as discrete items rather than as versions.
2. Plan the next feature. Run `claude-feature` here, with the cross-feature context, to write a plan to `.claude/plans/`. Planning stays in this warm session so the plan front-loads reasoning a cold worker would otherwise re-derive. A constraint supplied from here that names a surface to leave alone states which of two acts it forbids, and the rule governing that is Step 3 of `claude-feature` under Constraints.
3. Decide parallelism and merge order. Note which plans touch a shared wiring seam so their PRs merge in sequence, not at once.
4. Verify the plan against the tree. Reading it is not enough, since a plan goes stale from whatever merged after it was written. Grep for each construct it names and count the sites against the count it claims. Check that every phase label it cites is still open. Open each file it describes rather than trusting its account of the contents. Correct the plan before handing it over.
5. Hand off. The human opens a worker worktree with `claude-worktree` and runs `claude-autoship` against the plan. The orchestrator does not spawn workers.
6. Review the PR. When a worker opens a PR, run `claude-pr-review` to post findings to it. This is the deep, independent pass. The worker's autoship self-review was only the green gate. Learning that a PR moved is the mechanical half, so read `${CLAUDE_SKILL_DIR}/references/orchestrator-poll.md` and start the poll it carries on the first dispatch rather than checking the board by hand. It routes a moved or answered pull request straight to a re-review and reports an opened one without acting, which keeps every first pass a batched judgment this session triggers.
7. Close the loop. After the worker runs `claude-address-review`, re-review if needed, then the human merges. Tell the trailing worker to rebase when its branch shares a seam with the merged one.

## Boundaries

- Run one orchestrator at a time. The board is gitignored, so a second session sees none of this one's writes: two task files land minutes apart under different labels for the same work, one session archives a task mid-sweep in the other, and each archives a plan the other had retargeted. An Owner column does not fix this, since neither session can read the other's rows.
- Do not implement features in this session. Hand the plan to a worker.
- Do not merge. Recommend merge or changes. The human merges.
- Do not spawn worker sessions with agents. The human launches each worktree so every build is an independent, steerable stream with its own PR.
- Do not edit tracked files from this session, at any size. The boundary offers no proportionality exception and nothing enforces it.
- Do not hand a worker anything but a plan, since scope lives there. A plan carries exact diffs only when they are already known, otherwise it states the scope and the open questions and lets the worker write the diff.

The tracked-file boundary collides with `CLAUDE.md`, which says to handle a small edit immediately without a task entry, and this rule wins wherever the two meet. A session that writes a change cannot review it independently afterwards and no later session recovers that vantage, which is the separation `claude-pr-review` exists to supply. Record a change identified while orchestrating against the task that owns it, fold one no task owns into the next task touching the same surface, and file a task only when no such task exists or is expected. Run `claude-review` when the boundary is crossed anyway, since a branch-diff pass is not independent and is the only check a self-authored change can get.

## Refilling the ready queue

Keep enough planned, non-conflicting tasks available that a free worker never waits, and place the findings the last merge produced before promoting anything new. Run this after every merge and whenever the ready list thins. `${CLAUDE_SKILL_DIR}/references/orchestrator-sweep.md` wraps this procedure for a batch of merges and adds the plan re-verification that a merge invalidates.

Open the sweep by invoking `aitk:claude-memory-capture`. Both other callers are ship-chain skills and this session never ships, so without this the session that receives every operator correction is the one session that records none. The sweep is the closest bounded moment this session has to a ship, and it already runs once per batch of merges, which beats an end-of-session moment a compaction can cut short.

Capture is told this session does not commit, so it skips routing and writes memory files alone. A routed fact lands in a context entry, which is a tracked file, and Boundaries below forbids writing one from here. That is the correct split rather than a limitation: a domain fact belongs to the task that owns the surface and goes in that task's Findings, while what this session produces is feedback about how to work, which is exactly the class the memory folder keeps.

1. Run `gh pr list --state open` and `git log --oneline -8`. Report any pull request whose review has not been posted and stop for that one first.
2. For each pull request merged since the last sweep, place every finding it produced. Route a finding that changes a rule to the standard or rule that states it, one that changes another task to that task's Findings, and one that overturns a groundwork lean to that folder marked answered. Never leave a finding in a pull request thread alone.
3. Archive what closed. A task whose outcomes are all `[x]` runs `claude-docs` for the plan sweep, then `claude-tasks` to archive. A task whose outcomes describe standing policy rather than a deliverable never closes on its own, so hand it to a worker to encode the policy where it is enforced, then cut the outcomes with the reason recorded and archive once that branch merges. Encoding it from this session would write a tracked file, which Boundaries forbids.
4. Read `.claude/tasks/priority.md` and count entries under its `## Run now` heading that carry a written plan. Keep one in reserve beyond what is running.
5. Promote by whether a task establishes functionality rather than by age. Prefer a task that adds or proves a mechanism over one that trims, tidies, or audits an existing surface.
6. Before promoting a candidate, list the files it touches against every task already running, per Parallelism below. Name the overlap and serialize when the sets are not disjoint.
7. Write a plan for each newly promoted task with `claude-feature`, then report:

```plaintext
Captured: <memory file> (<type>), or "nothing worth capturing"
Findings placed: <finding> → <destination>
Archived: <task>
Promoted: <task>, touches <surfaces>, parallel with <task> because <disjoint sets>
Serialized: <task> behind <task>, both write <file>
Ready now: <tasks with plans, and what each waits on>
```

That block is the detail. Lead the reply with the three slots under Every later turn above, so the human reads what they own before the evidence for it.

Treat a task that edits `.claude/context/` entries wholesale as conflicting with every other task, because the root instruction file requires each task to update its own domain entry as it lands.

Do not promote a task to fill the queue when nothing qualifies. A thin queue is a real answer and it beats a plan nobody needed.

### Writing the board

Promoting, demoting, and archiving a row all write `.claude/tasks/priority.md`, and this session is the only writer apart from `aitk tasks archive`.

- Edit the file with the file-editing tool. A shell stream editor and an inline string replace both exit clean on a non-match, so a promotion that matched nothing leaves the board wrong with nothing reporting it, and the file-editing tool errors instead.
- Put a pointer in the Plan column, never prose. `## Run now` claims a written plan covers every open outcome, and `claude-autoship` refuses at its guard when it follows the column and finds no plan, which spends a worker dispatch to learn what the row should have said.
- Name the file set in the Touches column. The disjointness call in step 6 is only checkable later when the sets are written down rather than reasoned once and discarded.
- Re-resolve every Plan pointer after anything archives a plan. `claude-docs` moves a plan to `.claude/plans-archive/` and rewrites the citation in the task file alone, so a row for a task still on the board keeps pointing into `.claude/plans/` at a file that has moved. Workers running the ship chain on their own branches archive plans this board still cites, and the board reads as correct until a pointer is followed.
- Read the file back after writing it, since the row that lands is the row a worker acts on.

## Parallelism

No fixed number caps worker tracks. Collision between file sets is what binds, so
list the files a candidate touches against every track already in flight and open
it only when the sets are disjoint. What thins as tracks multiply is the review
attention each output gets, so add a track while you can still review every one
properly and stop when you cannot. Serialize any track that touches a shared
wiring seam with another in flight. Merge the branch with the smallest
shared-file footprint first, and merge a branch touching `CLAUDE.md`, a Claude
context entry, or a regenerated `index.md` last. Have every sibling rebase on
the new `main` before the next merge. Assign a distinct port per track when two
workers run a server, since each session spawns its own process.
