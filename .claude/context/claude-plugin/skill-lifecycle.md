---
title: Skill lifecycle
description: How a skill is invoked, the split between the two task-board writers, where a session fact is routed, the plans sweep, and the sandbox arm that covers it
---

# Skill lifecycle

## Invocation

Invoke with `/skill-name` or let Claude auto-trigger by matching against the skill description. Skills marked with `disable-model-invocation: true` (`claude-autoship`, `claude-orchestrate`, `create-skill`, `git-ship`, `toolkit-operator`) require explicit invocation and will not auto-trigger. Git skills (`git-commit`, `git-pr`, `git-branch`, `git-stage`) override built-in commit and PR behavior. See `standards/skill.md` for authoring conventions.

A harness hook is the third route and `session-map` is the only skill reached by one. A `PreCompact` hook names it in the reason it blocks a manual compaction with, which `.claude/context/development/hooks.md` covers. What separates that route from the two above is that a skill named by a hook is named in a string nothing validates, so a rename here leaves the hook pointing at a skill that no longer answers and no stage compares the two.

## The task board split

Two skills write to the task board and the split is by operation rather than by file. `claude-tasks` brings a task file into existence and moves a shipped one to `.claude/tasks/archive/`. `claude-docs` edits the contents of a file that already exists, marking outcomes `[x]` from the diff and sweeping the plans those tasks cite. Neither crosses into the other, because two skills relocating the same file drift into relocating it differently.

Creation is the only moment the task-origin invariant is enforceable, so that is where `claude-tasks` enforces it. A task names a plan, a groundwork folder, an intake folder, or an issue, and the skill refuses to write one that names none. The reverse direction is a report rather than a prompt, since a groundwork track can be opened long after its task would have been written, and an offer to create a task for each open track would be noise on most runs.

That set lives in `standards/tasks.md` and is restated in three places, so extending it costs four edits rather than one. `claude-tasks` enumerates which keys take the markdown-link form and which stay a bare number, `git-pr` names the origin lines it anchors `Pull request:` under, and `docs/ai-workflow.md` states the invariant for a consumer. None reads the standard at runtime, so a key added to the standard alone leaves all three narrowing a set they no longer match. The `Intake:` addition reached review with exactly that trio stale behind it, which is where the count comes from.

Archiving a task deliberately does not archive its plan. `claude-docs` owns the plans sweep and already holds the last-live-citation rule, so `claude-tasks` moves nothing. Archiving driven by a merge rather than by a person is a third path, covered in `.claude/context/claude-plugin/skill-archiving.md`.

That split forces an ordering, and `claude-tasks` guards it rather than documenting it. The plans sweep finds its work by scanning `.claude/tasks/*.md`, so it can only reach a task still in the folder. Archiving the task first puts it beyond that scan for good, stranding the plan in `.claude/plans/` with no live task citing it and an archived task pointing at a path nothing will retarget. So the archive verb stops when the `Plan:` line still points inside `.claude/plans/` and sends the caller to `claude-docs` first.

## Where a session fact lands

A fact a session learns is routed by owner rather than filed in one place. `claude-memory-capture` classifies each candidate, and a project fact whose subject names an entry in `.claude/context/index.md` goes to that entry, which the three-tier model already loads on demand. Everything else stays a memory file. The test is a named catalog entry rather than a judgment about fit, so it fails closed to memory when no entry matches or when two do.

Capture never edits a context entry. It appends the fact to `.claude/.tmp/memory-routing/<slug>.md` and `claude-docs` folds it in, which keeps one skill writing those files. The handoff is a file rather than a spoken result so it survives a compaction between the two steps, and so a standalone capture leaves something a later `/claude-docs` consumes.

A routing file written under the `latest` slug collects facts for several domains and several sessions, so the branch consuming it owns only part of what it holds. On 2026-08-20 that file carried a section for `.claude/context/cli/commands.md` that the branch reading it needed and one for `.claude/context/ci.md` that it did not. A fold therefore takes one section at a time and deletes the file once no section is left, since folding it whole pulls an unrelated domain into the diff and deleting it whole discards a fact nobody read.

That ordering is why capture leads the sequence in `git-ship`, which is the one body stating it since `claude-autoship` Step 7 was merged into an invocation of that skill. It ran after the pull request opened until routing shipped, which was invisible while every output was gitignored and would have stranded a context edit outside the branch the moment one existed.

`claude-orchestrate` fires capture from its pre-compact handoff runbook, which reaches it through `session-map` and states the session does not commit so routing is skipped. Both other callers ship and this session never does, so without that step the session taking every operator correction records none. The refill sweep reports the debt instead of paying it, because a capture per batch of merges bills the operator a wait while nothing is being built. What this session produces is feedback about how to work.

An entry leaving the pen is archived to `.claude/.tmp/memory-archive/` rather than deleted, and `.claude/memory/index.md` is generated by a hook rather than appended by hand. That archive kept its place under `.tmp/` when the plan and task archives moved out, because nothing cites a retired memory and the folder exists to undo a bulk judgment call rather than to be read later.

## The plans sweep

Every stop the verb emits has to name a next step that actually moves. The sweep is gated twice, on the citing task's outcomes being all `[x]` and on no other task sharing the plan, and a stop that routes past either gate returns the caller to the same guard unchanged. So the outcome check runs first and refuses to admit an open outcome, and the plan check counts citations only to decide which of two messages to print. A shared plan is the misfile the tasks standard names, resolved by hand rather than by a sweep.

A plan that ships is archived rather than removed. `claude-docs` moves it from `.claude/plans/` to `.claude/plans/archive/` in its scratch sweep, overwriting on a repeated slug, then retargets the task file's `Plan:` line at the new location. Retargeting is what makes the archive worth having, since an archive nothing points at is barely better than a deletion. A task already pointing into the archive is skipped silently, which keeps a second pass idempotent instead of warning on work it did itself.

### Reading the plan citation

The `Plan:` line carries a markdown link relative to `.claude/tasks/`, so both parsers read the target out of the parentheses and both resolve it against that folder before routing on it. Resolving is what lets `../plans/x.md` and the older bare `.claude/plans/x.md` land on the same file, and skipping it would drop every link-form task through to the sweep's final warn-and-skip branch, archiving nothing. The retarget writes a link back for the same reason it reads one: that branch is the only writer producing a `Plan:` line nobody authored, so emitting a bare path would convert the board to the old form one closing task at a time.

The sweep archives only when the closing task is the last live citation of that plan. One plan can serve several tasks, and moving it on the first to close strands every other pointer at a path that no longer resolves. `.claude/plans/` is gitignored, so no history recovers the retarget and the shared plan stays put until the last citation closes.

The count compares the resolved target rather than the raw string, because a board holding one task written `../plans/x.md` and another written `.claude/plans/x.md` cites one plan and a raw comparison reads two, counts zero, and archives the file out from under a live task. Comparing basenames instead trades that for the mirror error, since a live plan and an archived one share a filename whenever a closed task still points into `.claude/plans/archive/`, so the count invents a citation and the plan is never archived.

### What the sweep scans

That sweep scans the whole board rather than the task files the session touched, and the step states the scope in the sentence carrying the instruction rather than as a correction below it. Naming the step by its title rather than its number is what keeps this reading true, since a step inserted above it renumbers everything after. A scope stated as a correction loses to the instruction above it. A step opening with "sweep only scratch that was actually consumed this session" and asserting the opposite for plans four lines later gets read as session-scoped, so a run sweeps its own plan and passes over every task that closed earlier with a plan nothing would move. That is the general lesson and the reason the fix moved words rather than adding a rule.

## The board-sweep sandbox arm

The sandbox arm for this is `board-sweep`, kept separate from `drift`. `drift` asserts a plan archived for the task the prompt names, and `board-sweep` asserts one archived for a task the prompt never mentions. Folding them would leave a single failure ambiguous between the sweep not running and the sweep not reaching past the session.

The arm carries a third task whose outcomes stay open and whose plan must survive the run. Widening a scan and dropping the gate that bounds it fail in opposite directions but look identical in a fixture where every task closes, so the arm needs a case the sweep is required to pass over. Its assertions cover the plan's location and the task's untouched `Plan:` line, since a run that retargeted the pointer anyway would leave the task aimed at an archive path holding no file.

## Merging one skill into another absorbs the body

Merging one skill into another moves the body, not only the description. The survivor gains the absorbed behavior as a state-selected branch and the pointer left at the old name carries `disable-model-invocation: true` so it stops competing for routing. `claude-design-propose` proposed token values for a project with no code while `claude-design-extract` sourced them from code and left a cell blank when nothing anchored it, so absorbing the triggers alone would have routed every greenfield caller to a body returning blanks. Where two bodies disagree rather than duplicate, the survivor branches on project state and never on a flag. Check also whether the absorbed skill's sandbox scenario can rename to the survivor, since the survivor's filename may already be taken.
