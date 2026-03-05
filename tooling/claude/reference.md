# TOOLING CLAUDE REFERENCE

## Overview

The claude stack seeds the `.claude/` workflow directory into a project.

## Structure

```
.claude/
├── PLANNER.md         ← system prompt for planning sessions, auto-injected by aitk claude prompt
├── TASKS.md           ← persistent task tracker, source of truth for progress
├── REQUIREMENTS.md    ← project goals, non-goals, MVP scope
├── ARCHITECTURE.md    ← technical design decisions and open questions
├── DESIGN.md          ← color, typography, spacing, and motion decisions
├── REVIEWER.md        ← system prompt for code review, copy-paste into fresh chat
├── IMPLEMENTER.md     ← system prompt for code generation, read by aitk claude prompt
└── .tmp/              ← ephemeral scratch space, gitignored
```

## Gitignore

- `# Claude` — `.claude/.tmp/`

## CLI

| Command              | What it does                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `aitk claude init`   | Seeds `.claude/` workflow docs, updates `.gitignore`                                                         |
| `aitk claude sync`   | Diffs `PLANNER.md` against seed, offers to apply changes                                                     |
| `aitk claude prompt` | Injects context into `PLANNER.md` and `IMPLEMENTER.md`, copies REVIEWER.md to `.tmp/`, writes all to `.tmp/` |
