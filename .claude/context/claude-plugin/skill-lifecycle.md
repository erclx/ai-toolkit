---
title: Skill lifecycle
description: How a skill is invoked, the split between the two task-board writers, the plans sweep, and the sandbox arm that covers it
---

# Skill lifecycle

## Invocation

Invoke with `/skill-name` or let Claude auto-trigger by matching against the skill description. Skills marked with `disable-model-invocation: true` (`claude-autoship`, `claude-orchestrate`, `create-skill`, `git-ship`, `toolkit-operator`) require explicit invocation and will not auto-trigger. Git skills (`git-commit`, `git-pr`, `git-branch`, `git-stage`) override built-in commit and PR behavior. See `.claude/standards/skill.md` for authoring conventions.

## The task board split

Two skills write to the task board and the split is by operation rather than by file. `claude-tasks` brings a task file into existence and moves a shipped one to `.claude/.tmp/task-archive/`. `claude-docs` edits the contents of a file that already exists, marking outcomes `[x]` from the diff and sweeping the plans those tasks cite. Neither crosses into the other, because two skills relocating the same file drift into relocating it differently.

Creation is the only moment the task-origin invariant is enforceable, so that is where `claude-tasks` enforces it. A task names a plan, a groundwork folder, or an issue, and the skill refuses to write one that names none. The reverse direction is a report rather than a prompt, since a groundwork track can be opened long after its task would have been written, and an offer to create a task for each open track would be noise on most runs.

Archiving a task deliberately does not archive its plan. `claude-docs` owns the plans sweep and already holds the last-live-citation rule, so `claude-tasks` moves nothing. Archiving driven by a merge rather than by a person is a third path, covered in `.claude/context/claude-plugin/skill-archiving.md`.

That split forces an ordering, and `claude-tasks` guards it rather than documenting it. The plans sweep finds its work by scanning `.claude/tasks/*.md`, so it can only reach a task still in the folder. Archiving the task first puts it beyond that scan for good, stranding the plan in `.claude/plans/` with no live task citing it and an archived task pointing at a path nothing will retarget. So the archive verb stops when the `Plan:` line still points inside `.claude/plans/` and sends the caller to `claude-docs` first.

## The plans sweep

Every stop the verb emits has to name a next step that actually moves. The sweep is gated twice, on the citing task's outcomes being all `[x]` and on no other task sharing the plan, and a stop that routes past either gate returns the caller to the same guard unchanged. So the outcome check runs first and refuses to admit an open outcome, and the plan check counts citations only to decide which of two messages to print. A shared plan is the misfile the tasks standard names, resolved by hand rather than by a sweep.

A plan that ships is archived rather than removed. `claude-docs` moves it from `.claude/plans/` to `.claude/.tmp/plans-archive/` in its scratch sweep, overwriting on a repeated slug, then retargets the task file's `Plan:` line at the new location. Retargeting is what makes the archive worth having, since an archive nothing points at is barely better than a deletion. A task already pointing into the archive is skipped silently, which keeps a second pass idempotent instead of warning on work it did itself.

The `Plan:` line carries a markdown link relative to `.claude/tasks/`, so both parsers read the target out of the parentheses and both resolve it against that folder before routing on it. Resolving is what lets `../plans/x.md` and the older bare `.claude/plans/x.md` land on the same file, and skipping it would drop every link-form task through to the sweep's final warn-and-skip branch, archiving nothing. The retarget writes a link back for the same reason it reads one: that branch is the only writer producing a `Plan:` line nobody authored, so emitting a bare path would convert the board to the old form one closing task at a time.

The sweep archives only when the closing task is the last live citation of that plan. One plan can serve several tasks, and moving it on the first to close strands every other pointer at a path that no longer resolves. `.claude/plans/` is gitignored, so no history recovers the retarget and the shared plan stays put until the last citation closes. The count compares the resolved target rather than the raw string, because a board holding one task written `../plans/x.md` and another written `.claude/plans/x.md` cites one plan and a raw comparison reads two, counts zero, and archives the file out from under a live task. Comparing basenames instead trades that for the mirror error, since a live plan and an archived one share a filename whenever a closed task still points into `.claude/.tmp/plans-archive/`, so the count invents a citation and the plan is never archived.

That sweep scans the whole board rather than the task files the session touched, and Step 8 states the scope in the sentence carrying the instruction rather than as a correction below it. A scope stated as a correction loses to the instruction above it. A step opening with "sweep only scratch that was actually consumed this session" and asserting the opposite for plans four lines later gets read as session-scoped, so a run sweeps its own plan and passes over every task that closed earlier with a plan nothing would move. That is the general lesson and the reason the fix moved words rather than adding a rule.

## The board-sweep sandbox arm

The sandbox arm for this is `board-sweep`, kept separate from `drift`. `drift` asserts a plan archived for the task the prompt names, and `board-sweep` asserts one archived for a task the prompt never mentions. Folding them would leave a single failure ambiguous between the sweep not running and the sweep not reaching past the session.

The arm carries a third task whose outcomes stay open and whose plan must survive the run. Widening a scan and dropping the gate that bounds it fail in opposite directions but look identical in a fixture where every task closes, so the arm needs a case the sweep is required to pass over. Its assertions cover the plan's location and the task's untouched `Plan:` line, since a run that retargeted the pointer anyway would leave the task aimed at an archive path holding no file.
