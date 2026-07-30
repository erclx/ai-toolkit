---
name: claude-docs
description: Updates `.claude/` planning docs to reflect decisions made during the session. Use when design or requirements changed mid-cycle, after discussing a pivot, or before shipping when the session diverged from the original plan. Do NOT use for task promotion or archiving. Edit `.claude/tasks/` directly for that.
---

# Claude docs

## Guards

- If no `.claude/` directory exists, stop: `❌ No .claude/ directory found. Run aitk claude init to set up the workflow.`
- If no decisions were made in this session that differ from the original plan, stop: `✅ No doc updates needed. Session matched the original plan.`

## Step 1: read current docs

Read these in parallel from the current worktree root (`pwd`), not the main worktree root. These are tracked files and edits must commit with the branch. Skip any that do not exist:

- `.claude/REQUIREMENTS.md`
- `.claude/ARCHITECTURE.md`
- `.claude/DESIGN.md`
- `.claude/wireframes/index.md` and every `.claude/wireframes/<surface>.md`

Read the task board from the main worktree root instead, per Worktrees in `CLAUDE.md`. It is gitignored scratch and never commits with the branch:

- `.claude/tasks/index.md` first, then only the task files this session touched

## Step 2: identify what changed

Review the session for decisions that diverged from the original plan:

- Requirements added, removed, or changed scope
- Architecture or technical decisions made or revised
- Design or UX decisions that differ from DESIGN.md or any `.claude/wireframes/<surface>.md`
- Tasks completed, blocked, or newly identified

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

Skip this step silently when `.claude/wireframes/` does not exist or has no surface files.

Run `git diff --name-only main` (or `--staged` when staged) and filter for UI-affecting paths. UI-affecting paths are framework-dependent. Default heuristic: any file under a `components/`, `features/`, `pages/`, `app/`, `routes/`, or `screens/` folder, plus any `*.tsx`, `*.jsx`, `*.vue`, or `*.svelte` file anywhere in the diff.

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

Read `.claude/context/index.md` at `pwd` to see which domain entries exist. Skip this step silently if the directory does not exist or has no entries.

Run `git diff --name-only main` (or `--staged` when staged) and `git diff main` (or `--staged`) to scope the diff. For each existing `.claude/context/<domain>.md`:

- Map the entry's section headings to the changed files. An entry is relevant when its prose references files, modules, or decisions touched by the diff.
- For each relevant entry, rewrite only the sections affected by the diff. Same pattern as `docs-sync`. Do not touch unrelated sections.

Do not create new entries automatically. New entries are a deliberate decision: the user invokes `claude-docs --new-context <domain>` (future flag) or hand-creates the file following `.claude/standards/context.md`. Auto-creation risks padding `.claude/context/` with low-signal entries.

Write each updated entry immediately. Output one line per file:

`✅ Context: .claude/context/<domain>.md`

The base lint-staged config runs `aitk indexes regen` on every committed `*.md`, so `.claude/context/index.md` refreshes automatically on commit. No manual step needed.

## Step 8: sweep consumed scratch

Sweep only scratch that was actually consumed this session. Resolve all paths at the main worktree root, not the current worktree. See Worktrees in `CLAUDE.md`.

**Plans.** For each task file marked `[x]` in Step 3, check for a `Plan:` line directly under the title and parse the path. Never delete a plan. `CLAUDE.md` owns why a shipped plan is archived rather than removed.

- Path inside `.claude/plans/` and the file exists: create `.claude/.tmp/plans-archive/`, move the file there under its original name, overwriting any file already sitting at that name. Then rewrite the block's `Plan:` line to the archive path, so a completed block still leads to the reasoning behind it.
- Path already inside `.claude/.tmp/plans-archive/`: skip silently. The plan was archived by an earlier pass and the block is already correct.
- Any other path outside `.claude/plans/`: warn and skip.

**Reviews.** Derive `<slug>` from the current branch name (replace `/` with `-`). If `.claude/review/review-<slug>.md` exists, delete it. `claude-review` writes with this convention. Do not sweep any other `review-*.md` file.

Do not sweep `ui-checklist-*.md` (pending human verification) or `ux-audit-*.md` (standalone deliverable).

Output one line per file swept:

- `📦 Archived: <path>` for a plan moved into `.claude/.tmp/plans-archive/`
- `🧹 Deleted: <path>` for a swept review

If nothing qualifies, skip this step silently.

## After completion

Output one line per file updated:

`✅ Updated: .claude/<filename>`

If no files were updated and nothing was swept, output:

`✅ No changes needed.`
