---
title: Orchestrator dispatch runbook
description: The collision check before a self-dispatch, the file-set disjointness gate, the branch and model the launch names, and the loop's stopping condition
---

Run this at loop step 4, for a `## Run now` row whose plan is verified, in place of handing the worktree to a human. The disjointness gate below is where that row's file set is tested against every track in flight.

## Derive the candidate

Resolve `<slug>` from `<plan>`, the row's plan file, the way `claude-worktree` Step 2 resolves a plan-matched name, per `${CLAUDE_SKILL_DIR}/../../standards/slug.md`. Resolve `<type>` off that plan's `## Summary` and `**Files to touch:**` lines, per `${CLAUDE_SKILL_DIR}/../../standards/branch.md`, defaulting to `feat` when the lines settle nothing. The candidate branch is `<type>/<slug>`.

This is the branch the worker takes, not a guess at one it will derive for itself. Carry the exact string into the launch below. Both halves of that derivation have already disagreed in production: one run checked `docs/remaining-skill-verdicts` against a worker that took `docs/skill-verdicts-decide`, and a later one checked `fix/path-form-hook` against a worker that took `feat/path-form-hook`. A check against a branch nobody uses verifies nothing, and a slug mismatch no longer fails the run downstream on its own, since `claude-autoship` now takes `<plan>` directly rather than resolving it from the worker's own branch. The check above is what has to catch a wrong candidate now.

## Check the branch is unclaimed

Run `aitk sessions list --branch <type>/<slug> --json` and read `claimed` off the record.

- `claimed: true`: the row is not free. Report what holds it, `worktree` when it names a path, `sessions` when it carries a row, and `refs` when the branch already exists. Move to the next candidate rather than colliding.
- `claimed: false`, `sessionsReadable: true`, and `refsReadable: true`: proceed to the disjointness gate.
- `claimed: false` with either flag false, or the command refuses, or the record carries no `claimed` key (`reason` reads `no-registry` or `no-repository`): treat the candidate as unverified rather than clear. Report which reading could not be taken and fall back to the human-launch line below. Dispatching on a check that could not be read reproduces the exact collision this exists to prevent.

Reading `claimed` off the record is what keeps this a check rather than a rule a session can talk itself out of. The field is already the composed answer across the worktree listing, the live session roster, and the refs that name the branch, so nothing here re-derives the OR.

`refs` is the reading that catches a shipped row. A branch behind a merged pull request has no worktree and no session, so the check answered clear on one until a worker refused the instruction and named the consequences: a second pull request against a head GitHub already shows merged, a row whose pull-request line points at two numbers, and the `ambiguous` refusal `aitk tasks archive` documents.

What the ref read cannot see is a branch pushed from another machine since the last fetch, because it reads the remote-tracking ref rather than the remote. Nobody has hit that, and a `git ls-remote` per dispatch costs 0.438s against 0.001s, so the gap is recorded rather than closed.

## Hold what this pass already launched

A worker registers with `branch: main` and the main worktree as its `cwd` until `claude-autoship` Step 0 moves it, which took several seconds on both measured runs. Neither the roster nor the refs name the candidate during that window, so a second check inside it reads clear.

Keep the branch of every row this pass has launched and treat a candidate matching one as claimed, without re-running the check. That closes the window for this dispatcher and only for it. A second dispatcher in another session reads git and the roster alone, sees none of this record, and can still take the same row. Say so when reporting, rather than implying the window is shut.

## Check the file sets are disjoint

No count binds this. List the files the candidate's plan touches, from its `**Files to touch:**` lines, against the file set of every track already in flight, read off the Touches column of each row on the board. Dispatch when the sets are disjoint and hold the row otherwise.

The board is not the whole set. A track a person launched by hand carries no row, so that column cannot see it, which is the ordinary shape whenever the operator is launching rather than dispatching. Read `aitk sessions list --json` for the branches in flight, and take the file set of any branch no row names from the plan that branch is building. A candidate cleared against the board alone is cleared against a partial reading.

Take the comparison at the file path rather than at a folder above it. `aitk tasks validate` compares the paths each row wrote, so a collision it reports on a folder means a row's Touches cell claimed that folder rather than the verb widening anything. On 2026-08-28 it called two rows colliding on `src` because one cell named the bare folder while the other wrote `src/markdown/structure.ts`, which this paragraph once misread as the verb comparing path segments too coarsely.

The finding names which row contributed the containing path, and a bare-folder cell reports as a claim of its own beside the findings. Read that output as a candidate list, settle each pair by file, and narrow the cell that over-claimed rather than discounting the collision it caused.

Disjointness is necessary and not sufficient, so hold a candidate whose sets do not touch when a stated reason serializes it, and write the reason on the hold. One row creating a skill and another auditing that catalog and counting it write nothing in common, measured 2026-08-27, and dispatching both still leaves the audit counting a denominator that moves underneath it. Nothing verifies that a reason was written, so the rule holds only while the dispatcher applies it.

What binds past that is review attention rather than a count, and `## Parallelism` in the skill body states it along with the cap an operator can set for a session. No file here carries a number and this runbook does not either.

## Pick the model

A `claude --bg` session inherits the model of whatever launched it rather than reading the machine's configured default. That was measured on 2026-08-27, with `~/.claude/settings.json` set to `sonnet` while both dispatched workers ran `claude-opus-5`. An orchestrator on the larger model therefore spends it on every worker it launches, and the operator who set the default never sees the override.

Name `<model>` on the launch, and pick it against the task rather than copying whatever this session happens to run. Sizing the model to the row is the dispatcher's call, the same call it already makes on the branch. A mechanical row moving files under a written plan is not the row that needs the largest model, and one whose plan carries an open judgment is.

## Dispatch

```bash
claude --bg --model <model> -n "worker-<slug>" "Run /aitk:claude-worktree <type>/<slug>, then /aitk:claude-autoship <plan>. Your controller is the session whose sessionId is <dispatcher-id>. Resolve its current name from that id at the moment you send, and never resolve an addressee by name prefix. Message it when the pull request opens, carrying the number, the branch, the head sha, the CI state, and every point you departed from the plan on, and message it again if you stop on a question."
```

`--bg, --background` starts the session as a background agent and returns immediately, `-n, --name` sets the display name that tells a self-dispatched worker from an operator's own launch in `aitk sessions list`, and `--model` overrides the inheritance the section above measured. Pass `-n` on every dispatch rather than letting the client derive one. A launch that omits it leaves the session named for a fragment of its own identifier, which is both its address on the send channel and the whole of what the operator sees for it in agent view.

The prefix reads `worker-` because that is the role it marks. It read `orchestrator-` until 2026-08-31, and no controlling session ever carried it, so a worker filtering the roster for that string found a sibling or itself on every row. Nothing matches the prefix programmatically, which is what kept the rename down to three strings.

Read `<dispatcher-id>` with `aitk sessions list --self --json` and interpolate the `sessionId` that row carries. Carry the id rather than the name. A name is derived from whatever the session turned out to be doing, and across the 181 records stamping both fields, nine were renamed after launch at a median of 5.4 minutes and a maximum of 509. Three landed more than ten minutes in, which is inside the window a worker announces its pull request in, so a name written into the prompt is aimed at a send that happens after it goes stale.

Where the installed CLI answers `--self` with an unknown option, that flag is newer than the release the target holds. Read the `sessionId` from the record the client writes for this session under its configuration directory, and say which route answered so the reader knows whether the id was read or inferred.

The worktree call comes first and carries the branch as its argument, which is tier 0 of `claude-worktree` Step 2 and the only tier a caller can reach. `claude-autoship` Step 0 then finds the session already in a linked worktree and continues, which is a path it already documents. The autoship call carries `<plan>`, the same file this runbook already read to derive the branch, so its Step 1 takes it as the caller-supplied plan rather than re-deriving one from the slug the worker's branch happens to carry.

Naming the branch in prose instead was tried and closes nothing, because no tier of that ladder reads the prompt. A worker launched onto `main` cannot match tier 1, a board carrying more than one plan puts tier 2 out of reach, and tier 3 tells it to ask a person who is not there. Four workers took the right branch that way, by inference rather than by contract, which is the same judgment both live disagreements came from.

### What the brief may carry

The prompt carries pointers and standing context, and stops there. The branch and the plan stay arguments, because a skill resolves an argument through a documented ladder and reads no prose at all. What the prose reaches is the worker's judgment, so it holds only what a session has to weigh:

- Name the addressee and what it is owed, which the two message clauses above already do.
- Carry standing context this session holds that a cold one cannot derive, such as a constraint settled in conversation that never reached the plan.
- Leave out anything scope-shaped. A file list, a naming convention, or a check to run belongs in the plan, where the review reads it back against the diff.

The last bullet is the one under pressure, since the dispatch that first proved unattended work possible sent a prompt naming the task file, the likely files, the conventions, and the check to run. It shipped in 874 seconds and touched four files its task never named. Scope that arrives as prose is scope nothing verifies afterward.

Report the dispatch as loudly as the human-launch line it replaces: name the branch, the model, the task, and the session name, so a person reading the transcript can follow what fired without watching it happen.

## Fall back to the human

Hand the row to the human-launch line in step 4 instead of dispatching when any of these hold, and name which one: the collision check refused, the row's file set overlaps a track already out, or a stated reason holds the row behind one.

## Stop the loop

Wrapped in `/loop`, re-run the check against `## Run now` on each wake. Stop rather than firing again once the group is empty or every row in it reads `claimed: true`. Report that once, on the wake that finds it, and let the loop end rather than continuing to poll a board nobody is clearing. `orchestrator-poll.md` already carries this reasoning for the review trigger, and it binds a dispatcher the same way.
