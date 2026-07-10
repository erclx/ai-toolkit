---
name: claude-orchestrate
description: Asserts the orchestrator role for the current session and holds the build loop, dispatching to the roadmap, feature, review, and worktree skills. Use when asked to "be the orchestrator", "run the orchestrator", "orchestrate this project", or to set up the control session for parallel feature builds. Do NOT build features or merge PRs in this session.
disable-model-invocation: true
---

# Claude orchestrate

This session is the orchestrator: the one warm session that holds the
cross-feature picture. It plans and reviews. It does not build, and it does not
merge. Building happens in cold worker sessions the human launches. Merging is
the human's gate.

This skill is framing and dispatch only. It holds no logic of its own. Each step
in the loop below is an existing skill.

## On invocation

Read the board in parallel, resolving the paths at the main worktree root per Worktrees in `CLAUDE.md`:

- `.claude/ROADMAP.md`: the active version and what it groups
- `.claude/TASKS.md`: what is queued
- `.claude/plans/*.md`: features already planned and ready to hand off
- open PRs via `gh pr list --json number,title,headRefName,isDraft`

Then output the state of play so the human knows what to launch, review, and merge.

## Output

```plaintext
Orchestrator ready. Active: vX.Y, <the Now row's outcome>.

Ready to build (hand each to its own worker):
- <feature>, plan .claude/plans/feature-<slug>.md → /claude-worktree then /claude-autoship
- <feature>, no plan yet → /claude-feature here first

In review (your turn):
- PR #<n> <title> → /claude-pr-review

Merge order: #<a> before #<b> (shared seam: <files>).

Next: <the single most useful action>
```

Omit any section with nothing in it. Cap the ready-to-build handoffs you recommend at the parallelism ceiling below.

## The loop

1. Own the roadmap. Run `claude-roadmap` to draft or resequence `.claude/ROADMAP.md` from `.claude/REQUIREMENTS.md`. Capture a needed resequence in the plan or TASKS for a worker to apply in its branch, so the tracked edit ships in a PR rather than dirtying main.
2. Plan the next feature. Run `claude-feature` here, with the cross-feature context, to write a plan to `.claude/plans/`. Planning stays in this warm session so the plan front-loads reasoning a cold worker would otherwise re-derive.
3. Decide parallelism and merge order. Note which plans touch a shared wiring seam so their PRs merge in sequence, not at once.
4. Hand off. The human opens a worker worktree with `claude-worktree` and runs `claude-autoship` against the plan. The orchestrator does not spawn workers.
5. Review the PR. When a worker opens a PR, run `claude-pr-review` to post findings to it. This is the deep, independent pass. The worker's autoship self-review was only the green gate.
6. Close the loop. After the worker runs `claude-address-review`, re-review if needed, then the human merges. Tell the trailing worker to rebase when its branch shares a seam with the merged one.

## Boundaries

- Do not implement features in this session. Hand the plan to a worker.
- Do not merge. Recommend merge or changes. The human merges.
- Do not spawn worker sessions with agents. The human launches each worktree so every build is an independent, steerable stream with its own PR.
- Do not leave tracked board edits uncommitted in the main worktree. A `.claude/ROADMAP.md` resequence folds into the next worker's branch so it ships in that feature's PR. When no worker is in flight, commit it as a standalone docs commit.

## Parallelism

Cap at two or three worker tracks. Split them across the stack so they do not
collide on shared files. Serialize any track that touches a shared wiring seam
with another in flight. See `wiki/operating-model.md` for the full model and
`wiki/claude-worktrees.md` for the merge-order and port-collision mechanics.
