# Project

[One-line description]

## Context

- Check `.claude/` state docs (`TASKS.md`, `ARCHITECTURE.md`, `REQUIREMENTS.md`, `DESIGN.md`, `WIREFRAMES.md`, `GOV.md`) for context before making changes, when present. The `claude-feature` skill reads them in parallel when planning a feature.

## Behavior

- When rewriting a section, preserve existing code blocks, tables, and grouped examples unless the user asked to remove them.

## Indexes

- When a folder has an `index.md`, check it before reading individual files in that folder.
- For folders where an agent browses to pick a document, `index.md` is regenerated from each file's frontmatter. Do not hand-edit `index.md`. Code folders and scratch folders do not need one.
- Every `index.md` carries its own frontmatter (`title`, `subtitle`) that the walker preserves. To keep a folder's `index.md` hand-edited, add `auto: false` to its frontmatter.

## Markdown

- When editing any markdown file, follow `standards/prose.md`.

## Key paths

- `src/`: [description]
- `.claude/`: planning docs (requirements, architecture, wireframes, design, tasks)
- `.claude/review/`: gitignored scratch for review and UI-test output, overwritten on each run

## Spelling

- When cspell flags a word, rewrite typos. Add real terms to the appropriate dictionary in `cspell.json`.
- Keep dictionary files sorted alphabetically.

## Snippets

- When a snippet is referenced with `@`, execute its instructions immediately using available session context.

## Tasks

- Only create a task for work that spans multiple sessions or has real dependencies. Handle small edits immediately without a task entry.
- Do not add tasks retroactively for work already completed. Completed work is visible in git.
- When a task needs execution detail beyond `.claude/TASKS.md`, create a plan in `.claude/plans/` and link to it from the task block's intro paragraph. Delete the plan when the task ships.
- Write the plan in the same session as the task block. The session that executes the plan later inherits reasoning context it would otherwise have to re-derive.
- Treat `.claude/TASKS.md` as transactional working state. Revert to `### Nothing queued` before shipping to main. Prefer stashing task-block changes over committing them.

## Memory

- Write all memory files to `.claude/memory/`, not `~/.claude/projects/`.
- Save a feedback memory only when the same mistake happens twice in the session, or when the user explicitly corrects you. First-occurrence slips are noise.
- Keep feedback memories to 3 lines: the rule, a one-line Why, and a one-line How to apply. Capture the pattern, not the recovery narrative.
- Before creating a new memory file, check for an existing one on the same topic. Update rather than duplicate.

## Scratch

- Write temporary files to `.claude/.tmp/<slug>/<file>.md` in the project root. Use a kebab-slug tied to the topic. Never use `/tmp` or a flat `<slug>-<file>.md`.

## Worktrees

- Shared session scratch (`.claude/plans/`, `.claude/review/`, `.claude/memory/`) lives at the main worktree root, not inside a linked worktree. From a linked worktree, resolve these paths against the main root via `git worktree list --porcelain | awk '/^worktree /{print $2; exit}'`. Fall back to `pwd` if not a git repo.
- From a linked worktree, every `Edit` or `Write` to a tracked file (source, docs, `TASKS.md`) must use a path starting with `pwd`. Only untracked scratch (`.claude/plans/`, `.claude/review/`, `.claude/memory/`) resolves to the main worktree root.
