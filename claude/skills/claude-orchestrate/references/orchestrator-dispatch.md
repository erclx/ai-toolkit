---
title: Orchestrator dispatch runbook
description: The collision check before a self-dispatch, the worker cap, the branch and model the launch names, and the loop's stopping condition
---

Run this at loop step 4, for a `## Run now` row whose plan is verified and whose file set has already cleared the Parallelism test against every track in flight, in place of handing the worktree to a human.

## Derive the candidate

Resolve `<slug>` from `<plan>`, the row's plan file, the way `claude-worktree` Step 2 resolves a plan-matched name, per `${CLAUDE_SKILL_DIR}/../../standards/slug.md`. Resolve `<type>` off that plan's `## Summary` and `**Files to touch:**` lines, per `${CLAUDE_SKILL_DIR}/../../standards/branch.md`, defaulting to `feat` when the lines settle nothing. The candidate branch is `<type>/<slug>`.

This is the branch the worker takes, not a guess at one it will derive for itself. Carry the exact string into the launch below. Both halves of that derivation have already disagreed in production: one run checked `docs/remaining-skill-verdicts` against a worker that took `docs/skill-verdicts-decide`, and a later one checked `fix/path-form-hook` against a worker that took `feat/path-form-hook`. A check against a branch nobody uses verifies nothing, and a slug mismatch no longer fails the run downstream on its own, since `claude-autoship` now takes `<plan>` directly rather than resolving it from the worker's own branch. The check above is what has to catch a wrong candidate now.

## Check the branch is unclaimed

Run `aitk sessions list --branch <type>/<slug> --json` and read `claimed` off the record.

- `claimed: true`: the row is not free. Report what holds it, `worktree` when it names a path, `sessions` when it carries a row, and `refs` when the branch already exists. Move to the next candidate rather than colliding.
- `claimed: false`, `sessionsReadable: true`, and `refsReadable: true`: proceed to the cap check.
- `claimed: false` with either flag false, or the command refuses, or the record carries no `claimed` key (`reason` reads `no-registry` or `no-repository`): treat the candidate as unverified rather than clear. Report which reading could not be taken and fall back to the human-launch line below. Dispatching on a check that could not be read reproduces the exact collision this exists to prevent.

Reading `claimed` off the record is what keeps this a check rather than a rule a session can talk itself out of. The field is already the composed answer across the worktree listing, the live session roster, and the refs that name the branch, so nothing here re-derives the OR.

`refs` is the reading that catches a shipped row. A branch behind a merged pull request has no worktree and no session, so the check answered clear on one until a worker refused the instruction and named the consequences: a second pull request against a head GitHub already shows merged, a row whose pull-request line points at two numbers, and the `ambiguous` refusal `aitk tasks archive` documents.

What the ref read cannot see is a branch pushed from another machine since the last fetch, because it reads the remote-tracking ref rather than the remote. Nobody has hit that, and a `git ls-remote` per dispatch costs 0.438s against 0.001s, so the gap is recorded rather than closed.

## Hold what this pass already launched

A worker registers with `branch: main` and the main worktree as its `cwd` until `claude-autoship` Step 0 moves it, which took several seconds on both measured runs. Neither the roster nor the refs name the candidate during that window, so a second check inside it reads clear.

Keep the branch of every row this pass has launched and treat a candidate matching one as claimed, without re-running the check. That closes the window for this dispatcher and only for it. A second dispatcher in another session reads git and the roster alone, sees none of this record, and can still take the same row. Say so when reporting, rather than implying the window is shut.

## Check the worker cap

Run `aitk sessions list --json` with no `--branch`, then count entries whose `name` starts with `orchestrator-` and whose `repository` matches this run's own (`git rev-parse --path-format=absolute --git-common-dir`). An unscoped listing spans every repository on the machine, so the repository match is what keeps a busy sibling project from binding this one's cap. Every dispatch below names its session that way for exactly this count, so a worker the human launched by hand carries no such name and is never counted against it.

Three already out: report the cap and stop dispatching for this pass, leaving the row ready for the next one. The cap binds the self-dispatch path alone, since the evidence behind it is one task shipped once and the operator's own launches stay uncapped by count.

## Pick the model

A `claude --bg` session inherits the model of whatever launched it rather than reading the machine's configured default. That was measured on 2026-08-27, with `~/.claude/settings.json` set to `sonnet` while both dispatched workers ran `claude-opus-5`. An orchestrator on the larger model therefore spends it on every worker it launches, and the operator who set the default never sees the override.

Name `<model>` on the launch, and pick it against the task rather than copying whatever this session happens to run. Sizing the model to the row is the dispatcher's call, the same call it already makes on the branch. A mechanical row moving files under a written plan is not the row that needs the largest model, and one whose plan carries an open judgment is.

## Dispatch

```bash
claude --bg --model <model> -n "orchestrator-<slug>" "Run /aitk:claude-worktree <type>/<slug>, then /aitk:claude-autoship <plan>"
```

`--bg, --background` starts the session as a background agent and returns immediately, `-n, --name` sets the display name `aitk sessions list` reads back for the worker cap, and `--model` overrides the inheritance the section above measured.

The worktree call comes first and carries the branch as its argument, which is tier 0 of `claude-worktree` Step 2 and the only tier a caller can reach. `claude-autoship` Step 0 then finds the session already in a linked worktree and continues, which is a path it already documents. The autoship call carries `<plan>`, the same file this runbook already read to derive the branch, so its Step 1 takes it as the caller-supplied plan rather than re-deriving one from the slug the worker's branch happens to carry.

Naming the branch in prose instead was tried and closes nothing, because no tier of that ladder reads the prompt. A worker launched onto `main` cannot match tier 1, a board carrying more than one plan puts tier 2 out of reach, and tier 3 tells it to ask a person who is not there. Four workers took the right branch that way, by inference rather than by contract, which is the same judgment both live disagreements came from.

Report the dispatch as loudly as the human-launch line it replaces: name the branch, the model, the task, and the session name, so a person reading the transcript can follow what fired without watching it happen.

## Fall back to the human

Hand the row to the human-launch line in step 4 instead of dispatching when any of these hold, and name which one: the collision check refused, the cap is reached, or the row's file set failed the Parallelism test against something already out.

## Stop the loop

Wrapped in `/loop`, re-run the check against `## Run now` on each wake. Stop rather than firing again once the group is empty or every row in it reads `claimed: true`. Report that once, on the wake that finds it, and let the loop end rather than continuing to poll a board nobody is clearing. `orchestrator-poll.md` already carries this reasoning for the review trigger, and it binds a dispatcher the same way.
