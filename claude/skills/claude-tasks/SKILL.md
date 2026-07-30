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

Write it immediately. Claude Code's tool permission dialog is the confirmation gate. Do not pause for approval.

### Step 4: report unlinked origins

Scan for work that has been decided and would otherwise be forgotten. List `.claude/.tmp/groundwork/` and run `gh issue list --state open` when a remote is configured, then grep the board for each track name and issue number. Report any with no task, one line each.

Report rather than prompt. A track can be opened long after its task would have been written, so an offer to create one for each is noise on most runs.

## Archive

### Step 1: check the outcomes

Read the task file. Every outcome should be `[x]`. When one is unchecked, name it and ask before continuing. An outcome deliberately left open is a real case, and `claude-docs` marks outcomes from the diff rather than from the conversation, so an unchecked box may only mean nothing has run yet.

### Step 2: count the citations on the plan

Parse the `Plan:` line and route on where it points.

- No `Plan:` line, or the path is already inside `.claude/.tmp/plans-archive/`: continue to Step 3.
- Path still inside `.claude/plans/`: stop. `❌ Plan not yet swept. Run /claude-docs first, then archive.`

The guard enforces an ordering rather than a preference. `claude-docs` Step 8 sweeps plans by scanning `.claude/tasks/*.md`, so it can only reach a task that is still in the folder. Archiving the task first puts it beyond that scan permanently, leaving the plan in `.claude/plans/` with no live task citing it and an archived task pointing at a path nothing will ever retarget. Both folders are gitignored, so nothing recovers the pointer afterward.

Stopping also covers the plan another live task still cites, since `claude-docs` leaves that plan in place until the last citation closes. The guard fires on the path alone, so no citation count is needed here.

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
