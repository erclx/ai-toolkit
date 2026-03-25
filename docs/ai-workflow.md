# AI workflow reference

A concise reference for when to reach for which tool, organized by what you're trying to do.

> **Mental model:** Claude chat to seed context at the start of a project and populate `.claude/` docs. Claude Code for everything after: implementation, docs, git, and release. Gemini CLI is available throughout, used as needed rather than at prescribed steps.

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

Work in Claude Code directly. It reads CLAUDE.md automatically and has full file access, no pasting needed.

- Invoke `toolkit:claude-feature` to scan for code-level conflicts and ambiguities, confirm approach before proceeding
- Implement the feature, then Claude Code runs the commands defined in `CLAUDE.md`, fixes failures, and iterates until all pass
- For UI changes, invoke `toolkit:claude-ui-test` to generate a browser verification checklist before review
- Run `gemini dev:review` in terminal, copy valid findings to Claude Code and fix
- If decisions diverged from the original plan (design pivots, requirement changes), invoke `toolkit:claude-docs` to update `.claude/` planning docs before shipping
- Invoke `toolkit:git-ship` to sync docs, commit by concern, rename branch, and open PR

### UI polish

Verify the change manually in the browser. Invoke `toolkit:claude-ui-test` if you need a browser verification checklist for the session. For the fix itself, describe the change in Claude Code directly.

### Quick fix

- Verify failure or isolated bug → continue in Claude Code (it has the implementation context)
- Design or planning conflict → escalate to a new Claude chat session with the relevant plan context
- Fast file edit (TASKS.md, config, renaming) → Claude Code directly, no chat needed

### Review

Run `gemini dev:review` in terminal. Copy valid findings to Claude Code and fix. If nothing is valid, do nothing.

## Skills

| Skill                    | When to use                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `toolkit:claude-feature` | Before implementation, scan for conflicts and ambiguities   |
| `toolkit:claude-docs`    | When decisions diverged from plan, update `.claude/` docs   |
| `toolkit:claude-ui-test` | After UI changes, generate a browser verification checklist |
| `toolkit:ai-sync`        | When structure changes, review `CLAUDE.md` and `GEMINI.md`  |
| `toolkit:git-ship`       | Post-feature: sync docs, commit, rename branch, open PR     |

## Maintenance

Invoke `toolkit:ai-sync` manually when structural changes affect `CLAUDE.md`-relevant content: key paths, commands, skill names, or workflow conventions. It reviews `CLAUDE.md` and `GEMINI.md` against the diff and outputs suggested edits as diff blocks. It does not write. `toolkit:git-ship` prompts you to run it when structural changes are detected in the diff.

## Feedback routing

```plaintext
verify fails  → Claude Code (it has implementation context)
design fails  → new Claude chat session (planning problem)
review finds  → Claude Code (same implementation session)
```

## Snippets

Claude-specific snippets require the `.claude/` workflow to be set up. For the full list, see `docs/snippets.md`.

| Slug              | When to use                                          |
| ----------------- | ---------------------------------------------------- |
| `claude-ux-audit` | Standalone session, UX/UI audit of existing features |
| `claude-tasks`    | Promote complete tasks and archive overflow          |

## Prompt generation

`aitk claude prompt` reads `PLANNER.md` and `IMPLEMENTER.md`, injects governance rules from `.cursor/rules/`, context docs, and `standards/prose.md`, and writes `.tmp/PLANNER.md`, `.tmp/IMPLEMENTER.md`, `.tmp/REVIEWER.md`.

Run `aitk gov sync` first when switching stacks. Run `aitk claude gov` to build `.claude/GOV.md` from installed rules; Claude Code loads this automatically each session. Run `aitk gov build` to generate a standalone rules file at `.cursor/.tmp/rules.md` for pasting directly into any AI chat.

## Gemini CLI commands

See [docs/gemini.md](gemini.md) for the full command reference.
