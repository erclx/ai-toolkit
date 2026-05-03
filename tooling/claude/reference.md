# Tooling Claude reference

## Overview

The claude stack installs the `.claude/` workflow directory into a project. Role prompts are managed configs that overwrite on sync. Drift is always wrong. State docs are seeds, written once and never overwritten by tooling. `CLAUDE.md` is a seed, filled in per project after init.

## Structure

```plaintext
.claude/
├── PLANNER.md         ← managed. System prompt for planning sessions, auto-injected by aitk claude prompt
├── REVIEWER.md        ← managed. System prompt for code review, invoked via code-review snippet in Claude Code
├── IMPLEMENTER.md     ← managed. System prompt for code generation, read by aitk claude prompt
├── CLAUDE.md          ← seeded. Project context and rules, auto-loaded by Claude Code each session
├── TASKS.md           ← seeded then gitignored. Per-worktree task tracker, local scratch only
├── REQUIREMENTS.md    ← seeded. Project goals, non-goals, MVP scope
├── ARCHITECTURE.md    ← seeded. Technical design decisions and open questions
├── DESIGN.md          ← seeded. Visual intent and the decisions behind it
├── WIREFRAMES.md      ← seeded. ASCII wireframes for layout, UI copy, interaction rules, and meaningful states
├── GOV.md             ← retired. Removed by `aitk gov sync` if present from a prior install
├── settings.json      ← seeded. Project-level Claude Code config (PostToolUse hook only). User-level config installed separately via `aitk claude setup`.
├── plans/             ← execution detail for multi-step tasks, gitignored. `feature-*.md` entries swept by claude-docs.
├── review/            ← scratch for claude-review and claude-ui-test output, gitignored
├── .tmp/              ← ephemeral scratch space, gitignored
└── memory/            ← session memory files, gitignored
```

## Gitignore

- `# Claude`: `.claude/.tmp/`, `.claude/memory/`, `.claude/plans/`, `.claude/review/`, `.claude/worktrees/`, `.claude/TASKS.md`

## CLI

| Command              | What it does                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `aitk claude init`   | Seeds `.claude/` workflow docs, updates `.gitignore`                                                                        |
| `aitk claude sync`   | Diffs managed role prompts against configs and applies updates. Reports seeded file status.                                 |
| `aitk claude prompt` | Injects context into `PLANNER.md` and `IMPLEMENTER.md`, copies `REVIEWER.md` to `.tmp/`, writes all to `.tmp/`              |
| `aitk claude setup`  | Installs user-level config to `~/.claude/`: statusline, attribution, and permission allows or denies. Run once per machine. |

## CLAUDE.md

- Ships as a seed with placeholder project name, description, and key paths. Fill these in after init.
- Section layout: `Context`, `Indexes`, `Markdown`, `Key paths`, `Spelling`, `Snippets`, `Tasks`, `Memory`. Each section groups rules that share a surface so skills can detect, extend, or skip by heading.
- The memory rules favor signal over volume. Saving only after a second occurrence or an explicit user correction keeps entries focused on patterns worth preventing, not first-occurrence slips. The 3-line cap stops the built-in auto-memory from drifting into narrative writeups that bury the rule underneath the recovery story.
- The `Context` section points at `.claude/` state docs one line. `claude-feature` does the parallel read when invoked. The seed intentionally does not re-list every file.

## Seed docs

- Seed docs ship with a guidelines preamble above the first H2. These are instructions Claude internalizes before filling in the sections below. They are not sections to populate.

## Role prompts

- Planner governance is injected inline by `aitk claude prompt` using the `planner` stack from the toolkit. No separate build step needed.

## settings.json

- Project seed at `tooling/claude/seeds/.claude/settings.json` ships only the PostToolUse hook block that pairs with `.claude/hooks/standards-audit.sh`. Project settings layer over user settings, so per-project files only carry what is genuinely project-specific.
- User-level template at `tooling/claude/user/settings.template.json` carries `attribution.commit` and `attribution.pr` (empty strings to suppress co-author tags), `permissions.allow` with `Bash(bun run *)`, and `permissions.deny` with `Read(**/.env)` and `Read(**/.env.*)` to block accidental secret exposure across any project. Installed once per machine via `aitk claude setup`.
- The deprecated `includeCoAuthoredBy` key is not used.
