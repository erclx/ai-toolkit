# AI workflow reference

A concise reference for when to reach for which tool, organized by what you're trying to do.

> **Mental model:** Claude chat for planning. Claude Code for implementation and review. Gemini CLI for deterministic git and release scripts.

## Documents

All planning docs live in `.claude/` at the project root.

```plaintext
.claude/
├── PLANNER.md       ← system prompt for planning sessions
├── REQUIREMENTS.md  ← goals, non-goals, MVP scope
├── ARCHITECTURE.md  ← technical design decisions
├── DESIGN.md        ← color, typography, spacing (UI projects)
├── WIREFRAMES.md    ← ASCII layout sketches (UI projects)
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
- Run `gemini dev:review` in terminal, copy valid findings to Claude Code and fix, then run `git:commit`
- Invoke `claude-docs` to sync `.claude/` docs and run `git:stage` to group staged files for the commit

Then run in parallel terminal instances:

```bash
# Terminal 1
gemini git:branch

# Terminal 2
gemini docs:sync

# Terminal 3
gemini release:changelog

# Terminal 4
gemini git:pr
```

### UI polish

Verify the change manually in the browser. Use `claude-ui-test` if you need Claude Code to produce a browser verification checklist for the session. For the fix itself, describe the change in Claude chat or Claude Code directly.

### Quick fix

- Verify failure or isolated bug → continue in Claude Code (it has the implementation context)
- Design or planning conflict → escalate to a new Claude chat session with the relevant plan context
- Fast file edit (TASKS.md, config, renaming) → Claude Code directly, no chat needed

### Review

Run `gemini dev:review` in terminal. Copy valid findings to Claude Code and fix. If nothing is valid, do nothing. For a deeper review with fresh context, invoke `claude-review` in Claude Code. It reads REVIEWER.md and produces a findings report against main.

## Feedback routing

```plaintext
verify fails  → Claude Code (it has implementation context)
design fails  → new Claude chat session (planning problem)
review finds  → Claude Code (same implementation session)
```

## Snippets

Claude-specific snippets require the `.claude/` workflow to be set up.

| Slug              | When to use                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `claude-feature`  | Before implementation, scan for code-level conflicts             |
| `claude-plan`     | Start of planning session, plan a feature with full doc context  |
| `claude-review`   | After implementation, triggers REVIEWER.md role in Claude Code   |
| `claude-docs`     | After implementation, syncs `.claude/` docs with session changes |
| `claude-tell`     | In Claude chat, produce doc blocks and Claude Code handoff       |
| `claude-ui-test`  | After implementation, generate manual browser verification steps |
| `claude-ux-audit` | Standalone session, UX/UI audit of existing features             |

## Prompt generation

`aitk claude prompt` reads `PLANNER.md` and `IMPLEMENTER.md`, injects governance rules from `.cursor/rules/` and context docs, and writes `.tmp/PLANNER.md`, `.tmp/IMPLEMENTER.md`, `.tmp/REVIEWER.md`.

Run `aitk gov sync` first when switching stacks. Run `aitk claude gov` to build `.claude/GOV.md` from installed rules; Claude Code loads this automatically each session. Run `aitk gov build` to generate a standalone rules file at `.cursor/.tmp/rules.md` for pasting directly into any AI chat.

## Gemini CLI commands

Deterministic scripts with zero AI tokens and zero variability.

| Command              | What it does                                        |
| -------------------- | --------------------------------------------------- |
| `/dev:review`        | Review branch changes vs main, or a pasted response |
| `/dev:apply`         | Write files from AI response, fallback only         |
| `/dev:comment`       | Add comments to source code                         |
| `/docs:sync`         | Sync README and docs with codebase changes          |
| `/git:branch`        | Generate branch name                                |
| `/git:stage`         | Group staged files for batch commits                |
| `/git:commit`        | Generate commit message                             |
| `/git:pr`            | Generate PR description                             |
| `/git:split`         | Split mixed commits into separate branches          |
| `/release:changelog` | Generate changelog from commit history              |
