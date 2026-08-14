---
title: Operating model
description: Orchestrator and worker roles for building across parallel sessions
category: Workflow
---

# Operating model

A way to build fast and reliably across parallel Claude Code sessions without a
loop and without losing the human review gate. One warm session plans and
reviews. Cold worker sessions build. The human launches workers and merges.

This page covers the roles and the loop. For the worktree mechanism (isolation, merge
order, port collisions), see [Claude Code and git worktrees](../wiki/claude/claude-worktrees.md).

## Two roles

The split is by vantage, not by capability. Both are Claude Code sessions.

| Role         | Session                               | Owns                                           | Does not                      |
| ------------ | ------------------------------------- | ---------------------------------------------- | ----------------------------- |
| Orchestrator | One warm, long-lived session          | Roadmap, planning, deep PR review, merge order | Edit tracked files, merge PRs |
| Worker       | One cold worktree session per feature | Implement, self-check, open PR                 | Question the plan, merge      |

The orchestrator is worth asserting explicitly at the start of a session with
`claude-orchestrate`, which loads the loop and its boundaries. It is framing and
dispatch, not logic.

The orchestrator's cell reads every tracked file rather than every feature, and
it offers no exception for a small one. A correction found while orchestrating
goes to the task that owns the surface, or folds into the next task touching it,
because a session that writes a change cannot review it independently afterwards
and no later session recovers that vantage.

## The loop

One feature travels this path end to end.

1. Orchestrator captures a needed roadmap draft or resequence in the plan or a task file, naming `.claude/REQUIREMENTS.md` as the scope source, and a worker runs `claude-roadmap` in its branch so the tracked edit ships in a PR. The skill stops when that file carries a later scope section, since the MVP list it sequences has shipped and a fresh requirements pass owns what follows.
2. Orchestrator plans the next feature with `claude-feature`, writing a plan to `.claude/plans/`. Planning stays in the warm session because good planning is cross-feature. It needs the contract other features consume and the shared wiring seam. A cold session would re-derive or guess.
3. The human opens a worker worktree with `claude-worktree` and runs `claude-autoship` against the plan. The worker builds, self-checks, opens a PR, and stops at the PR boundary.
4. Orchestrator reviews the PR with `claude-pr-review` and posts findings to it.
5. Orchestrator tells the session holding that branch to run `claude-address-review` once the pass posted a finding at any severity, resolving the target from a session listing taken at that moment and reporting the invocation for the human when no live session holds it. The worker addresses the findings, rebases onto `origin/main` when a sibling landed first and left the branch unable to merge, then pushes a follow-up. A pass carrying only minor findings dispatches too, since the grade runs low often enough that a floor at should-fix loses fixes a worker would have made.
6. Orchestrator closes the review out with `claude-pr-review` again. The second pass reads only the commits the follow-up added, or the worker's response alone when the follow-up added none, and posts under `## Review` when it finds a critical or a should-fix and under `## Review closed` otherwise, so a reader learns the merge decision from the heading and the counts from the line under it. Repeat from step 5 until a pass closes the review.
7. The human reads the result and merges. The orchestrator tells any trailing worker whose branch shares a seam with the merged one to run `claude-address-review`, which rebases whether or not the review left anything open.

There is no loop construct here. Each worker is a single build that halts at the
PR. The merge stays a manual human gate. Reliability comes from the plan being
complete enough that the cold session does not come back with questions, and
from merging promptly so the next PR does not rot against a moving main.

## Two review layers

The worker's self-review and the orchestrator's review are not the same pass run
twice. They differ by vantage.

- Worker self-review, inside `claude-autoship`: the session that wrote the code. Its job is "did I build the plan and does it pass?" Mechanical, and structurally blind to its own misreadings, because the same misreading wrote both the code and the review. This is the green gate that decides whether the PR opens.
- Orchestrator review, via `claude-pr-review`: a fresh session with cross-feature context (the roadmap, a sibling PR in flight, a downstream contract). Its job is "is this right and does it fit?" It can question the plan itself. This is the merge gate.

They collide only if the worker also runs a deep pass. Keep the worker's review
light and let the orchestrator own the deep, independent one. The human read at
merge is the final gate. No layer repeats another.

## The review channel

Findings travel on the PR. `claude-pr-review` posts them there.
`claude-address-review` reads them back, fixes each, replies or resolves the
threads, and pushes a follow-up. `claude-pr-review` then runs again, reading only
what the follow-up added.

What the session channel carries is the handback instruction and the worker's
reply to it, which is a notification layer over a record that stays on the PR. A
reply that changes an outcome, such as a worker naming the plan question that
already declined a finding, still belongs back on the PR, since the session
holding it ends and the thread is what a later reader opens.

Two rules put it there rather than leaving that to whoever remembers. A finding
the worker declines carries the fact that settled it in the same reply body that
already maps every finding, and a pass accepting that argument states the
withdrawal or the regrade with what produced it instead of dropping the finding
from its next comment. Both fire on a line the body already writes, so neither
asks a session to judge mid-reply whether its own message mattered.

A reply that corrects the reviewing session rather than a finding stays off the
thread. Which session holds which branch, or what gate a worker's edits pass
through, changes no finding on a pull request that closes, so it goes to the task
owning that surface. Nothing checks either rule, so both hold while a session
applies them.

A finding answered without a commit leaves the head where the first pass read it,
which a gitignored record and a finding accepted as recorded both produce. The
close-out is still owed there, since the newest heading is what tells an operator
whether the branch is blocked, so the pass reads the worker's response rather than
a delta and names its body from that response instead of from a tree that did not
change.

A branch that stopped merging while the review was open is the worker's problem
to close. `claude-address-review` rebases onto `origin/main` between the fixes
and the push, so one force-push carries both and the reviewer reads one delta.
The staleness test sits ahead of the no-findings guard, so a branch whose review
closed clean and then went stale still rebases when the skill is invoked. The
re-read costs a full pass rather than a delta, since the prior reviewed commit no
longer reaches the head, and `claude-pr-review` detects that itself.

The heading carries the state rather than the pass number. A pass carrying a
critical or a should-fix takes `## Review` and every other pass takes
`## Review closed`, so a thread can be scanned for what still blocks a merge
without opening a comment. The heading and the dispatch answer two questions
rather than one: a minors-only pass closes the heading and still sends a worker,
so the dispatch reads the counts on the summary line rather than the heading
above them. A minor the worker declines goes to the findings of the task the
branch closes, since a thread does not survive the merge. The feedback
becomes a durable artifact both sessions read, survives a session ending, and
anchors to the change. That removes the copy-paste that otherwise routes review
through the human between two sessions.

## Feature sizing

The unit is fixed by the ceremony: one feature is one plan, one worktree, one
PR, one review sitting. Split a feature down when a backend contract and its
consumer both change, landing the contract first so no UI is built on a shaky
contract. Merge a change up into an ordinary edit when it is a few lines with no
new contract, skipping the plan and worktree entirely. The smell test: if the
whole change does not fit in your head at review time it was too big, and if the
coordination costs more than the change it was too small.

## Where work comes from

Three tiers hold work at different altitudes.

- Roadmap (`.claude/ROADMAP.md`): versions as themes, sequenced. Committed, low churn. Shape governed by `standards/bundled/roadmap.md`.
- Tasks (`.claude/tasks/`): the active few pulled into the current turn, one file each. Gitignored, high churn. Shape governed by `standards/tasks.md`.
- Edits: a few lines, done immediately with no ceremony.

Pre-MVP the roadmap is the backlog, because the scope is finite and known.
Post-MVP the backlog moves to tracked issues, per item, and the roadmap thins to
occasional theme-setting.

## Parallelism

The binding constraint is the human and the shared files, not the roadmap. Cap
at two or three worker tracks and split them across the stack so they do not
collide on the same files.

Unit checks run freely in many worktrees at once.
A dev server, an end-to-end run, and a screenshot run alongside each other on a
web stack, since every worktree derives its own port. Singleton resources (one
local model server, one GPU) still serialize, as does any port a stack fixes by
hand. See
[Claude Code and git worktrees](../wiki/claude/claude-worktrees.md) for merge order and the
port-collision detail.

## Related

- [Claude Code and git worktrees](../wiki/claude/claude-worktrees.md) for the isolation and fan-out mechanics
- [Claude Code subagents](../wiki/claude/claude-subagents.md) for in-session parallelism without worktrees
- `.claude/context/claude-plugin/skill-strategy.md` for how the skills in the loop are categorized
