# AI workflow reference

A concise reference for when to reach for which tool, organized by what you're trying to do.

> **Mental model:** Claude Code for everything: planning, implementation, review, docs, git, and release. Gemini CLI is available throughout, used as needed rather than at prescribed steps.

## Documents

Project docs live in `.claude/` at the project root.

```plaintext
.claude/
├── REQUIREMENTS.md  ← goals, non-goals, MVP scope
├── ARCHITECTURE.md  ← technical design decisions
├── DESIGN.md        ← visual intent and token decisions (UI projects)
├── WIREFRAMES.md    ← ASCII wireframes: layout, UI copy, and interaction rules (UI projects)
├── TASKS.md         ← persistent task tracker, source of truth
└── GOV.md           ← governance rules, generated via aitk claude gov
```

Run `aitk claude init` to seed the `.claude/` directory and a root `CLAUDE.md` file. Run `aitk gov install` to install rules into `.cursor/rules/`, then run `aitk claude gov` to build `GOV.md`. Regenerate only when rules change.

Role prompts (`PLANNER.md`, `IMPLEMENTER.md`, `REVIEWER.md`) are available via `aitk claude roles` for chat-based AI workflows but are not part of the default install. See [docs/claude.md](claude.md) for details.

## Scenarios

### New feature

Split each feature across two sessions. Session 1 covers planning and implementation. Session 2 covers review and ship. Starting session 2 fresh keeps the reviewer independent and prevents context from accumulating across the full workflow.

#### Session 1

Work in Claude Code directly. It reads `CLAUDE.md` automatically and has full file access, no pasting needed.

- Invoke `toolkit:claude-feature` to scan for code-level conflicts and ambiguities, confirm approach before proceeding
- Implement the feature, then Claude Code runs the commands defined in `CLAUDE.md`, fixes failures, and iterates until all pass
- For UI changes, invoke `toolkit:claude-ui-test` to generate and run Playwright e2e tests
  End the session once the feature works and tests pass. Invoke `toolkit:claude-docs` to capture any decisions made during implementation before closing.

#### Session 2

Start a fresh Claude Code session. The diff is sufficient context for both review and ship.

- Invoke `toolkit:claude-review` to review all changes since main and output a findings report
- Fix any valid findings
- Invoke `toolkit:git-ship` to sync docs, commit by concern, rename branch, and open PR

### UI polish

Verify the change manually in the browser. Invoke `toolkit:claude-ui-test` if you need e2e tests and a visual verification checklist for the session. For the fix itself, describe the change in Claude Code directly.

### Quick fix

- Verify failure or isolated bug → continue in Claude Code (it has the implementation context)
- Design or planning conflict → escalate to a new Claude chat session with the relevant plan context
- Fast file edit (TASKS.md, config, renaming) → Claude Code directly, no chat needed

### Review

Invoke `toolkit:claude-review` at the start of session 2. It reads all changed files and outputs a findings report. Fix valid findings before invoking `toolkit:git-ship`. If nothing is valid, skip directly to ship.

## Skills

| Skill                          | When to use                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `toolkit:claude-feature`       | Before implementation, scan for conflicts and ambiguities                        |
| `toolkit:claude-review`        | In a fresh session, review all changes since main                                |
| `toolkit:claude-docs`          | When decisions diverged from plan, update `.claude/` docs                        |
| `toolkit:claude-ui-test`       | After UI changes, generate and run e2e tests + visual checklist                  |
| `toolkit:systematic-debugging` | When a test fails or bug surfaces, enforce root-cause investigation before fixes |
| `toolkit:git-ship`             | Post-feature: sync docs, commit, rename branch, open PR                          |

## Feedback routing

```plaintext
verify fails  → Session 1 (it has implementation context)
design fails  → new Claude chat session (planning problem)
review finds  → Session 2 (fix alongside review, before ship)
```

## Snippets

Claude-specific snippets require the `.claude/` workflow to be set up. For the full list, see `docs/snippets.md`.

| Slug                | When to use                                          |
| ------------------- | ---------------------------------------------------- |
| `claude-ux-audit`   | Standalone session, UX/UI audit of existing features |
| `claude-tasks-add`  | Add a new task block to the "Up next" queue          |
| `claude-tasks-done` | Move completed task blocks to `TASKS-ARCHIVE.md`     |

## Prompt generation (roles only)

`aitk claude prompt` reads `PLANNER.md` and `IMPLEMENTER.md`, injects governance rules from `.cursor/rules/`, context docs, and `standards/prose.md`, and writes `.tmp/PLANNER.md`, `.tmp/IMPLEMENTER.md`, `.tmp/REVIEWER.md`. This requires roles to be installed via `aitk claude roles`.

Run `aitk gov sync` first when switching stacks. Run `aitk claude gov` to build `.claude/GOV.md` from installed rules. Claude Code loads this automatically each session. Run `aitk gov build` to generate a standalone rules file at `.cursor/.tmp/rules.md` for pasting directly into any AI chat.

## Gemini CLI commands

See [docs/gemini.md](gemini.md) for the full command reference.
