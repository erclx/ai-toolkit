---
name: claude-docs
description: Updates `.claude/` planning docs to reflect decisions made during the session, marks outcomes the diff shipped `[x]`, and archives the plans those tasks cite. Use when design or requirements changed mid-cycle, after discussing a pivot, or before shipping. Do NOT use to create a task file or move one out of the live folder. That is `claude-tasks`.
---

# Claude docs

## Guards

- If no `.claude/` directory exists, stop: `❌ No .claude/ directory found. Run aitk claude init to set up the workflow.`

The skip for a session that changed nothing lives at the end of Step 2, because it needs the diff to decide. It drops the doc rewrite alone. The diff-driven sweeps in Steps 4, 5, and 6 still run.

## Diff baseline

Steps 2, 4, 5, 6, and 8 share one diff on the usable path. An unusable baseline splits them, per the rule below. Resolve the base ref once and reuse it:

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

**Steps 4, 5, 6, and 8 keep the scoped set.** Run them on the working tree and untracked files alone, and skip only when that set comes out empty, each reporting the warning its own step names.

Never substitute the whole tree for a missing baseline, and do not reuse Step 2's commit read in these four for consistency. On a fresh `git init` project the last commit is the scaffold commit, so `git log -p -1` is the whole tree by another route. Step 2 tolerates that because it only reads, and it matches conservatively against outcomes already on the board. Steps 4, 5, and 8 write, so the same set stubs a wireframe for every uncovered surface in the repository, stubs a diagram for every source signal the scaffold introduced, and rewrites every context entry that tree touches.

Step 6 only reports, and the whole tree costs it a different way. Every anchored decision cites a path the scaffold commit carries, so the sweep flags the entire record and the reader learns nothing about which number moved.

Widening what a step reads is safe. Widening what a step writes is not, and widening what a step flags spends the reader's attention on entries nothing put in doubt.

## Step 1: read current docs

Read these in parallel from the current worktree root (`pwd`), not the main worktree root. These are tracked files and edits must commit with the branch. Skip any that do not exist:

- `.claude/REQUIREMENTS.md`
- `.claude/ARCHITECTURE.md`
- `.claude/DESIGN.md`
- `.claude/wireframes/index.md` and every `.claude/wireframes/<surface>.md`

Read the task board from the main worktree root instead, per Worktrees in `CLAUDE.md`. It is gitignored scratch and never commits with the branch:

- `.claude/tasks/index.md` first, then the task files this session touched. That narrow read serves the marking step. Step 9 reads every file in the folder for its plans sweep and states that where it gives the instruction.

## Step 2: identify what changed

Two sources feed this step. The session carries judgments no diff can show. The diff carries facts about the repository the session may never have mentioned.

Review the session for decisions that diverged from the original plan:

- Requirements added, removed, or changed scope
- Architecture or technical decisions made or revised
- Design or UX decisions that differ from DESIGN.md or any `.claude/wireframes/<surface>.md`
- Tasks blocked or newly identified

Then resolve the diff baseline and match it against the board. From `.claude/tasks/index.md` at the main worktree root, pick the task files whose title or description relates to the changed paths and read the ones Step 1 skipped.

Path matching only chooses which files to open. Behavior decides each outcome. For each unchecked outcome, decide whether the diff shipped the behavior that outcome names.

Completion is the one judgment here that is a fact about the repository rather than a fact about the conversation, so the diff decides it and the session does not. Requirements, architecture, and design stay session-sourced.

Keep the match conservative:

- Mark only outcomes already written on the board. Never infer a new task from the diff.
- Match on the behavior an outcome describes, not on filenames or commit subjects. The path match above only narrowed which task files to open.
- Leave an outcome `[ ]` when the diff is ambiguous. An unmarked shipped outcome costs one manual edit, while a wrongly marked one hides work that never happened.

Skip Step 3 when the session shows no divergence **and** the diff matches no queued outcome, reporting `✅ No doc updates needed. Session matched the original plan.` Both conditions have to hold. Shipping a queued task exactly as planned is the ordinary case and it reads as no divergence, so a session-only skip would drop the marking step with it.

Then run Steps 4 through 9. Step 3 is the only one this skips, because it is the only one driven by the session rather than by the diff or the board. A project with an empty task board making a mechanical change satisfies both conditions above, and stopping here would put an uncovered surface and an uncovered diagram kind out of reach in every such project.

The steps that follow reach past the session, so each earns the reach separately:

- Steps 4 and 5 stub against the diff. These are why the skip is not a stop. A session that changed no docs is exactly when an uncovered surface or diagram kind goes unnoticed.
- Step 6 reads the architecture record against the diff. A run that amended no decision is the one where an anchored number moves under a reasoning nobody reread, which is the case the marker exists to surface.
- Step 8 rewrites context entries against the diff and against the facts `claude-memory-capture` routed. The Diff baseline section above groups its diff half with Steps 4 and 5 as a scoped-set step, so a quiet session is no different from any other for it. The routed half reads a named file and runs whatever the diff shows.
- Step 9 reads the board rather than the session. Its board-wide scan exists to clear a plan an earlier run stranded, and a run that stops at Step 2 can never reach one.

This changes which steps the skill reaches. It does not widen what any of them reads. Steps 4, 5, 6, and 8 still take the same scoped set the Diff baseline section defines, and that section's rule is about the input a step is handed rather than about which steps run.

## Step 3: update

For each doc with relevant changes, apply updates following these rules. Read a standard this skill names, here or in a later step, from `${CLAUDE_SKILL_DIR}/../../standards/` when the project does not have it.

**`.claude/tasks/`**

- Mark completed outcomes `[x]` in the task's own file through `aitk tasks outcome <stem> --close <n> --json`, repeating `--close` for each. Positions count every outcome checkbox in file order from 1, which the read above already gives. Do not move or archive the file.
- Write a newly identified task as its own file, following `.claude/standards/tasks.md` for the filename and frontmatter.
- Do not touch task files this session did not change.
- Never hand-edit `.claude/tasks/index.md`. A hook regenerates it.

The verb resolves the board at the main worktree root in-process, which is the route because this is an edit inside an existing file and the file-editing tools refuse that path from a linked worktree.

**REQUIREMENTS.md, ARCHITECTURE.md, DESIGN.md, `.claude/wireframes/<surface>.md`**

- Update only the sections affected by session decisions.
- Do not rewrite sections unrelated to what changed.
- Follow `.claude/standards/prose.md` and `.claude/standards/markdown.md` for all edits.
- Close a decision entry in `.claude/ARCHITECTURE.md` with its verification anchor whenever this run writes that entry or amends its reasoning and that reasoning cites a measured number. Re-read the number against the tree first, since the marker records the read rather than the edit. `.claude/standards/architecture.md` fixes the sentence.
- Leave every decision entry this run did not write alone, anchored or not. The rule is scoped forward, so an entry written before it is dated by blame rather than by a read. Step 6 reports a stale anchor and no step writes one on an entry it did not amend.

Write each updated file immediately. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

## Step 4: wireframe coverage sweep

Skip this step silently when `.claude/wireframes/` does not exist or has no surface files. When the baseline is unusable, scope it to the working tree and untracked files, and skip it only when that set is empty, reporting `⚠ No diff to scope against. Skipped the wireframe sweep.`

Reuse the diff from the baseline above and filter for UI-affecting paths. UI-affecting paths are framework-dependent. Default heuristic: any file under a `components/`, `features/`, `pages/`, `app/`, `routes/`, or `screens/` folder, plus any `*.tsx`, `*.jsx`, `*.vue`, or `*.svelte` file anywhere in the diff.

Skip silently when the filter leaves nothing, which is every branch touching no UI. Otherwise read `${CLAUDE_SKILL_DIR}/references/wireframe-sweep.md` for the slug derivation, the two findings it reports, the stub it writes, and the output lines.

## Step 5: diagram staleness sweep

Skip this step silently when `.claude/diagrams/` does not exist at `pwd` or holds no entry. An entry is any `*.md` other than `index.md`, so a folder carrying the catalog alone is an empty set. A project that has never run `claude-diagram` is not told on every ship that it has holes. When the baseline is unusable, scope the sweep to the working tree and untracked files, and skip it only when that set is empty, reporting `⚠ No diff to scope against. Skipped the diagram sweep.`

This step writes frontmatter and never content. Mermaid bodies and explanation paragraphs are off limits to it. A change that removes a module does not carry the new correct shape of the picture, so rewriting a diagram from it produces a confident wrong diagram, which is worse than the stale one it replaced. The author redraws by running `claude-diagram`.

Follow `.claude/standards/diagrams.md` for the marker fields this step writes, or `${CLAUDE_SKILL_DIR}/../../standards/diagrams.md` when the project does not have it.

Both findings key on something literally entering or leaving the tree. Anything looser fires on ordinary feature work and rebuilds the ignored warning this sweep replaced.

Past the skip above, read `${CLAUDE_SKILL_DIR}/references/diagram-sweep.md` for the two findings, the signal table deciding an uncovered kind, the stub it writes, and the output lines. Both tests need the cited paths and the signal list that file carries, so the folder check is the only one the body can settle on its own.

## Step 6: architecture anchor sweep

Skip this step silently when `.claude/ARCHITECTURE.md` does not exist at `pwd` or carries no decision entry with a verification anchor. A record written before the rule holds none, and a project is not told on every ship that nothing has been checked when the standard calls that state correct. When the baseline is unusable, scope the sweep to the working tree and untracked files, and skip it only when that set is empty, reporting `⚠ No diff to scope against. Skipped the anchor sweep.`

This step reports and never writes. The record carries no frontmatter, so an anchor is a sentence sharing a paragraph with the claim it marks, and a pass editing prose to mark prose has no structural guard against editing the claim beside it. The diagram sweep gets that separation from YAML and this one cannot.

Step 3 holds the writer, and the two never meet. Anchoring fires when this run amends a decision, and this sweep fires when the diff moves a path under one, so a single step covering both would gate the anchor obligation on a signal that has nothing to do with it.

Follow `.claude/standards/architecture.md` for the anchor sentence this step matches on.

Past the skip above, read `${CLAUDE_SKILL_DIR}/references/anchor-sweep.md` for how an entry's cited paths are collected, the finding the diff fires, and the report line.

## Step 7: flag CLAUDE.md drift

If this session established or changed a cross-cutting behavior rule that belongs in root `CLAUDE.md` (a new always-on convention, a revised workflow rule), surface a one-line warning:

`⚠ CLAUDE.md may need a rule from this session. Review and edit by hand.`

Do not edit `CLAUDE.md` inline. Every `CLAUDE.md` change goes through the show-diff-and-approve gate, so this step only flags. Skip silently when the session made no cross-cutting behavior decision.

## Step 8: refresh context entries

Read `.claude/context/index.md` at `pwd` to see which domain entries exist. Skip this step silently if the directory does not exist or has no entries.

Two sources feed this step, the same split Step 2 runs on. The diff carries what the repository changed. The routed facts carry what the session learned, which a diff cannot show.

**Routed facts.** Derive `<slug>` per `.claude/standards/slug.md`, falling back to `latest` on an empty result, and read `.claude/.tmp/memory-routing/<slug>.md` at the main worktree root. `claude-memory-capture` writes it, one H2 per target entry naming the path, with the fact underneath. Fold each fact into the entry its heading names, then delete the handoff file so a later run does not fold it twice.

This half is not diff-scoped and must not be. A gotcha a session hit while working is exactly the fact the diff never shows, and scoping it to changed files would drop the entries worth keeping. The handoff is a named input rather than a scan, so the reach stays bounded to what capture decided.

Skip this half silently when the file is absent, which is every run where nothing routed.

**The diff.** When the baseline is unusable, scope this half to the working tree and untracked files, and skip it only when that set is empty, reporting `⚠ No diff to scope against. Skipped the context refresh.` The routed half still runs, since it reads a file rather than a diff.

Reuse the diff from the baseline above, names and content both. For each existing `.claude/context/<domain>.md`:

- Map the entry's section headings to the changed files. An entry is relevant when its prose references files, modules, or decisions touched by the diff.
- For each relevant entry, rewrite only the sections affected by the diff. Same pattern as `docs-sync`. Do not touch unrelated sections.
- Write a reference to another entry as the path that entry sits at, rather than as its bare filename. `.claude/standards/context.md` states the form, and a bare name strands the reference once a domain splits into subfolders.

Do not create new entries automatically. New entries are a deliberate decision: the user invokes `claude-docs --new-context <domain>` (future flag) or hand-creates the file following `.claude/standards/context.md`. Auto-creation risks padding `.claude/context/` with low-signal entries.

Write each updated entry immediately. Output one line per file:

`✅ Context: .claude/context/<domain>.md`

Add a line naming the handoff when one was consumed:

`🧹 Folded: .claude/.tmp/memory-routing/<slug>.md`

The base lint-staged config runs `aitk indexes regen` on every committed `*.md`, so `.claude/context/index.md` refreshes automatically on commit. No manual step needed.

## Step 9: sweep consumed scratch

Sweep reviews this session consumed, and sweep plans across the whole board. Resolve all paths at the main worktree root, not the current worktree. See Worktrees in `CLAUDE.md`.

Every move and delete below is a shell operation, so send each as a plain single `Bash` command rather than joining a `mkdir -p` to the `mv` with `&&`, which is refused as compound from a linked worktree. The one edit inside an existing file is the `Plan:` retarget, and no verb covers it: read the task file and write it back whole with a heredoc, which the file-editing tools refuse from a linked worktree and no shell stream editor may do.

**Plans.** Scan every file in `.claude/tasks/`, not only the ones this session touched. For each task file whose outcomes are now all `[x]`, check for a `Plan:` line directly under the title and parse the target.

The line carries a markdown link, so read the target out of the parentheses rather than taking the rest of the line. A task still carrying the older bare-path form parses the same way once the link is absent, so accept both. Resolve the target against `.claude/tasks/` before routing on it, which lands `../plans/x.md` and `.claude/plans/x.md` on the same file.

The bullets below name resolved locations, so an unresolved target falls to the last one and no plan is ever archived. Never delete a plan. `.claude/standards/plan.md` owns the archive destination and why a shipped plan is moved rather than removed.

Board-wide scope is the one place this sweep reaches past Step 3's rule against touching task files the session did not change. A board carrying a task that closed while an earlier run missed its archive is the defect this exists to clear, and skipping those tasks would preserve it. Reaching them is safe because the archive moves the plan and points the task at the new path, so a task from unrelated work ends up with a working pointer rather than a broken one.

Before moving anything, count the other citations. Scan every `.claude/tasks/*.md` file except the one being processed for a `Plan:` line naming the same plan. Compare the resolved target from the parse above, never the raw target string and never the filename alone.

A board carrying one task written `../plans/x.md` and another written `.claude/plans/x.md` cites one plan, and a raw string comparison reads two, counts zero, and archives the file out from under a live task. Comparing filenames swaps that for the opposite error, since a live plan and an archived one share a basename whenever a closed task still points into `.claude/plans-archive/`, and the count then reads a citation that does not exist and archives nothing.

Exclude the closing task explicitly. It sits on the board and cites the plan itself, so a scan that counts it never reaches zero and no plan is ever archived.

A plan can serve more than one task, and archiving on the first task to close strands every other task's pointer at a path that has moved. `.claude/plans/` is gitignored, so that retarget would be the only record and there is nothing to recover it from.

- Target resolves inside `.claude/plans/`, the file exists, and no other task file cites it: create `.claude/plans-archive/`, move the file there under its original name, overwriting any file already sitting at that name. Then rewrite the task file's `Plan:` line to the archive path, so a completed task still leads to the reasoning behind it.
- Target resolves inside `.claude/plans/` and at least one other task file cites it: leave the plan where it is and retarget nothing. Report the shared citation.
- Target resolves inside `.claude/plans-archive/`: skip silently. The plan was archived by an earlier pass and the task file is already correct.
- Any other resolved target outside `.claude/plans/`: warn and skip.

Write the retarget as a markdown link, `Plan: [feature-<slug>](../plans-archive/feature-<slug>.md)`, updating both halves so the text and the target stay in step. This branch is the only writer that produces a `Plan:` line nobody authored by hand, so a retarget that emits a bare path converts every task to the old form as it closes and drifts the board back to two shapes on its own.

**Reviews.** Derive `<slug>` per `.claude/standards/slug.md`, or `${CLAUDE_SKILL_DIR}/../../standards/slug.md` when the project does not have it. Fall back to `latest` on an empty result.

If `.claude/review/review-<slug>.md` exists, delete it. `claude-review` writes with this convention. Do not sweep any other `review-*.md` file.

Do not sweep `ui-checklist-*.md` (pending human verification) or `ux-audit-*.md` (standalone deliverable).

Output one line per file swept:

- `📦 Archived: <path>` for a plan moved into `.claude/plans-archive/`
- `⏭ Kept: <path>, still cited by <task-file>` for a plan another live task shares
- `🧹 Deleted: <path>` for a swept review

If nothing qualifies, skip this step silently.

## After completion

Output one line per file updated:

`✅ Updated: .claude/<filename>`

If no files were updated and nothing was swept, output:

`✅ No changes needed.`

Suppress that line when Step 2 already reported no doc updates. It closes the run on its own, and emitting both leaves a quiet session reporting success twice for one outcome.
