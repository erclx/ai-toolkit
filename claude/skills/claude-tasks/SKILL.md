---
name: claude-tasks
description: Creates a task file in `.claude/tasks/` with the filename, phase label, and frontmatter the standard requires, and archives a shipped one out of the folder. Use when asked to "add a task", "create a task", "queue this", "put this on the board", "archive that task", or "close out a shipped task". Do NOT use to mark an outcome `[x]` or to archive a plan. That is `claude-docs`.
---

# Claude tasks

Owns the two operations that bring a task file into existence and take it out of the folder. `claude-docs` edits the contents of a task that already exists, marking outcomes `[x]` and sweeping the plans those tasks cite. Do not mark outcomes here and do not archive a plan on its own.

Read `.claude/standards/tasks.md` from the project root before writing any file. It holds the filename convention, the frontmatter contract, and the file format. Do not work them from memory.

## Guards

- Resolve the board at the main worktree root, not `pwd`. Run `git worktree list --porcelain | grep -m 1 '^worktree ' | cut -d' ' -f2-`, falling back to `pwd` outside a git repo. Every read and write below resolves against that root. The board is gitignored scratch shared across worktrees, so a linked worktree writing to its own `pwd` creates a second board nothing else reads.
- If `.claude/tasks/` does not exist at that root, stop: `❌ No .claude/tasks/ board. Run aitk claude init to set it up.`
- Route on the request rather than on a flag. Creating names work that does not exist yet, archiving names a task file already on the board. If the request fits neither, stop: `❌ Ambiguous. Say whether to create a task or archive one.`
- Never hand-edit `.claude/tasks/index.md`. A hook regenerates it from sibling frontmatter after a write. Do not run the regen command directly.

## Create

### Step 1: require an origin

Every task traces to a plan, a groundwork folder, or a GitHub issue. Ask for it when the request does not carry one, and stop rather than guessing: `❌ No origin. Name the plan, groundwork folder, or issue this task comes from.`

A task with no origin is either lost context or work nobody decided to do. This is the only moment the invariant is enforceable, because it is the only moment a task file comes into existence.

Accept work whose origin is the conversation itself only when the user says so explicitly, and record what it was in the intro paragraph instead of writing a link line to a file that does not exist.

### Step 2: propose the phase label

List the existing filenames in `.claude/tasks/` and read `index.md` for what each holds. Propose the next label from what is already on the board, and say which neighbors it sits between.

Do not derive the label from a version file. `.claude/standards/versioning.md` permits free renumbering, so the board is the only surface that knows what a label currently means. Pad the phase to two digits in the filename, since index entries sort by filename alone and a bare `v9.0` sorts after `v15.0`.

### Step 3: write the file

Write `.claude/tasks/vXX.Y-<slug>.md` following the format in `.claude/standards/tasks.md`. Include a link line only when the file or folder it names exists. A link to a plan nobody has written yet is the broken pointer the archive rules exist to prevent.

Write `Plan:` and `Groundwork:` as markdown links relative to `.claude/tasks/`, as in `Plan: [feature-<slug>](../plans/feature-<slug>.md)`. Leave `Issue:` a bare `#NNN`. A task written in the older bare-path form still parses, so it costs the board a clickable line rather than an archive, but it leaves the board in two shapes for every reader after.

Write it immediately. Claude Code's tool permission dialog is the confirmation gate. Do not pause for approval.

### Step 4: report unlinked origins

Scan for work that has been decided and would otherwise be forgotten. List `.claude/.tmp/groundwork/` and run `gh issue list --state open` when a remote is configured, then grep the board for each track name and issue number. Report any with no task, one line each.

Report rather than prompt. A track can be opened long after its task would have been written, so an offer to create one for each is noise on most runs.

## Archive

The `post-merge` git hook announces tasks whose outcomes are all `[x]` after a pull, so a request to archive often arrives already naming the file. It prints and moves nothing, so every step below still runs against a board the hook left untouched.

### Step 1: check the outcomes

Read the task file. Continue only when every outcome is `[x]`. When one is unchecked, name it and stop: `❌ <n> outcome(s) still open. Close them or cut them from the task, then archive.`

An unchecked box means one of two things and neither is a reason to archive around it. The outcome shipped and nothing marked it, since `claude-docs` marks from the diff rather than from the conversation, in which case run `claude-docs` and archive after. Or the outcome is genuinely open, in which case the task belongs on the board. A task being abandoned rather than finished is the third case, and it cuts its outcomes first, so the board records what was dropped rather than leaving a reader to infer it from an archived file.

Stopping here is what lets Step 2 route to `claude-docs` and mean it. That sweep only reaches tasks whose outcomes are all `[x]`, so admitting an open outcome past this point would send the caller to a skill that provably declines, and returning from it would fire the same guard again.

### Step 2: check the plan pointer

Parse the `Plan:` line and route on where it points. The line carries a markdown link, so read the target out of the parentheses rather than taking the rest of the line. A task still carrying the older bare-path form parses the same way once the link is absent, so accept both. Resolve the target against `.claude/tasks/` before routing on it, which lands `../plans/x.md` and `.claude/plans/x.md` on the same file.

- No `Plan:` line, or the target resolves inside `.claude/.tmp/plans-archive/`: continue to Step 3.
- Target resolves inside `.claude/plans/` and no other task file cites it: stop. `❌ Plan not yet swept. Run /claude-docs first, then archive.`
- Target resolves inside `.claude/plans/` and another task file cites it: stop, naming that task. `❌ Plan shared with <task>. One plan per task, so resolve the citation before archiving.`

The guard enforces an ordering rather than a preference. `claude-docs` Step 8 sweeps plans by scanning `.claude/tasks/*.md`, so it can only reach a task that is still in the folder. Archiving the task first puts it beyond that scan permanently, leaving the plan in `.claude/plans/` with no live task citing it and an archived task pointing at a path nothing will ever retarget. Both folders are gitignored, so nothing recovers the pointer afterward.

The two stops differ only in where they send the caller, and that is the whole reason to count. `claude-docs` sweeps an unshared plan and declines a shared one, so routing both there would send half the callers to a skill that provably returns without moving anything, and they would come back to the same guard. A shared plan is the misfile `.claude/standards/tasks.md` names, so it is resolved by hand rather than by a sweep.

Do not move a plan from this skill. `claude-docs` Step 8 owns that move and the last-live-citation rule that governs it. Two skills relocating the same file drift into relocating it differently.

### Step 3: move the task file

Create `.claude/.tmp/task-archive/` and move the file there under its own name, overwriting any file already at that name. Never delete a task file. The live index regenerates without it on the next hook run.

Leave `TASK-ARCHIVE.md` alone when it is present. It records the single-file era in the shape that era used, and splitting it would fabricate per-task files nobody wrote.

### Step 4: clear the ordering file

Remove the archived task's row from `.claude/tasks/priority.md` when that file exists, along with any prose paragraph that names it. A shipped task left in the ordering is worse than no ordering, since it reads as ready to hand a worker.

## Output

Emit the full relative path from the project root for every file written or moved. Bare filenames are not clickable.

Create:

```plaintext
✅ Created: .claude/tasks/vXX.Y-<slug>.md

<label> sits between <neighbor> and <neighbor>.

**Origin with no task:**

- `.claude/.tmp/groundwork/<slug>/`: open, touched <date>
- #NNN: <issue title>
```

Omit the origin block when everything is linked.

Archive:

```plaintext
📦 Archived: .claude/.tmp/task-archive/vXX.Y-<slug>.md

<plan disposition in one line>
```
