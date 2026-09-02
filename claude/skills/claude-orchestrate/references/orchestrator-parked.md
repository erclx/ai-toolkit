---
title: Orchestrator parked row runbook
description: Re-testing every parked blocker against the current tree, the two triggers that start the pass, and the two ways a re-test goes wrong
---

Re-test every parked row as orchestrator. A blocker cell is a measurement taken the day the row was parked and nothing re-takes it, so a row can wait on a condition that stopped holding weeks earlier with no surface reporting the gap.

Two triggers start this pass. `orchestrator-sweep.md` ends by sending the rows `canon tasks validate` listed as untested here, because a merge changes the tree under every parked row at once rather than under the rows naming it. The other is an idle session: nothing merged, workers are building, no pull request is waiting on a first pass, and the board is not moving.

The two differ in scope rather than in procedure. A merge sends the untested rows, since the validator already re-took the two kinds it can settle. An idle session walks every parked row, because no event narrowed which of them to look at.

Neither trigger is a scheduler. `orchestrator-poll.md` owns the one recurring trigger this skill has, and a second loop firing into a static board is the always-on failure that file already warns about.

The sweep's own question stays distinct from this one. It asks which parked row to promote next, taking the blocker cell as read, and this pass asks whether that cell is still true. A session collapsing them runs whichever it remembers and re-tests nothing.

## Scope

Every row under `## Up next` and `## Needs a plan` in `.canon/tasks/priority.md`. A `## Run now` row carries no blocker by definition, so the pass skips it. Resolve the board and each task file at the main worktree root, the way `claude-worktree` does.

Take the rows in board order and finish one before opening the next. Clearing a row changes what the next row collides with, so a pass that measures every row first and writes afterwards writes against a board it has already invalidated.

## Re-testing a row

The blocker cell states what the row waits on, and each kind is tested differently. `canon tasks validate` already re-takes the first two and reports the rest as untested, so run it first and re-take by hand only what it names.

- Collision with a track in flight: the validator tests the file the cell cites against the Touches column of every `## Run now` row. A track that merged since the row was parked is no longer in flight, whatever the sets still share. A cell naming the file in prose rather than in backticks cites nothing, so write the collision the way the board format spells it and the check picks the row up on the next run.
- A dependency on another task: the validator opens the task a link in the cell names. One whose outcomes are all `[x]`, or one already archived, holds nothing. A cell naming the task in prose resolves to no file, so open it by hand and rewrite the cell as a link.
- A condition about the tree, such as a count of some shape or the presence of a construct: measure it again, per Two ways a re-test goes wrong below.
- Waiting on a plan: nothing external holds the row, so the pass writes the plan rather than testing anything. See The plan half below.
- Waiting on an operator action, such as a run that happens from a shell: record it as untestable this pass and name what the operator has to do. A session cannot clear it, and re-measuring it every pass is waste.

Write the result into the row. A re-test reported in chat is lost at the next compaction and the next pass measures the same thing again. Rewrite a blocker cell whose test no longer holds, move the row to the group its new state puts it in, and record the measurement in that task's `## Findings` with the date it was taken. `### Writing the board` in `claude-orchestrate` owns the method, and `canon tasks validate` runs once the board is rewritten and before the report.

## Two ways a re-test goes wrong

Both return a confident wrong answer rather than an error, which is why each gets a step of its own.

The first is reading the condition looser than the code defines it. A row parked on a count of some shape names a shape its consumer defines precisely, and a count taken by eye or by a pattern that approximates it lands somewhere else. The row that motivated this runbook counted 19 instances of a shape whose real count under the consumer's definition was zero.

Find the code that consumes the shape, read the definition off it, and measure with that. A count taken any other way is not evidence about the blocker.

The second is measuring against the wrong tree. A command that ships to targets is at risk in corpora this repository never formats, so a condition measured here reads as unreachable while it stays live where the command runs. Ask which tree the condition is about before asking what the count is. A local formatter removing the shape on contact says nothing about a target running no such formatter.

## The plan half

Plan what the pass clears, and plan any `## Needs a plan` row whose only blocker is the missing plan. The window is the argument: this pass runs while workers build and the session is otherwise idle, which is when planning costs the critical path nothing, and a row cleared with no plan is a row the next pass looks at again.

Run `claude-feature` for each, carrying the constraint per in-flight track that `## The loop` in `claude-orchestrate` requires. Verify each plan against the tree the way that step does, since a plan written now is written against a tree several branches are already changing.

Stop where `## Parallelism` stops rather than planning every row the pass cleared. A plan whose file set collides with every track in flight is one nobody can dispatch.

Do not restate the refill procedure. `claude-orchestrate` owns it under `## Refilling the ready queue` and `orchestrator-sweep.md` wraps it for a batch of merges, so this pass promotes through that method rather than a second one.

## Two results that are not a re-test

Age is not evidence. A row untouched for weeks invites promotion, and the waiting is not an argument for it. `claude-orchestrate` refuses to promote a task to fill the queue and this pass inherits that refusal, so a row whose blocker still holds stays where it is. Reporting it as still parked, against a measurement taken this pass, is a result.

A scoping defect can wear a blocker. A task whose file set collides with every other task by construction is oversized rather than blocked, and planning it again produces the same plan nobody can dispatch. Split it into tasks with disjoint file sets, so the board stops carrying a row that re-measures the same way every pass.

## Output

```plaintext
Re-tested: <row>, <blocker> → <what the measurement showed>
Cleared: <row>, now <group>, plan at <path>
Still parked: <row>, <blocker> re-confirmed against <what was measured>
Untestable: <row>, waits on <operator action>
Split: <task> into <tasks>, file set collided with everything by construction
```

Omit any row with nothing in it. Name what was measured rather than the verdict alone, since a re-test the reader cannot check is the same claim the row already carried.

Lead the reply with the three slots under `### Every later turn` in `claude-orchestrate`, so the human reads what they own before the evidence for it.
