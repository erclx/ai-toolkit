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
└── GOV.md           ← governance rules, generated once via aitk gov build
```

Run `aitk claude init` to seed the `.claude/` directory, default prompt templates, and a root `CLAUDE.md` file. Run `aitk gov build` and copy the output to `.claude/GOV.md` once. Regenerate only when rules change.

## Scenarios

### New feature

Run `aitk claude prompt` to build the context payload. Work in Claude chat for planning. It holds context across the whole feature so wireframes, task lists, and decisions stay in the same session.

Switch to Claude Code for implementation. It reads CLAUDE.md automatically and has full file access, no pasting needed.

- Implement the feature, run `bun run check`, fix failures, iterate until verify passes
- Invoke the `code-review` snippet when implementation feels done. Claude Code reads REVIEWER.md and produces a findings report against main.
- Feed critical findings back into the same Claude Code session and fix.
- Invoke the `claude-docs` snippet. Claude Code checks ARCHITECTURE.md, DESIGN.md, TASKS.md, REQUIREMENTS.md and updates anything that drifted during implementation.

When done, run pre-PR steps in parallel terminal instances:

```bash
# Terminal 1
gemini docs:sync

# Terminal 2
gemini release:changelog

# Terminal 3
gemini git:pr
```

Then: `/git:branch` → `/git:stage` → `/git:commit`

### UI polish

Screenshot the component, open a Claude chat session, describe the change. Claude chat generates an edit prompt with the relevant class names or structure tweaks. Paste it into Claude Code, or write the edit prompt yourself if it's simple enough.

### Quick fix

- Verify failure or isolated bug → continue in Claude Code (it has the implementation context)
- Design or planning conflict → escalate to a new Claude chat session with the relevant plan context
- Fast file edit (TASKS.md, config, renaming) → Claude Code directly, no chat needed

### Review

Invoke the `code-review` snippet in the active Claude Code session:

> Read `.claude/REVIEWER.md`, adopt the role, and review all files changed on this branch against main.

For a deeper review with fresh context, open a new Claude chat tab and paste REVIEWER.md + relevant code.

## Feedback routing

```
verify fails  → Claude Code (it has implementation context)
design fails  → new Claude chat session (planning problem)
review finds  → Claude Code (same implementation session)
```

## Snippets

Claude-specific snippets require the `.claude/` workflow to be set up.

| Slug          | When to use                                                |
| ------------- | ---------------------------------------------------------- |
| `claude-plan` | Start of session, plan a feature with full doc context     |
| `code-review` | After implementation, triggers REVIEWER.md role            |
| `claude-docs` | After review, syncs `.claude/` docs with session decisions |

## Prompt generation

`aitk claude prompt` reads `PLANNER.md` and `IMPLEMENTER.md`, injects governance rules from `.cursor/rules/` and context docs, and writes `.tmp/PLANNER.md`, `.tmp/IMPLEMENTER.md`, `.tmp/REVIEWER.md`.

Run `aitk gov sync` first when switching stacks. Run `aitk gov build` to generate a standalone rules file at `.cursor/.tmp/rules.md` for pasting directly into any AI chat, or copy to `.claude/GOV.md` for automatic loading in Claude Code sessions.

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
