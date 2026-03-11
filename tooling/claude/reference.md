# Tooling Claude reference

## Overview

The claude stack installs the `.claude/` workflow directory into a project. Role prompts are managed configs that overwrite on sync; drift is always wrong. State docs are seeds, written once and never overwritten by tooling.

## Structure

```plaintext
.claude/
├── PLANNER.md         ← managed. System prompt for planning sessions, auto-injected by aitk claude prompt
├── REVIEWER.md        ← managed. System prompt for code review, copy-paste into fresh chat
├── IMPLEMENTER.md     ← managed. System prompt for code generation, read by aitk claude prompt
├── TASKS.md           ← seeded. Persistent task tracker, source of truth for progress
├── REQUIREMENTS.md    ← seeded. Project goals, non-goals, MVP scope
├── ARCHITECTURE.md    ← seeded. Technical design decisions and open questions
├── DESIGN.md          ← seeded. Color, typography, spacing, and motion decisions
├── WIREFRAMES.md      ← seeded. ASCII wireframes for planning, structure and layout only
└── .tmp/              ← ephemeral scratch space, gitignored

scripts/
└── core/
    └── snapshot.sh    ← writes project file tree to .claude/.tmp/SNAPSHOT.md
```

## Gitignore

- `# Claude` — `.claude/.tmp/`

## CLI

| Command              | What it does                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `aitk claude init`   | Seeds `.claude/` workflow docs, updates `.gitignore`                                                           |
| `aitk claude sync`   | Diffs managed role prompts against configs and applies updates. Reports seeded file status.                    |
| `aitk claude prompt` | Injects context into `PLANNER.md` and `IMPLEMENTER.md`, copies `REVIEWER.md` to `.tmp/`, writes all to `.tmp/` |
| `npm run snapshot`   | Writes project file tree to `.claude/.tmp/SNAPSHOT.md`                                                         |
