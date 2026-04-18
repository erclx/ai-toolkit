---
title: AI workflow
description: Overarching AI workflow across domains
category: Agent surface
---

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

## Scenarios

### Bootstrap a new project

Two steps, in order:

1. Run the framework's own scaffold (`bun init`, `npm create vite`, `npm create astro`). The toolkit does not run this step, so stack choice stays with you.
2. Invoke `toolkit:init-project` in Claude Code. It detects the stack from files, resolves flags, previews the chain, then runs `aitk init` to layer base tooling, Claude seeds, governance, snippets, and wiki.

Optional domains (`standards`, `prompts`, `antigravity`) pass through `--with`. Add only if the project needs them.

### New feature

One session works for most features. Prefer splitting across two sessions only when the feature is large enough that you want a cold, independent reviewer on the diff. Plan and implement in session 1, then review and ship in session 2.

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

### Parallel features

When features are independent, run them in parallel instead of sequentially. Use one git worktree per feature so each session has its own working tree and branch.

- Create a worktree per feature, then start a Claude Code session in each
- Invoke `toolkit:claude-feature` in each session. When the skill writes a plan file, it lands at `.claude/plans/feature-<slug>.md`, one per feature, no collisions. Small features stay in chat and skip the file.
- Implement, verify, and review each feature independently. `claude-review` and `claude-ui-test` write per-branch files (`review-<branch>.md`, `ui-checklist-<branch>.md`), so parallel sessions do not overwrite each other
- Ship each worktree separately with `toolkit:git-ship`
- For full autonomy per worktree, invoke `toolkit:claude-autoship` instead of the manual chain. Approve the plan, walk away, come back to draft PRs.

Caveats: `.claude/TASKS.md` is a single file. If multiple sessions edit it concurrently, resolve the merge at ship time. Treat memory updates as single-writer in practice. See [Claude Code and git worktrees](../wiki/claude-worktrees.md) for the full domain-level fan-out rules in this toolkit repo.

### Autonomous ship

For features on a mature stack, chain the post-plan pipeline in one session. Approve the plan, invoke `toolkit:claude-autoship`, and the skill runs implement → verify → review → ship sequentially.

- Use when the plan is tight and the stack has real verify commands and test coverage
- Autoship stops on: verify failure after one fix attempt, UI manual checklist non-empty, any review finding above minor, or hook failure
- Every stop leaves recoverable state. Fix and resume with `/git-ship`
- Skip autoship for auth, migrations, security-sensitive changes, or work where the plan itself is uncertain

### UI polish

Verify the change manually in the browser. Invoke `toolkit:claude-ui-test` if you need e2e tests and a visual verification checklist for the session. For the fix itself, describe the change in Claude Code directly.

### Quick fix

- Verify failure or isolated bug → continue in Claude Code (it has the implementation context)
- Design or planning conflict → escalate to a new Claude chat session with the relevant plan context
- Fast file edit (TASKS.md, config, renaming) → Claude Code directly, no chat needed

### Review

Invoke `toolkit:claude-review` at the start of session 2. It reads all changed files and outputs a findings report. Fix valid findings before invoking `toolkit:git-ship`. If nothing is valid, skip directly to ship.

### UI-heavy project

Before the first feature session on a UI-heavy project, pick a design tier. The tier determines seed shape, installed MCP servers, and installed plugin skills. See [visual design workflow](../wiki/visual-design-workflow.md) for the framework and decision guide.

## Skills

| Skill                          | When to use                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `toolkit:claude-feature`       | Before implementation, scan for conflicts and ambiguities                        |
| `toolkit:claude-review`        | In a fresh session, review all changes since main                                |
| `toolkit:claude-docs`          | When decisions diverged from plan, update `.claude/` docs                        |
| `toolkit:claude-ui-test`       | After UI changes, generate and run e2e tests + visual checklist                  |
| `toolkit:claude-ux-audit`      | Audit existing UI surfaces for missing states, edge cases, inconsistencies       |
| `toolkit:claude-autoship`      | After plan approval, chain implement → verify → review → draft PR                |
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

| Slug                | When to use                                                   |
| ------------------- | ------------------------------------------------------------- |
| `claude-tasks-done` | Remove completed task blocks and delete referenced plan files |
