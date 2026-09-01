---
title: Tasks
description: Selecting a shipped task by stem or pull request, recording a number and closing an outcome, the refusal reasons, the board and backlog checks validate runs, and why the board root defaults to the main worktree
---

# Tasks

## Archive

`canon tasks archive` moves a shipped task from `.canon/tasks/` into `.canon/tasks/archive/`, drops its row from `priority.md`, and regenerates the board index. The three run as one unit, so the attended and unattended callers cannot archive differently.

Name the task by its filename stem, or by the pull request it carries:

```bash
canon tasks archive v28.1-trigger-escalation
canon tasks archive --pull-request 673 --json
```

| Option               | Behavior                                                     |
| -------------------- | ------------------------------------------------------------ |
| `--pull-request <n>` | Select the task whose `Pull request:` line names this number |
| `--json`             | Emit a machine-readable record on stdout                     |
| `--root <path>`      | Board root, defaulting to the main worktree                  |

Exit codes: `0` archived, `1` refused. Every gate is a refusal rather than a warning, because `.husky/post-merge` calls this with nobody watching. The `reason` field carries which gate fired: `no-board`, `no-match`, `ambiguous`, `no-outcomes`, `open-outcomes`, `plan-unswept`, or `bad-input`.

`plan-unswept` fires on the last task pointing at a live plan, never on every task pointing at one. The gate counts the other live tasks whose `Plan:` line resolves onto the same file, so a plan several tasks share archives its tasks freely and only the final one is held until `claude-docs` sweeps the plan. Reading the folder alone refused all of them, which deadlocked the board against a sweep correctly declining to move a plan another live task cites.

`bad-input` covers a malformed command line, which all three task verbs answer the same way. It is separate from `ambiguous` and `no-match` because those describe the board, and a caller that passed two selectors would otherwise be sent to repair a task citation that is fine.

The row is matched by the link in its first cell rather than by a pattern against the whole line. A row names the task it is about in the first cell, so a link anywhere after it is a reference, such as a blocker naming what it waits on, and matching the line would drop the referring task's row too.

The row removal reaches `priority.md` alone. A task gets to a merge by being planned and handed out, and both steps move it onto the board first, so one archived straight off `backlog.md` leaves its bullet standing and `canon tasks validate` reports that bullet as naming a file that is gone.

The board is shared scratch at the main worktree root, so `--root` defaults to the first entry of `git worktree list` rather than the working directory. A linked worktree archives against the same board every other session reads.

Skills branch on the reason rather than on the exit code:

```bash
canon tasks archive --pull-request 673 --json | jq -r 'if .ok then .task else .reason end'
```

## Plan citations

`canon tasks plan-citations <stem>` answers where a task's plan sits and which other live tasks hold it. It reports and never writes.

| Option          | Effect                                      |
| --------------- | ------------------------------------------- |
| `--json`        | Emit a machine-readable record on stdout    |
| `--root <path>` | Board root, defaulting to the main worktree |

The record carries `location`, one of `unstated`, `live`, `archived`, or `outside`, and `citedBy`, the other live tasks whose `Plan:` line lands on the same file. Exit codes: `0` read, `1` refused with `no-board` or `no-match`.

The target resolves against the board folder and against the project root both, so `../plans/x.md` and `.canon/plans/x.md` land on the same file and one plan two tasks spelled differently counts once. Containment is tested at both record roots rather than at the one this tree resolves at, since a line somebody wrote against a root the tree has since left is still a path into the plans folder, and reading it as outside would report a shipped plan as still live. `docs/agents/records.md` states the read order.

`canon tasks archive` gates on this same answer, so a caller wanting the count reads it here rather than scanning the board. The `claude-docs` plans sweep is the exception and still states the rule in its own body, because a plugin skill reaches a target on merge while the CLI reaches one on release, so a sweep calling a verb the installed `canon` predates gets no record back and archives nothing.

Branch on `reason` rather than on the exit code, which is the rule the archive section above already states and which this verb needs for a second reason. An operator's shell profile may wrap `canon` in a function that runs the binary and then another command and takes the second status, which masks every non-zero exit rather than only an absent verb. The binary exits 1 for an unknown subcommand and 1 for an ordinary refusal alike, so the record is the only signal that survives the wrapper.

A `live` location with an empty `citedBy` is the sweep to run. One whose `citedBy` names a sibling is a plan several tasks share, which the sweep leaves alone and the archive gate lets through.

```bash
canon tasks plan-citations v28.1-trigger-escalation --json | jq -r '.location'
```

## Plan answers

`canon tasks plan-answers <plan>` answers whether a plan is launchable, which is whether it still waits on the operator for a call only they can make. It reports and never writes.

Name the plan by its path or by its slug, which resolve to the same file:

```bash
canon tasks plan-answers dispatch-answer-gate
canon tasks plan-answers .canon/plans/feature-dispatch-answer-gate.md
canon tasks plan-answers ../plans/feature-dispatch-answer-gate.md
```

A relative path resolves against the project root first and against `.canon/tasks/` second. The third form above is what a board row writes, since its link is relative to the board, and a dispatcher copying the reference out of the row it is dispatching has that spelling to hand rather than either of the other two. A refusal names every base it looked under.

`canon tasks plan-citations` reads a task's `Plan:` line against those same two bases in the opposite order, and tests that the target lands under the live plans folder, which this verb does not. Both answer the same file for every spelling a board writes. Liveness is a separate refusal here: a plan resolving inside `.canon/plans/archive/` returns `archived` rather than a launchable reading, since it answers every question and describes work that already shipped.

| Option          | Effect                                      |
| --------------- | ------------------------------------------- |
| `--json`        | Emit a machine-readable record on stdout    |
| `--root <path>` | Board root, defaulting to the main worktree |

The record carries `launchable` and `open`, the questions still waiting, each with the `label` that names it and the `why` its suggestion gave for needing a person. Exit codes: `0` launchable, `1` refused with `no-plan`, `archived`, or `bad-input`, `2` waiting on the operator.

A blank `- Answer:` is not a waiting question. The plan standard fixes an empty slot as accepting the `- Suggested:` line above it, so the one shape this reads is `- Suggested: needs your call, <why>` over an empty slot, which is what that standard writes where the answer turns on preference rather than on a technical default. A verb reading every blank slot as open would report every plan in the folder.

The question block is read through the same parser `canon tasks validate` runs, so the gate and the conformance check cannot drift into disagreeing about what a question is. A question carrying no suggestion at all is that check's finding rather than this one's, and it goes unread here.

Branch on `launchable` rather than on the exit code, for the reason the section above states: a shell profile wrapping `canon` in a function can take a later command's status and mask every non-zero exit, which reads a waiting plan as a launchable one.

The orchestrator dispatch runbook calls this before it checks the branch or the file sets, so a row whose plan still needs a person is handed back rather than launched into a worker that halts on the same question.

```bash
canon tasks plan-answers dispatch-answer-gate --json | jq -r '.launchable'
```

## Pull request

`canon tasks pull-request` records the number a branch's pull request carries onto the task that branch closes. It adds `Pull request: #NNN` under the `Plan:`, `Groundwork:`, `Intake:`, or `Issue:` lines the task already holds, and corrects the number in place when the line exists.

Name the task by its filename stem, or by the plan its `Plan:` line points at:

```bash
canon tasks pull-request 673 v28.1-trigger-escalation
canon tasks pull-request 673 --plan worktree-scratch-routing --json
```

| Option          | Behavior                                           |
| --------------- | -------------------------------------------------- |
| `--plan <slug>` | Select the task whose `Plan:` line names this plan |
| `--json`        | Emit a machine-readable record on stdout           |
| `--root <path>` | Board root, defaulting to the main worktree        |

A plan is matched on the token both spellings share, so `worktree-scratch-routing`, `feature-worktree-scratch-routing`, and `.canon/plans/feature-worktree-scratch-routing.md` all select the same task. The `action` field reports `added`, `corrected`, or `unchanged`, which makes a rerun against the same number safe.

Exit codes: `0` recorded, `1` refused. The `reason` field carries `no-board`, `no-match`, or `ambiguous`. `git-pr` skips silently on those three, because each is a case where a guessed write would archive the wrong task once the branch merges.

A malformed argument refuses as `bad-input` instead, which sits outside that set on purpose. `git-pr` derives the number by slicing whatever `gh pr create` printed, so a non-numeric value is reachable, and folding it into the swallowed set would lose the number with nothing reporting it.

## Outcome

`canon tasks outcome` marks outcomes `[x]` on a task by their position in its outcome list, counting every checkbox in file order from 1.

```bash
canon tasks outcome v28.1-trigger-escalation --close 1 --close 3
canon tasks outcome --plan worktree-scratch-routing --close 2 --json
```

| Option               | Behavior                                           |
| -------------------- | -------------------------------------------------- |
| `--close <position>` | Outcome to mark `[x]`, 1-based, repeatable         |
| `--plan <slug>`      | Select the task whose `Plan:` line names this plan |
| `--json`             | Emit a machine-readable record on stdout           |
| `--root <path>`      | Board root, defaulting to the main worktree        |

An outcome already closed comes back under `alreadyClosed` rather than refusing, so a rerun against the same positions changes nothing. A position past the end of the list refuses as `out-of-range`, since a caller counting wrong should hear about it rather than mark a neighbor.

Positions skip fenced blocks. A checkbox inside a sample a task displays is not an outcome the task claims, and counting one would shift every position after it. `canon tasks archive` reads the list through the same walker, so the two verbs cannot disagree about which checkboxes are outcomes.

Exit codes: `0` closed, `1` refused. The `reason` field adds `no-outcomes`, `out-of-range`, and `bad-input` to the three above.

Both verbs exist because the write is an edit inside a file that already exists. `Edit` and `Write` refuse a main-root path from a linked worktree, and a shell stream editor is banned for in-place edits, so a verb resolving the board root in-process is the only route a skill body has. Creating a whole file needs no verb, because a heredoc through `Bash` writes it safely.

## Validate

`canon tasks validate` reports what each row of `priority.md` claims against what the tree holds. It reads and never writes, because a row is a session's claim about readiness and a validator that repaired one would be asserting the claim it exists to test.

```bash
canon tasks validate
canon tasks validate --json
```

Seven checks run. Plan and Collisions reach one half each of the `## Run now` test the board standard states. Mapping and Grouping test the folder contract and hold for every group, and Shape holds for every group too, ahead of the four. Ordering reaches only the `## Needs a plan` rows, and Blockers reaches every row outside `## Run now`:

| Check      | What it reports                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| Shape      | A row whose cell count disagrees with its table's header, or one stranded behind a table a blank line already closed |
| Plan       | A `## Run now` row whose Plan column carries no link, or one resolving to no file                                    |
| Mapping    | A row or backlog line naming no task file, and a task file neither surface names                                     |
| Grouping   | A task carrying a row in more than one readiness group, or on both surfaces                                          |
| Ordering   | A `## Needs a plan` row whose stated position disagrees with where it actually sits                                  |
| Collisions | Two `## Run now` rows whose Touches columns name a path in common                                                    |
| Blockers   | A parked row whose blocker has stopped holding, or whose cited task resolves nowhere                                 |

Shape runs before any other check reads a row, since a row failing it carries no dependable fields for the rest to check. A blank or prose line closes the table above it, so the walk treats the next pipe line as a fresh header candidate rather than as a continuation. That candidate counts as a header only when the line behind it is a separator carrying the same cell count, and one that fails is `row-untabled`, stranded behind a table that already closed. Cell count still has to match the header on every row that clears that test, and a row whose count disagrees is `row-misshapen`, the shape a dropped pipe or a merged column produces.

Mapping spans two surfaces, because a task sits on `priority.md` when it would plausibly be planned soon and on `backlog.md` otherwise. A task file either surface names is accounted for, a file neither names is `row-missing`, and a file both name is `row-duplicated` for the reason a task in two groups is: it claims two things about itself and only one can hold. One check across both is what lets a task move between them without the move reading as a dropped file.

A backlog line is a bullet carrying a link to a sibling task, since the backlog is a flat unordered list rather than a table. A bullet holding prose is skipped rather than reported, which keeps the file's own intro out of the findings, and the task that bullet meant to name is still reported as reaching neither surface. A project carrying no `backlog.md` reads as an empty backlog rather than a refusal, which leaves the one-to-one mapping this check ran before the second surface existed.

Ordering reads only a `## Needs a plan` row whose `Waiting on` cell states a position at all. That phrase is prose rather than data, searched for anywhere in the cell rather than at its start, since every live row states its position at the end of a sentence rather than at the front. The vocabulary stops at `first` through `twentieth` plus `last`, since a parser strict enough to catch a gap would otherwise flag a row phrased correctly and differently, and bounding it to those words is what keeps a cell reading `Untestable from here` from matching on `from`. A row that does state a position is checked against where it actually sits, and that one comparison catches a gap, a duplicate, and a sequence starting somewhere other than first alike.

The collision check is the one a person cannot run by eye. Paths come from the backticked spans in the Touches column, a span naming no file is dropped, and a directory collides with any file beneath it. A `## Run now` row whose column parses to nothing is reported rather than skipped, since a row stating no file set makes a claim nothing can check.

Where a directory holds the other row's file, the finding names the row that claimed it, reading `both touch src/tasks, which v2.0-second claims as a folder.` The shared strings alone leave an over-broad cell and a genuine overlap identical, which is how a correct report was once read as the verb comparing folders rather than files.

The blocker check re-takes a measurement the board records once and never repeats. Two of the five blocker kinds put a fact on disk: a dependency is settled by the cited task being archived or by its work reaching the trunk, and a collision is settled by nothing under `## Run now` still holding the file the cell cites.

A closed outcome is not the fact the dependency half needs. The ship chain marks outcomes as its first step and opens the pull request several steps later, so a check reading the checkbox reports the row settled while the branch is still in review. A live task therefore settles the row only once it closed every outcome and carries a `Pull request:` line the trunk holds. One that names no pull request, and one whose number no trunk ref could answer for, land in the untested array below rather than being settled or left silent.

The trunk is read as the clone already holds it, `origin/main` first and local `main` behind it, and no run fetches. A validate runs several times a sweep and a fetch per run is a cost this command does not carry, so a clone behind its remote under-reports rather than claiming work landed.

Both halves gate on a citation inside the `Waiting on` cell, never on the columns beside it. The board format gives a collision cell the file held by the running task, so a row whose cell names no file was parked by something else, and testing its Touches column instead reports a cleared collision on a row no collision ever parked while counting that row as re-tested. A cited task is a bare sibling link, the way the Task column spells one, so a pointer into another folder names a plan rather than a task and settles nothing. A cited task carrying no outcome box settles nothing either, since a file the check could not parse is not evidence of a finished one.

A citation resolving in neither the board nor the archive is `blocker-unresolved` rather than a settled row. Reading an absent file as archived states a specific fact about a file nobody ever wrote, which is what a renamed task or a typo produces, and only a task that genuinely closed releases the row waiting on it.

The other three kinds rest on a person's judgment, so a row neither half reached lands in a second array rather than in the findings:

```json
{
  "untested": [
    {
      "group": "Needs a plan",
      "subject": "v50.6-a-standard-no-skill-reads",
      "message": "..."
    }
  ]
}
```

An untested row is not a finding and moves no exit code. Reading a clean findings list as a clean board is the failure the array exists to prevent, and `orchestrator-parked.md` is the pass that takes those rows by hand.

A `## Run now` row whose Touches column names a bare folder lands in a third array on the same reasoning:

```json
{
  "claims": [
    {
      "group": "Run now",
      "subject": "v1.0-first",
      "message": "claims the whole src/tasks folder, so it collides with every row written under it."
    }
  ]
}
```

That claim collides with every row a later session writes under the folder, and it is legitimate whenever the row does rewrite the directory, so the array states the reach and moves no exit code. A measure failing on a cell that is right teaches a reader to skip it. Folder against file is decided by asking the tree for a path that resolves, and by the extension only for a path the row has yet to create, since the name alone reads a file carrying no extension as a folder.

The scan reaches `## Run now` and stops, where the collision check stops. A cell in another group describes work nobody has planned, written as a sentence and rewritten once a plan exists, so a claim read off one reports on prose rather than on a file set. A parked folder claim surfaces when its row is promoted, which is when the cell becomes something a dispatcher can act on.

Exit codes: `0` every check passed, `1` refused, `2` at least one finding. The `reason` field carries which gate refused: `no-board`, `no-ordering`, or `no-groups`. A board grouping under headings of its own trips `no-groups` rather than being read against columns it never declared.

Columns are read from each table's own header rather than by position, so a project whose board differs from this one is reported for what it lacks. The `index`, `priority`, and `backlog` siblings are skipped, along with every pre-compaction handoff, which takes one file per session under a `session-` prefix. None of them is a task, and a handoff counted as one would be reported as a task carrying no row on every session that wrote one.

Skills branch on the findings rather than on the exit code:

```bash
canon tasks validate --json | jq -r '.findings[] | "\(.kind): \(.subject)"'
```

For the board format, the `Pull request:` line, and the archive rules, see `standards/tasks.md`.
