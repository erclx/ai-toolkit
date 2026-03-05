# Workflow Documents Reference

A concise overview of all documents in the dev workflow, with tool mappings.

> **Session note:** "Session start" = opening a new chat tab (new context window). New message in the same chat = no re-orientation needed. New chat tab = paste in this order: `PLANNER.md` → `TASKS.md`. Add `REQUIREMENTS.md` + `ARCHITECTURE.md` only when starting a brand new feature or debugging a planning-level issue.

## File Location

All planning docs live in `.claude/` at the project root. Git tracked, part of the project, not throwaway notes.

> **Setup:** Run `aitk claude init` in a new project to interactively seed this structure.

```
.claude/
├── PLANNER.md           ← system prompt for planning, paste first always
├── REQUIREMENTS.md      ← project goals, non-goals, MVP scope
├── ARCHITECTURE.md      ← technical design decisions and open questions
├── DESIGN.md            ← color, typography, spacing, and motion decisions (UI projects only)
├── TASKS.md             ← persistent task tracker, source of truth for progress
├── REVIEWER.md          ← system prompt for code review, copy-paste into fresh chat
└── IMPLEMENTER.md       ← system prompt for code generation, read by aitk claude prompt
```

## Documents

### Role Prompts

Role prompts are agent instructions. They open with `# System Prompt: [Role]` and define behavior for a specific agent mode.

**`PLANNER.md`** — System prompt for Claude planning sessions. Defines role, sync format, output rules, and planning behavior. Paste first every session. Managed by `aitk`; use `aitk claude update` to sync.

**`IMPLEMENTER.md`** — System prompt for code generation. Receives plan context and governance rules via `aitk claude prompt`. Paste into Gemini pro chat to start implementation.

**`REVIEWER.md`** — System prompt for per-feature code review. Copy the template, paste the full Gemini response into `[PASTE GEMINI RESPONSE]`, send to a fresh Gemini chat. Managed by `aitk`; use `aitk claude update` to sync.

### State Documents

State documents are project artifacts. They open with `# [Name]` and track project state that evolves over time.

**`REQUIREMENTS.md`** — Project goals, non-goals, MVP scope, tech stack, and constraints. Created before any code with Claude chat.

**`ARCHITECTURE.md`** — Technical design decisions, folder structure, storage shape, and open risks. Created before any code with Claude chat. Planner-owned — never modified by the implementer. Surface architecture conflicts back to Claude chat.

**`DESIGN.md`** — Color tokens, typography, spacing, border, and motion decisions. Created before UI implementation with Claude chat. Seeded for all projects; delete if not needed.

**`TASKS.md`** — Persistent task tracker. Source of truth for what is in progress, up next, done, and blocked. Updated every session.

## Prompt Generation

`aitk claude prompt` generates the master implementation prompt for code generation.

- Reads `.claude/IMPLEMENTER.md` as the template (a managed file updated via `aitk claude update`)
- Injects all `.mdc` files from `.cursor/rules/` into `{{GOVERNANCE_RULES}}`
- Auto-injects current content of `TASKS.md`, `REQUIREMENTS.md`, and `ARCHITECTURE.md` from `.claude/`
- Leaves `## Source Code Context` as `[PASTE RELEVANT SOURCE FILES]` — fill manually using your editor extension
- Writes output to `.claude/.tmp/IMPLEMENTER.md` — paste into Gemini chat to start a session
- Copies `REVIEWER.md` to `.claude/.tmp/REVIEWER.md` — scratch copy for pasting Gemini responses
- Run `aitk gov sync` first when switching stacks

## Core Implementation Loop

```
┌─────────────────────────────────────────────────────┐
│  SESSION START (new chat tab)                        │
│  1. PLANNER.md           (always, paste first)       │
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
│  1. `aitk claude prompt`                               │
│  2. Paste source files into `.tmp/IMPLEMENTER.md`      │
│  3. Paste final prompt into Gemini pro chat          │
│  → responds with plan restatement + complete files   │
│  → may include COMMANDS section with install steps   │
└──────────────────────┬──────────────────────────────┘
                       │ copy full response
                       ▼
┌─────────────────────────────────────────────────────┐
│  REVIEW                                              │
│  Copy full Gemini response                           │
│  Open REVIEWER.md → paste response into               │
│  [PASTE GEMINI RESPONSE]                             │
│  Paste into fresh Gemini chat                        │
│  → findings report (critical / should-fix / minor)  │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │ findings                │ clean
          ▼                         ▼
┌──────────────────────┐  ┌────────────────────────────┐
│ Feed critical/        │  │  APPLY + VERIFY             │
│ should-fix back to    │  │  → /dev:apply               │
│ original Gemini       │  │  → bun run check            │
│ session → fix         │  └──────────────┬─────────────┘
│ Re-run review         │                 │
└──────────┬───────────┘                 │
           └──────────────┬──────────────┘
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
      Run aitk gov sync before aitk claude prompt when switching stacks.
```

## Tool Mapping Summary

| Stage                  | Tool              | Command / Note                                                                                                       |
| ---------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| Scaffold .claude/      | aitk claude       | Interactively seed .claude/ docs and sync .gitignore                                                                 |
| Planning (all docs)    | Claude chat       | Paste PLANNER.md first; add REQUIREMENTS + ARCHITECTURE for new features                                             |
| Generate master prompt | aitk claude       | `aitk claude prompt` — injects rules + auto-injects TASKS, REQUIREMENTS, ARCHITECTURE; paste source context manually |
| Code generation        | Gemini pro chat   | Paste .tmp/IMPLEMENTER.md, fill SOURCE with relevant files                                                           |
| Apply file changes     | Gemini CLI        | `/dev:apply` — file writer only, no planning                                                                         |
| Feature review         | Fresh Gemini chat | Copy REVIEWER.md template, paste full Gemini response into [PASTE GEMINI RESPONSE]                                   |
| Fix findings           | Gemini chat       | Paste critical/should-fix back into original session                                                                 |
| Lint / format / tests  | bun scripts       | `bun run check`                                                                                                      |
| Escalate design issues | Claude chat       | Paste error + relevant plan context                                                                                  |
| Commit message         | Gemini CLI        | `/git:commit`                                                                                                        |
| PR description         | Gemini CLI        | `/git:pr`                                                                                                            |
| Changelog              | Gemini CLI        | `/release:changelog`                                                                                                 |
| Install gov rules      | aitk              | `aitk gov install [stack] [path]`                                                                                    |
| Sync gov rules         | aitk              | `aitk gov sync [path]`                                                                                               |
| Install standards      | aitk              | `aitk standards install [path]`                                                                                      |
| Sync standards         | aitk              | `aitk standards sync [path]`                                                                                         |

> Gov rules apply to code generation and fix failures only.
