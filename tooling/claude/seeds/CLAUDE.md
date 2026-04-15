# Project

[One-line description]

## Before making changes

- Check `.claude/TASKS.md` for current scope and status
- Check `.claude/ARCHITECTURE.md` for decisions already made
- Check `.claude/WIREFRAMES.md` for intended UI layout and behavior
- Check `.claude/DESIGN.md` for tokens, typography, spacing, and component rules
- Check `.claude/REQUIREMENTS.md` for feature scope and non-goals
- Check `.claude/GOV.md` for coding standards before writing or editing any code

## Rules

- When a folder has an `index.md`, check it before reading individual files in that folder.
- For any navigable markdown folder, add an `index.md` listing each file with a one-line description. Exception: scratch folders like `.claude/plans/` and `.claude/review/` where contents change frequently or are gitignored.
- When editing any markdown file, follow `standards/prose.md`.
- When editing any markdown file, read surrounding content first and match its depth, length, and tone

## Key paths

- `src/`: [description]
- `.claude/`: planning docs (requirements, architecture, wireframes, design, tasks)
- `.claude/review/`: gitignored scratch for review and UI-test output, overwritten on each run

## Spelling

- Add unknown words to the appropriate dictionary defined in `cspell.json`
- Keep dictionary files sorted alphabetically

## Snippets

- When a snippet is referenced with `@`, execute its instructions immediately using available session context

## Tasks

- Only create a task for work that spans multiple sessions or has real dependencies. Handle small edits immediately without a task entry.
- Do not add tasks retroactively for work already completed. Completed work is visible in git.
- When a task needs execution detail beyond `.claude/TASKS.md`, create a plan in `.claude/plans/` and link to it from the task block's intro paragraph. Delete the plan when the task ships.

## Memory

- Write all memory files to `.claude/memory/`, not `~/.claude/projects/`
- Follow `standards/prose.md` when writing memory file content
