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
├── PROJECT.md         ← ASCII tree only, auto-generated, gitignored
└── .tmp/              ← ephemeral scratch space, gitignored
```

## Gitignore

- `# Claude` — `.claude/.tmp/`, `.claude/PROJECT.md`

## CLI

| Command              | What it does                                             |
| -------------------- | -------------------------------------------------------- |
| `gdev claude init`   | Seeds `.claude/` workflow docs, updates `.gitignore`     |
| `gdev claude update` | Diffs `SESSION.md` against seed, offers to apply changes |
