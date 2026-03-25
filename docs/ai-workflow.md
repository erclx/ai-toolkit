# AI workflow reference

A concise reference for when to reach for which tool, organized by what you're trying to do.

> **Mental model:** Claude chat for planning. Claude Code for implementation, git, and release. Gemini CLI for review and task management.

## Documents

All planning docs live in `.claude/` at the project root.

```plaintext
.claude/
├── PLANNER.md       ← system prompt for planning sessions
├── REQUIREMENTS.md  ← goals, non-goals, MVP scope
├── ARCHITECTURE.md  ← technical design decisions
├── DESIGN.md        ← visual intent and token decisions (UI projects)
├── WIREFRAMES.md    ← ASCII wireframes; layout, UI copy, and interaction rules (UI projects)
├── TASKS.md         ← persistent task tracker, source of truth
├── REVIEWER.md      ← system prompt for code review
├── IMPLEMENTER.md   ← context prompt for implementation sessions
└── GOV.md           ← governance rules, generated via aitk claude gov
```

Run `aitk claude init` to seed the `.claude/` directory, default prompt templates, and a root `CLAUDE.md` file. Run `aitk gov install` to install rules into `.cursor/rules/`, then run `aitk claude gov` to build `GOV.md`. Regenerate only when rules change.

## Scenarios

### New feature

Run `aitk claude prompt` to build the context payload. Work in Claude chat for planning. It holds context across the whole feature so wireframes, task lists, and decisions stay in the same session.

Switch to Claude Code for implementation. It reads CLAUDE.md automatically and has full file access, no pasting needed.

- Invoke `claude-feature` to scan for code-level conflicts and ambiguities, confirm approach before proceeding
- Implement the feature, then Claude Code runs the commands defined in `CLAUDE.md`, fixes failures, and iterates until all pass
- For UI changes, invoke `toolkit:claude-ui-test` to generate a browser verification checklist before review
- Run `gemini dev:review` in terminal, copy valid findings to Claude Code and fix
- If decisions diverged from the original plan (design pivots, requirement changes), invoke `claude-docs` to update `.claude/` planning docs before shipping
- Invoke `toolkit:git-ship` to sync docs, commit by concern, rename branch, and open PR

### UI polish

Verify the change manually in the browser. Use `claude-ui-test` if you need Claude Code to produce a browser verification checklist for the session. For the fix itself, describe the change in Claude chat or Claude Code directly.

### Quick fix

- Verify failure or isolated bug → continue in Claude Code (it has the implementation context)
- Design or planning conflict → escalate to a new Claude chat session with the relevant plan context
- Fast file edit (TASKS.md, config, renaming) → Claude Code directly, no chat needed

### Review

Run `gemini dev:review` in terminal. Copy valid findings to Claude Code and fix. If nothing is valid, do nothing. For a deeper review with fresh context, invoke `claude-review` in Claude Code. It reads REVIEWER.md and produces a findings report against main.

## Maintenance

Invoke `toolkit:ai-sync` manually when structural changes affect `CLAUDE.md`-relevant content: key paths, commands, skill names, or workflow conventions. It reviews `CLAUDE.md` and `GEMINI.md` against the diff and outputs suggested edits as diff blocks. It does not write. `toolkit:git-ship` prompts you to run it when structural changes are detected in the diff.

## Feedback routing

```plaintext
verify fails  → Claude Code (it has implementation context)
design fails  → new Claude chat session (planning problem)
review finds  → Claude Code (same implementation session)
```

## Snippets

Claude-specific snippets require the `.claude/` workflow to be set up.

| Slug              | When to use                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `claude-feature`  | Before implementation, scan for code-level conflicts               |
| `claude-review`   | After implementation, triggers REVIEWER.md role in Claude Code     |
| `claude-ui-test`  | After implementation, generate manual browser verification steps   |
| `claude-docs`     | When decisions diverged from plan, update `.claude/` planning docs |
| `claude-ux-audit` | Standalone session, UX/UI audit of existing features               |

## Prompt generation

`aitk claude prompt` reads `PLANNER.md` and `IMPLEMENTER.md`, injects governance rules from `.cursor/rules/`, context docs, and `standards/prose.md`, and writes `.tmp/PLANNER.md`, `.tmp/IMPLEMENTER.md`, `.tmp/REVIEWER.md`.

Run `aitk gov sync` first when switching stacks. Run `aitk claude gov` to build `.claude/GOV.md` from installed rules; Claude Code loads this automatically each session. Run `aitk gov build` to generate a standalone rules file at `.cursor/.tmp/rules.md` for pasting directly into any AI chat.

## Gemini CLI commands

See [docs/gemini.md](gemini.md) for the full command reference.
