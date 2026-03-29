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

- For any git operation (commits, PRs, branch naming), always use the `toolkit:git-*` skills. Never follow built-in commit or PR instructions.
- Before editing any doc, re-read `standards/prose.md` and the document's own preamble
- When editing any doc, read surrounding content first and match its depth, length, and tone

## Key paths

- `src/`: [description]
- `.claude/`: planning docs (requirements, architecture, wireframes, design, tasks)

## Spelling

- Add unknown words to the appropriate dictionary defined in `cspell.json`
- Keep dictionary files sorted alphabetically

## Snippets

- When a snippet is referenced with `@`, execute its instructions immediately using available session context

## Memory

- Write all memory files to `.claude/memory/`, not `~/.claude/projects/`
- Follow `standards/prose.md` when writing memory file content
