---
name: claude-orchestrate
description: Asserts the orchestrator role for the current session, holds the build loop and the queue-refill sweep, and dispatches to the roadmap, feature, review, and worktree skills. Use when asked to "be the orchestrator", "run the orchestrator", "orchestrate this project", or to set up the control session for parallel feature builds. Do NOT build features or merge PRs in this session.
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

## On invocation

Read the board in parallel, resolving the paths at the main worktree root per Worktrees in `CLAUDE.md`:

- `.claude/ROADMAP.md`: the active version and what it groups
- `.claude/tasks/index.md`: what is queued
- `.claude/plans/*.md`: features already planned and ready to hand off
- open PRs via `gh pr list --json number,title,headRefName,isDraft`

Then output the state of play so the human knows what to launch, review, and merge.

## Output

```plaintext
Orchestrator ready. Active: vX.Y, <the Now row's outcome>.

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

## The loop

1. Own the roadmap. Run `claude-roadmap` to draft or resequence `.claude/ROADMAP.md` from `.claude/REQUIREMENTS.md`. Capture a needed resequence in the plan or a task file for a worker to apply in its branch, so the tracked edit ships in a PR rather than dirtying main.
2. Plan the next feature. Run `claude-feature` here, with the cross-feature context, to write a plan to `.claude/plans/`. Planning stays in this warm session so the plan front-loads reasoning a cold worker would otherwise re-derive.
3. Decide parallelism and merge order. Note which plans touch a shared wiring seam so their PRs merge in sequence, not at once.
4. Verify the plan against the tree. Reading it is not enough, since a plan goes stale from whatever merged after it was written. Grep for each construct it names and count the sites against the count it claims. Check that every phase label it cites is still open. Open each file it describes rather than trusting its account of the contents. Correct the plan before handing it over.
5. Hand off. The human opens a worker worktree with `claude-worktree` and runs `claude-autoship` against the plan. The orchestrator does not spawn workers.
6. Review the PR. When a worker opens a PR, run `claude-pr-review` to post findings to it. This is the deep, independent pass. The worker's autoship self-review was only the green gate.
7. Close the loop. After the worker runs `claude-address-review`, re-review if needed, then the human merges. Tell the trailing worker to rebase when its branch shares a seam with the merged one.

## Boundaries

- Run one orchestrator at a time. The board is gitignored, so a second session sees none of this one's writes: two task files land minutes apart under different labels for the same work, one session archives a task mid-sweep in the other, and each archives a plan the other had retargeted. An Owner column does not fix this, since neither session can read the other's rows.
- Do not implement features in this session. Hand the plan to a worker.
- Do not merge. Recommend merge or changes. The human merges.
- Do not spawn worker sessions with agents. The human launches each worktree so every build is an independent, steerable stream with its own PR.
- Do not edit tracked files from this session. Record a change identified while orchestrating against the task that owns it, so it ships from that task's branch and lands in a pull request.
- Do not hand a worker anything but a plan, since scope lives there. A plan carries exact diffs only when they are already known, otherwise it states the scope and the open questions and lets the worker write the diff.

## Refilling the ready queue

Keep enough planned, non-conflicting tasks available that a free worker never waits, and place the findings the last merge produced before promoting anything new. Run this after every merge and whenever the ready list thins.

1. Run `gh pr list --state open` and `git log --oneline -8`. Report any pull request whose review has not been posted and stop for that one first.
2. For each pull request merged since the last sweep, place every finding it produced. Route a finding that changes a rule to the standard or rule that states it, one that changes another task to that task's Findings, and one that overturns a groundwork lean to that folder marked answered. Never leave a finding in a pull request thread alone.
3. Archive what closed. A task whose outcomes are all `[x]` runs `claude-docs` for the plan sweep, then `claude-tasks` to archive. A task whose outcomes describe standing policy rather than a deliverable never closes on its own, so hand it to a worker to encode the policy where it is enforced, then cut the outcomes with the reason recorded and archive once that branch merges. Encoding it from this session would write a tracked file, which Boundaries forbids.
4. Read `.claude/tasks/priority.md` and count entries under `Now` that carry a written plan. Keep one in reserve beyond what is running.
5. Promote by whether a task establishes functionality rather than by age. Prefer a task that adds or proves a mechanism over one that trims, tidies, or audits an existing surface.
6. Before promoting a candidate, list the files it touches against every task already running, per Parallelism below. Name the overlap and serialize when the sets are not disjoint.
7. Write a plan for each newly promoted task with `claude-feature`, then report:

```plaintext
Findings placed: <finding> → <destination>
Archived: <task>
Promoted: <task>, touches <surfaces>, parallel with <task> because <disjoint sets>
Serialized: <task> behind <task>, both write <file>
Ready now: <tasks with plans, and what each waits on>
```

Treat a task that edits `.claude/context/` entries wholesale as conflicting with every other task, because the root instruction file requires each task to update its own domain entry as it lands.

Do not promote a task to fill the queue when nothing qualifies. A thin queue is a real answer and it beats a plan nobody needed.

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
