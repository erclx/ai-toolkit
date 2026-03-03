# Workflow Documents Reference

A concise overview of all documents in the dev workflow, with tool mappings.

> **Session note:** "Session start" = opening a new chat tab (new context window). New message in the same chat = no re-orientation needed. New chat tab = paste in this order: `SESSION.md` → `TASKS.md` → `PROJECT.md` → active feature context. Add `REQUIREMENTS.md` + `ARCHITECTURE.md` only when starting a brand new feature.

## File Location

All planning docs live in `.claude/` at the project root. Git tracked, part of the project, not throwaway notes.

> **Setup:** Run `gdev claude init` in a new project to generate this structure automatically.

```
.claude/
├── SESSION.md           ← session system prompt, paste first always
├── REQUIREMENTS.md      ← project goals, non-goals, MVP scope
├── ARCHITECTURE.md      ← technical design decisions and open questions
├── DESIGN.md            ← color, typography, spacing, and motion decisions
├── TASKS.md             ← persistent task tracker, source of truth for progress
├── REVIEW.md            ← review prompt template, copy-paste into fresh chat
└── PROJECT.md           ← ASCII tree only, auto-generated, gitignored
```

## Documents

**`SESSION.md`** — System prompt for Claude. Defines role, sync format, output rules, and planning behavior. Paste first every session. Created once per project with Claude chat.

**`REQUIREMENTS.md`** — Project goals, non-goals, MVP scope, tech stack, and constraints. Created before any code with Claude chat.

**`ARCHITECTURE.md`** — Technical design decisions, folder structure, storage shape, and open risks. Created before any code with Claude chat.

**`DESIGN.md`** — Color tokens, typography, spacing, border, and motion decisions. Created before UI implementation with Claude chat.

**`TASKS.md`** — Persistent task tracker. Source of truth for what is in progress, up next, done, and blocked. Updated every session.

**`REVIEW.md`** — Prompt template for per-feature code review. Open it, copy the template, fill in task, plan, and code, paste into a fresh chat.

**`CHANGELOG.md`** — Release notes. Generated with `/release:changelog` after features are done.

**`PROJECT.md`** — ASCII tree of the project structure. Auto-generated via `bun run snapshot`. Gitignored. Regenerate when structure changes.

## Core Implementation Loop

```
┌─────────────────────────────────────────────────────┐
│  SESSION START (new chat tab)                        │
│  1. SESSION.md           (always, paste first)       │
│  2. TASKS.md             (always)                    │
│  3. REQUIREMENTS.md +    (new feature only)          │
│     ARCHITECTURE.md                                  │
│  Tool: Claude chat                                   │
└──────────────────────┬──────────────────────────────┘
                       │ produces ASCII wireframes (UI features)
                       │ + feature plan + todo list in TASKS.md
                       ▼
┌─────────────────────────────────────────────────────┐
│  INSTALL DEPENDENCIES                                │
│  Run any bun add commands from the feature plan      │
│  Do this before pasting plan to Gemini               │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  CODE GENERATION                                     │
│  Paste: feature plan + relevant code (via stacker)  │
│  Tool: Gemini pro chat with master-prompt injected   │
│        (gov rules live here, not in Claude chat)     │
│  → generates complete file contents                  │
└──────────────────────┬──────────────────────────────┘
                       │ copy output
                       ▼
┌─────────────────────────────────────────────────────┐
│  APPLY + VERIFY                                      │
│  → /dev:apply          # writes files to disk        │
│  → bun run check       # format, lint, spell, tests  │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │ FAIL                    │ PASS
          ▼                         ▼
┌──────────────────┐    ┌──────────────────────────────┐
│ Paste error back │    │         REVIEW                │
│ into Gemini chat │    │  Fresh chat + REVIEW.md       │
│ (same session,   │    │  template + task, plan, code  │
│ it has context)  │    │  → findings report            │
│                  │    │  → paste critical/should-fix  │
│ If design issue  │    │    back to Gemini chat         │
│ escalate to      │    │  → re-run bun run check       │
│ Claude chat      │    └──────────────┬───────────────┘
└──────────────────┘                   │
                                       ▼
                        ┌──────────────────────────────┐
                        │  COMMIT                       │
                        │  Mark todos done in TASKS.md  │
                        │  → /git:commit                │
                        │  → /git:pr                    │
                        │  Next feature                 │
                        └──────────────────────────────┘

Feedback routing rule:
  verify fails  → Gemini chat (code problem, it has context)
  design fails  → Claude chat (planning problem)
  review finds  → Gemini chat (same implementation session)

Note: Gemini CLI is a file writer only via /dev:apply.
      All planning stays in Claude chat.
      All code generation stays in Gemini pro chat.
```

## Tool Mapping Summary

| Stage                  | Tool            | Command / Note                                                           |
| ---------------------- | --------------- | ------------------------------------------------------------------------ |
| Scaffold .claude/      | gdev            | `gdev claude init`                                                       |
| Planning (all docs)    | Claude chat     | Paste SESSION.md first; add REQUIREMENTS + ARCHITECTURE for new features |
| Code generation        | Gemini pro chat | Master prompt via `gdev prompt`                                          |
| Apply file changes     | Gemini CLI      | `/dev:apply` — file writer only, no planning                             |
| Lint / format / tests  | bun scripts     | `bun run check`                                                          |
| Fix failures           | Gemini chat     | Paste error in same session                                              |
| Feature review         | Fresh chat      | Copy REVIEW.md template, paste task + plan + code                        |
| Escalate design issues | Claude chat     | Paste error + relevant plan context                                      |
| Commit message         | Gemini CLI      | `/git:commit`                                                            |
| PR description         | Gemini CLI      | `/git:pr`                                                                |
| Changelog              | Gemini CLI      | `/release:changelog`                                                     |
| Prompt generation      | gdev            | `gdev prompt`                                                            |
| Install gov rules      | gdev            | `gdev gov install [stack] [path]`                                        |
| Sync gov to project    | gdev            | `gdev gov sync [path]`                                                   |

> Gov rules apply to code generation and fix failures only.
