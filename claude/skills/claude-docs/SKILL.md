---
name: claude-docs
description: Updates `.claude/` planning docs to reflect decisions made during the session, marks outcomes the diff shipped `[x]`, and archives the plans those tasks cite. Use when design or requirements changed mid-cycle, after discussing a pivot, or before shipping. Do NOT use to create a task file or move one out of the live folder. That is `claude-tasks`.
---

# Claude docs

## Guards

- If no `.claude/` directory exists, stop: `❌ No .claude/ directory found. Run aitk claude init to set up the workflow.`

The skip for a session that changed nothing lives at the end of Step 2, because it needs the diff to decide. It drops the doc rewrite alone. The diff-driven sweeps in Steps 4 and 5 still run.

## Diff baseline

Steps 2, 4, 5, and 7 share one diff on the usable path. An unusable baseline splits them, per the rule below. Resolve the base ref once and reuse it:

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

**Steps 4, 5, and 7 keep the scoped set.** Run them on the working tree and untracked files alone, and skip only when that set comes out empty, each reporting the warning its own step names.

Never substitute the whole tree for a missing baseline, and do not reuse Step 2's commit read in these three for consistency. On a fresh `git init` project the last commit is the scaffold commit, so `git log -p -1` is the whole tree by another route. Step 2 tolerates that because it only reads, and it matches conservatively against outcomes already on the board. These three write, so the same set stubs a wireframe for every uncovered surface in the repository, stubs a diagram for every source signal the scaffold introduced, and rewrites every context entry that tree touches.

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

Skip Step 3 when the session shows no divergence **and** the diff matches no queued outcome, reporting `✅ No doc updates needed. Session matched the original plan.` Both conditions have to hold. Shipping a queued task exactly as planned is the ordinary case and it reads as no divergence, so a session-only skip would drop the marking step with it.

Then run Steps 4 through 8. Step 3 is the only one this skips, because it is the only one driven by the session rather than by the diff or the board. A project with an empty task board making a mechanical change satisfies both conditions above, and stopping here would put an uncovered surface and an uncovered diagram kind out of reach in every such project.

Three of the steps that follow write, so each earns the reach separately:

- Steps 4 and 5 stub against the diff. These are why the skip is not a stop. A session that changed no docs is exactly when an uncovered surface or diagram kind goes unnoticed.
- Step 7 rewrites context entries against the diff. The Diff baseline section above already groups it with Steps 4 and 5 as a scoped-set step, so a quiet session is no different from any other for it.
- Step 8 reads the board rather than the session. Its board-wide scan exists to clear a plan an earlier run stranded, and a run that stops at Step 2 can never reach one.

This changes which steps the skill reaches. It does not widen what any of them reads. Steps 4, 5, and 7 still take the same scoped set the Diff baseline section defines, and that section's rule is about the input a write is handed rather than about which writes run.

## Step 3: update

For each doc with relevant changes, apply updates following these rules. Read a standard this skill names, here or in Step 7, from `${CLAUDE_SKILL_DIR}/../../standards/` when the project does not have it.

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

## Step 5: diagram staleness sweep

Skip this step silently when `.claude/diagrams/` does not exist at `pwd` or holds no entry. An entry is any `*.md` other than `index.md`, so a folder carrying the catalog alone is an empty set. A project that has never run `claude-diagram` is not told on every ship that it has holes. When the baseline is unusable, scope the sweep to the working tree and untracked files, and skip it only when that set is empty, reporting `⚠ No diff to scope against. Skipped the diagram sweep.`

This step writes frontmatter and never content. Mermaid bodies and explanation paragraphs are off limits to it. A change that removes a module does not carry the new correct shape of the picture, so rewriting a diagram from it produces a confident wrong diagram, which is worse than the stale one it replaced. The author redraws by running `claude-diagram`.

Follow `.claude/standards/diagrams.md` for the marker fields this step writes, or `${CLAUDE_SKILL_DIR}/../../standards/diagrams.md` when the project does not have it.

Both findings key on something literally entering or leaving the tree. Anything looser fires on ordinary feature work and rebuilds the ignored warning this sweep replaced.

**Contradicted entries.** For each entry, collect the backticked code paths its explanation cites. When a cited path is in the diff as a delete or a rename and no longer exists in the tree, append a `stale` key to that entry's frontmatter naming the path:

```yaml
stale: 'src/gov/install.ts no longer exists'
```

Append that key alone. Never edit `verified`, `title`, `description`, or `category`, and never touch the body. When the entry already carries `stale`, extend the existing line rather than adding a second key.

**Uncovered kinds.** The standard fixes one source signal per kind. Stub a kind when the diff adds its signal file and no entry covers that kind. The trigger is the signal appearing, never a file under it changing, so a branch editing a component folder that `components.md` already covers produces nothing here.

| Signal added by the diff                                                                                           | Kind stubbed when absent |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `.claude/REQUIREMENTS.md`                                                                                          | `system-context.md`      |
| `.claude/ARCHITECTURE.md`                                                                                          | `components.md`          |
| A deploy or infrastructure config (`Dockerfile`, `.github/workflows/*`, `vercel.json`, `fly.toml`, `compose.yaml`) | `deployment.md`          |

Leave `request-flow.md` and `data-pipeline.md` out. Neither has a source signal a diff can point at, so a rule covering them would guess at when they went stale.

Write the stub at `.claude/diagrams/<kind>.md`:

```markdown
---
title: <Kind as title case>
description: 'TODO: name the question this entry settles.'
category: <the category the standard fixes for this kind>
verified: 'TODO: never verified'
---

# <Kind as title case>

TODO: draw this. `<signal path>` entered the tree with no entry covering this kind.

Run `/claude-diagram <kind>` to replace the stub.
```

No mermaid fence. An empty stub is visible debt that reaches review through the branch diff, while a generated diagram nobody rendered is invisible debt that reads as verified. A fence here invites the next session to fill it in without a render.

Output one line per finding:

- `⚠ Diagram stale: .claude/diagrams/<kind>.md cites <path>, which left the tree`
- `📝 Stubbed: .claude/diagrams/<kind>.md`

If the sweep finds nothing, skip silently. An ordinary change that adds no signal and deletes no cited path produces no output at all.

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

**Plans.** Scan every file in `.claude/tasks/`, not only the ones this session touched. For each task file whose outcomes are now all `[x]`, check for a `Plan:` line directly under the title and parse the target. The line carries a markdown link, so read the target out of the parentheses rather than taking the rest of the line. A task still carrying the older bare-path form parses the same way once the link is absent, so accept both. Resolve the target against `.claude/tasks/` before routing on it, which lands `../plans/x.md` and `.claude/plans/x.md` on the same file. The bullets below name resolved locations, so an unresolved target falls to the last one and no plan is ever archived. Never delete a plan. `CLAUDE.md` owns why a shipped plan is archived rather than removed.

Board-wide scope is the one place this sweep reaches past Step 3's rule against touching task files the session did not change. A board carrying a task that closed while an earlier run missed its archive is the defect this exists to clear, and skipping those tasks would preserve it. Reaching them is safe because the archive moves the plan and points the task at the new path, so a task from unrelated work ends up with a working pointer rather than a broken one.

Before moving anything, count the other citations. Scan every `.claude/tasks/*.md` file except the one being processed for a `Plan:` line naming the same plan. Compare the resolved target from the parse above, never the raw target string and never the filename alone. A board carrying one task written `../plans/x.md` and another written `.claude/plans/x.md` cites one plan, and a raw string comparison reads two, counts zero, and archives the file out from under a live task. Comparing filenames swaps that for the opposite error, since a live plan and an archived one share a basename whenever a closed task still points into `.claude/.tmp/plans-archive/`, and the count then reads a citation that does not exist and archives nothing.

Exclude the closing task explicitly. It sits on the board and cites the plan itself, so a scan that counts it never reaches zero and no plan is ever archived.

A plan can serve more than one task, and archiving on the first task to close strands every other task's pointer at a path that has moved. `.claude/plans/` is gitignored, so that retarget would be the only record and there is nothing to recover it from.

- Target resolves inside `.claude/plans/`, the file exists, and no other task file cites it: create `.claude/.tmp/plans-archive/`, move the file there under its original name, overwriting any file already sitting at that name. Then rewrite the task file's `Plan:` line to the archive path, so a completed task still leads to the reasoning behind it.
- Target resolves inside `.claude/plans/` and at least one other task file cites it: leave the plan where it is and retarget nothing. Report the shared citation.
- Target resolves inside `.claude/.tmp/plans-archive/`: skip silently. The plan was archived by an earlier pass and the task file is already correct.
- Any other resolved target outside `.claude/plans/`: warn and skip.

Write the retarget as a markdown link, `Plan: [feature-<slug>](../.tmp/plans-archive/feature-<slug>.md)`, updating both halves so the text and the target stay in step. This branch is the only writer that produces a `Plan:` line nobody authored by hand, so a retarget that emits a bare path converts every task to the old form as it closes and drifts the board back to two shapes on its own.

**Reviews.** Derive `<slug>` per Deriving the branch slug in `.claude/standards/skill.md`, or `${CLAUDE_SKILL_DIR}/../../standards/skill.md` when the project does not have it. Fall back to `latest` on an empty result. If `.claude/review/review-<slug>.md` exists, delete it. `claude-review` writes with this convention. Do not sweep any other `review-*.md` file.

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

Suppress that line when Step 2 already reported no doc updates. It closes the run on its own, and emitting both leaves a quiet session reporting success twice for one outcome.
