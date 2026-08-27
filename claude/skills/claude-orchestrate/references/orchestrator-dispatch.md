---
title: Orchestrator dispatch runbook
description: The collision check before a self-dispatch, the worker cap, the launch command, and the loop's stopping condition
---

Run this at loop step 4, for a `## Run now` row whose plan is verified and whose file set has already cleared the Parallelism test against every track in flight, in place of handing the worktree to a human.

## Derive the candidate

Resolve `<slug>` from the row's plan the way `claude-worktree` Step 2 resolves a plan-matched name, per `${CLAUDE_SKILL_DIR}/../../standards/slug.md`. Resolve `<type>` off that plan's `## Summary` and `**Files to touch:**` lines, per `${CLAUDE_SKILL_DIR}/../../standards/branch.md`, defaulting to `feat` when the lines settle nothing. The candidate branch is `<type>/<slug>`.

## Check the branch is unclaimed

Run `aitk sessions list --branch <type>/<slug> --json` and read `claimed` off the record.

- `claimed: true`: the row is not free. Report what holds it, `worktree` when it names a path and `sessions` when it carries a row, and move to the next candidate rather than colliding.
- `claimed: false`: proceed to the cap check.
- The command refuses, or the record carries no `claimed` key (`reason` reads `no-registry` or `no-repository`): treat the candidate as unverified rather than clear. Report the refusal and fall back to the human-launch line below. Dispatching on a check that could not be read reproduces the exact collision this exists to prevent.

Reading `claimed` off the record is what keeps this a check rather than a rule a session can talk itself out of. The field is already the composed answer across the worktree listing and the live session listing, so nothing here re-derives the OR.

## Check the worker cap

Run `aitk sessions list --json` with no `--branch`, then count entries whose `name` starts with `orchestrator-` and whose `repository` matches this run's own (`git rev-parse --path-format=absolute --git-common-dir`). An unscoped listing spans every repository on the machine, so the repository match is what keeps a busy sibling project from binding this one's cap. Every dispatch below names its session that way for exactly this count, so a worker the human launched by hand carries no such name and is never counted against it.

Three already out: report the cap and stop dispatching for this pass, leaving the row ready for the next one. The cap binds the self-dispatch path alone, since the evidence behind it is one task shipped once and the operator's own launches stay uncapped by count.

## Dispatch

```bash
claude --bg -n "orchestrator-<slug>" "/aitk:claude-autoship .claude/tasks/<task-file>.md"
```

`claude-autoship`'s own Step 0 enters the worktree, so this session never does. Confirm the background-session flags against `claude --bg --help` before the first dispatch of a run, since a surface this skill does not pin can gain or lose a flag between releases.

Report the dispatch as loudly as the human-launch line it replaces: name the branch, the task, and the session name, so a person reading the transcript can follow what fired without watching it happen.

## Fall back to the human

Hand the row to the human-launch line in step 4 instead of dispatching when any of these hold, and name which one: the collision check refused, the cap is reached, or the row's file set failed the Parallelism test against something already out.

## Stop the loop

Wrapped in `/loop`, re-run the check against `## Run now` on each wake. Stop rather than firing again once the group is empty or every row in it reads `claimed: true`. Report that once, on the wake that finds it, and let the loop end rather than continuing to poll a board nobody is clearing. `orchestrator-poll.md` already carries this reasoning for the review trigger, and it binds a dispatcher the same way.
