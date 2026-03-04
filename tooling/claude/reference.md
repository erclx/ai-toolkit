# TOOLING CLAUDE REFERENCE

## Overview

The claude stack seeds the `.claude/` workflow directory into a project.

## Structure

```
.claude/
├── SESSION.md         ← session system prompt, paste first every session
├── TASKS.md           ← persistent task tracker, source of truth for progress
├── REQUIREMENTS.md    ← project goals, non-goals, MVP scope
├── ARCHITECTURE.md    ← technical design decisions and open questions
├── DESIGN.md          ← color, typography, spacing, and motion decisions (UI projects only)
├── REVIEW.md          ← review prompt template, copy-paste into fresh chat
├── IMPLEMENTER.md     ← master prompt template, read by aitk claude prompt
└── .tmp/              ← ephemeral scratch space, gitignored
```

## Gitignore

- `# Claude` — `.claude/.tmp/`

## CLI

| Command              | What it does                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `aitk claude init`   | Seeds `.claude/` workflow docs, updates `.gitignore`                                                             |
| `aitk claude update` | Diffs `SESSION.md` against seed, offers to apply changes                                                         |
| `aitk claude prompt` | Injects `.cursor/rules/` + TASKS, REQUIREMENTS, ARCHITECTURE into `IMPLEMENTER.md`, writes `.tmp/IMPLEMENTER.md` |
