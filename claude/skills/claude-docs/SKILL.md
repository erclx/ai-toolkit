---
name: claude-docs
description: Updates `.claude/` planning docs to reflect decisions made during the session, marks outcomes the diff shipped `[x]`, and archives the plans those tasks cite. Use when design or requirements changed mid-cycle, after discussing a pivot, or before shipping. Do NOT use to create a task file or move one out of the live folder. That is `claude-tasks`.
---

# Claude docs

## Guards

- If no `.claude/` directory exists, stop: `❌ No .claude/ directory found. Run aitk claude init to set up the workflow.`

The bail on a session that changed nothing lives at the end of Step 2, because it needs the diff to decide.

## Diff baseline

Steps 2, 4, and 7 share one diff on the usable path. An unusable baseline splits them, per the rule below. Resolve the base ref once and reuse it:

```bash
git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main 2>/dev/null
```

Take the union of `git diff --name-only <base> HEAD`, `git diff --name-only HEAD`, and `git ls-files --others --exclude-standard`. Read content with `git diff <base> HEAD` and `git diff HEAD`.

Prefer `origin/main` over local `main`. On `main` itself the local ref resolves to HEAD, so every committed change drops out of the set and the skill goes blind to the work it is meant to read.

The baseline is unusable in two cases:

- No merge base resolves against either ref.
- The base came from local `main` and equals HEAD. Nothing is pushed to compare against, so a narrow read reports no changes rather than admitting it cannot see them.

An unusable baseline costs only the committed half. `git diff <base> HEAD` is empty by definition once the base equals HEAD, while `git diff HEAD` and `git ls-files --others --exclude-standard` still report uncommitted and untracked work at correct scope.

**Step 2 recovers the committed half.** Read `git log -p -1`, widening to `git log -p -<n>` when the session spans several commits, and read the candidate task files against the working tree. That yields names and content both, which is what lets Step 2 decide on behavior rather than on filenames. A fresh `git init` on `main` with no remote is the ordinary shape of a scaffolded project, so this path carries the evidence rather than covering an edge case.

**Steps 4 and 7 keep the scoped set.** Run them on the working tree and untracked files alone, and skip only when that set comes out empty, each reporting the warning its own step names.

Never substitute the whole tree for a missing baseline, and do not reuse Step 2's commit read in these two for consistency. On a fresh `git init` project the last commit is the scaffold commit, so `git log -p -1` is the whole tree by another route. Step 2 tolerates that because it only reads, and it matches conservatively against outcomes already on the board. These two write, so the same set stubs a wireframe for every uncovered surface in the repository and rewrites every context entry that tree touches.

Widening what a step reads is safe. Widening what a step writes is not.

## Step 1: read current docs

Read these in parallel from the current worktree root (`pwd`), not the main worktree root. These are tracked files and edits must commit with the branch. Skip any that do not exist:

- `.claude/REQUIREMENTS.md`
- `.claude/ARCHITECTURE.md`
- `.claude/DESIGN.md`
- `.claude/wireframes/index.md` and every `.claude/wireframes/<surface>.md`

Read the task board from the main worktree root instead, per Worktrees in `CLAUDE.md`. It is gitignored scratch and never commits with the branch:

- `.claude/tasks/index.md` first, then the task files this session touched. That narrow read serves the marking step. Step 8 reads every file in the folder for its plans sweep and states that where it gives the instruction.

## Step 2: identify what changed

Two sources feed this step. The session carries judgments no diff can show. The diff carries facts about the repository the session may never have mentioned.

Review the session for decisions that diverged from the original plan:

- Requirements added, removed, or changed scope
- Architecture or technical decisions made or revised
- Design or UX decisions that differ from DESIGN.md or any `.claude/wireframes/<surface>.md`
- Tasks blocked or newly identified

Then resolve the diff baseline and match it against the board. From `.claude/tasks/index.md` at the main worktree root, pick the task files whose title or description relates to the changed paths and read the ones Step 1 skipped. Path matching only chooses which files to open. Behavior decides each outcome. For each unchecked outcome, decide whether the diff shipped the behavior that outcome names. Completion is the one judgment here that is a fact about the repository rather than a fact about the conversation, so the diff decides it and the session does not. Requirements, architecture, and design stay session-sourced.

Keep the match conservative:

- Mark only outcomes already written on the board. Never infer a new task from the diff.
- Match on the behavior an outcome describes, not on filenames or commit subjects. The path match above only narrowed which task files to open.
- Leave an outcome `[ ]` when the diff is ambiguous. An unmarked shipped outcome costs one manual edit, while a wrongly marked one hides work that never happened.

Stop here when the session shows no divergence **and** the diff matches no queued outcome: `✅ No doc updates needed. Session matched the original plan.` Both conditions have to hold. Shipping a queued task exactly as planned is the ordinary case and it reads as no divergence, so a session-only bail would stop the skill before it reaches the marking step.

## Step 3: update

For each doc with relevant changes, apply updates following these rules:

**`.claude/tasks/`**

- Mark completed outcomes `[x]` in place in the task's own file. Do not move or archive the file.
- Write a newly identified task as its own file, following `.claude/standards/tasks.md` for the filename and frontmatter.
- Do not touch task files this session did not change.
- Never hand-edit `.claude/tasks/index.md`. A hook regenerates it.

**REQUIREMENTS.md, ARCHITECTURE.md, DESIGN.md, `.claude/wireframes/<surface>.md`**

- Update only the sections affected by session decisions.
- Do not rewrite sections unrelated to what changed.
- Follow `.claude/standards/prose.md` for all edits.

Write each updated file immediately. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

## Step 4: wireframe coverage sweep

Skip this step silently when `.claude/wireframes/` does not exist or has no surface files. When the baseline is unusable, scope it to the working tree and untracked files, and skip it only when that set is empty, reporting `⚠ No diff to scope against. Skipped the wireframe sweep.`

Reuse the diff from the baseline above and filter for UI-affecting paths. UI-affecting paths are framework-dependent. Default heuristic: any file under a `components/`, `features/`, `pages/`, `app/`, `routes/`, or `screens/` folder, plus any `*.tsx`, `*.jsx`, `*.vue`, or `*.svelte` file anywhere in the diff.

For each UI-affecting path, derive a candidate surface slug from the file's basename and parent folder (e.g. `web/src/features/mock/MockDemoStrip.tsx` → `mock-demo-strip` or `mock`). Cross-reference against the surface files in `.claude/wireframes/`:

- **Contradicted sections:** when a surface file exists for a path in the diff and the diff renames or removes a literal string that appears in the wireframe prose (e.g. provider name, button label, copy string), output a one-line report entry and stop. Do not auto-rewrite prose. Operator resolves.
- **Uncovered surfaces:** when a UI-affecting path has no matching surface file by slug, write `.claude/wireframes/<slug>.md` with this stub:

  ```markdown
  ---
  title: <Slug as title case>
  description: TODO: describe the surface.
  ---

  # <Slug as title case>

  TODO: describe when and where this surface appears.

  ## Behavior

  - TODO
  ```

  Skip the write when the slug would collide with an existing file (different surface, same slug). Surface the collision in the report instead.

Output one line per finding:

- `⚠ Wireframe drift in .claude/wireframes/<surface>.md: <contradicted string>`
- `📝 Stubbed: .claude/wireframes/<surface>.md`
- `⚠ Slug collision: <slug> matches existing <existing-surface>.md, review and rename`

If the sweep finds nothing, skip silently.

## Step 5: flag diagram staleness

If `.claude/DIAGRAMS.md` exists at `pwd` and this session edited any source `claude-diagram` reads (planning docs, deploy or infrastructure config, top-level component folders), surface a one-line warning:

`⚠ DIAGRAMS.md may be stale. Run /claude-diagram`

Do not regenerate inline. The author decides when to re-run the diagram skill. Skip the step silently when `.claude/DIAGRAMS.md` does not exist.

## Step 6: flag CLAUDE.md drift

If this session established or changed a cross-cutting behavior rule that belongs in root `CLAUDE.md` (a new always-on convention, a revised workflow rule), surface a one-line warning:

`⚠ CLAUDE.md may need a rule from this session. Review and edit by hand.`

Do not edit `CLAUDE.md` inline. Every `CLAUDE.md` change goes through the show-diff-and-approve gate, so this step only flags. Skip silently when the session made no cross-cutting behavior decision.

## Step 7: refresh context entries

Read `.claude/context/index.md` at `pwd` to see which domain entries exist. Skip this step silently if the directory does not exist or has no entries. When the baseline is unusable, scope it to the working tree and untracked files, and skip it only when that set is empty, reporting `⚠ No diff to scope against. Skipped the context refresh.`

Reuse the diff from the baseline above, names and content both. For each existing `.claude/context/<domain>.md`:

- Map the entry's section headings to the changed files. An entry is relevant when its prose references files, modules, or decisions touched by the diff.
- For each relevant entry, rewrite only the sections affected by the diff. Same pattern as `docs-sync`. Do not touch unrelated sections.

Do not create new entries automatically. New entries are a deliberate decision: the user invokes `claude-docs --new-context <domain>` (future flag) or hand-creates the file following `.claude/standards/context.md`. Auto-creation risks padding `.claude/context/` with low-signal entries.

Write each updated entry immediately. Output one line per file:

`✅ Context: .claude/context/<domain>.md`

The base lint-staged config runs `aitk indexes regen` on every committed `*.md`, so `.claude/context/index.md` refreshes automatically on commit. No manual step needed.

## Step 8: sweep consumed scratch

Sweep reviews this session consumed, and sweep plans across the whole board. Resolve all paths at the main worktree root, not the current worktree. See Worktrees in `CLAUDE.md`.

**Plans.** Scan every file in `.claude/tasks/`, not only the ones this session touched. For each task file whose outcomes are now all `[x]`, check for a `Plan:` line directly under the title and parse the path. Never delete a plan. `CLAUDE.md` owns why a shipped plan is archived rather than removed.

Board-wide scope is the one place this sweep reaches past Step 3's rule against touching task files the session did not change. A board carrying a task that closed while an earlier run missed its archive is the defect this exists to clear, and skipping those tasks would preserve it. Reaching them is safe because the archive moves the plan and points the task at the new path, so a task from unrelated work ends up with a working pointer rather than a broken one.

Before moving anything, count the other citations. Scan every `.claude/tasks/*.md` file except the one being processed for a `Plan:` line naming the same path. Exclude the closing task explicitly. It sits on the board and cites the plan itself, so a scan that counts it never reaches zero and no plan is ever archived.

A plan can serve more than one task, and archiving on the first task to close strands every other task's pointer at a path that has moved. `.claude/plans/` is gitignored, so that retarget would be the only record and there is nothing to recover it from.

- Path inside `.claude/plans/`, the file exists, and no other task file cites it: create `.claude/.tmp/plans-archive/`, move the file there under its original name, overwriting any file already sitting at that name. Then rewrite the task file's `Plan:` line to the archive path, so a completed task still leads to the reasoning behind it.
- Path inside `.claude/plans/` and at least one other task file cites it: leave the plan where it is and retarget nothing. Report the shared citation.
- Path already inside `.claude/.tmp/plans-archive/`: skip silently. The plan was archived by an earlier pass and the task file is already correct.
- Any other path outside `.claude/plans/`: warn and skip.

**Reviews.** Derive `<slug>` from the current branch name (replace `/` with `-`). If `.claude/review/review-<slug>.md` exists, delete it. `claude-review` writes with this convention. Do not sweep any other `review-*.md` file.

Do not sweep `ui-checklist-*.md` (pending human verification) or `ux-audit-*.md` (standalone deliverable).

Output one line per file swept:

- `📦 Archived: <path>` for a plan moved into `.claude/.tmp/plans-archive/`
- `⏭ Kept: <path>, still cited by <task-file>` for a plan another live task shares
- `🧹 Deleted: <path>` for a swept review

If nothing qualifies, skip this step silently.

## After completion

Output one line per file updated:

`✅ Updated: .claude/<filename>`

If no files were updated and nothing was swept, output:

`✅ No changes needed.`
