# AI workflow reference

A concise overview of all documents in the dev workflow, with tool mappings.

> **Session note:** "Session start" = opening a new chat tab (new context window). New message in the same chat = no re-orientation needed. New chat tab = run `aitk claude prompt`, then paste `.tmp/PLANNER.md`. Add `REQUIREMENTS.md` + `ARCHITECTURE.md` only when starting a brand new feature or debugging a planning-level issue.

## File location

All planning docs live in `.claude/` at the project root. Git tracked, part of the project, not throwaway notes.

> **Setup:** Run `aitk claude init` in a new project to interactively seed this structure.

```plaintext
.claude/
├── PLANNER.md           ← system prompt for planning, auto-injected by aitk claude prompt
├── REQUIREMENTS.md      ← project goals, non-goals, MVP scope
├── ARCHITECTURE.md      ← technical design decisions and open questions
├── DESIGN.md            ← color, typography, spacing, and motion decisions (UI projects only)
├── WIREFRAMES.md        ← ASCII wireframes for planning, structure and layout only (UI projects only)
├── TASKS.md             ← persistent task tracker, source of truth for progress
├── REVIEWER.md          ← system prompt for code review, fallback for browser tab review flow
└── IMPLEMENTER.md       ← system prompt for code generation, read by aitk claude prompt
```

## Documents

### Role prompts

Role prompts are agent instructions. They open with `# System Prompt: [Role]` and define behavior for a specific agent mode.

**`PLANNER.md`** — System prompt for Claude planning sessions. Defines role, sync format, output rules, and planning behavior. Context (TASKS, REQUIREMENTS, ARCHITECTURE, DESIGN) is auto-injected by `aitk claude prompt`. Paste `.tmp/PLANNER.md` to start a session. Managed by `aitk`; use `aitk claude sync` to sync. Local changes will be overwritten.

**`IMPLEMENTER.md`** — System prompt for code generation. Receives plan context and governance rules via `aitk claude prompt`. Paste into Gemini pro chat to start implementation.

**`REVIEWER.md`** — Fallback system prompt for code review in a browser tab. Use when you want a deeper review outside the normal loop. For standard per-feature review, use `/dev:review` instead.

### State documents

State documents are project artifacts. They open with `# [Name]` and track project state that evolves over time.

**`REQUIREMENTS.md`** — Project goals, non-goals, MVP scope, tech stack, and constraints. Created before any code with Claude chat.

**`ARCHITECTURE.md`** — Technical design decisions, folder structure, storage shape, and open risks. Created before any code with Claude chat. Planner-owned, never modified by the implementer. Surface architecture conflicts back to Claude chat.

**`DESIGN.md`** — Color tokens, typography, spacing, border, and motion decisions. Created before UI implementation with Claude chat. Seeded for all projects; delete if not needed.

**`WIREFRAMES.md`** — ASCII wireframes for UI features. Structure and layout only, not final design. Created during planning with Claude chat. Seeded for all projects; delete if not needed.

**`TASKS.md`** — Persistent task tracker. Source of truth for what is in progress, up next, done, and blocked. Updated every session.

## Prompt generation

`aitk claude prompt` generates master prompts for planning and code generation.

- Reads `.claude/PLANNER.md` and `.claude/IMPLEMENTER.md` as templates
- Injects all `.mdc` files from `.cursor/rules/` into IMPLEMENTER's `{{GOVERNANCE_RULES}}` using `scripts/lib/gov.sh`
- Auto-injects TASKS, REQUIREMENTS, ARCHITECTURE into both PLANNER and IMPLEMENTER
- Auto-injects DESIGN and WIREFRAMES into PLANNER only
- Leaves IMPLEMENTER's source context as `[PASTE RELEVANT SOURCE FILES]` for manual fill
- Writes `.tmp/PLANNER.md`, `.tmp/IMPLEMENTER.md`, `.tmp/REVIEWER.md`
- Run `aitk gov sync` first when switching stacks

`aitk gov build` generates a standalone rules file at `.cursor/.tmp/rules.md` using the same underlying functions from `scripts/lib/gov.sh`. Paste it directly into any AI chat without running the full prompt flow.

## Core implementation loop

```plaintext
┌─────────────────────────────────────────────────────┐
│  SESSION START (new chat tab)                        │
│  1. `aitk claude prompt`     (generates .tmp/ files) │
│  2. Paste .tmp/PLANNER.md    (always, paste first)   │
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
│  1. `aitk claude prompt`                             │
│  2. Paste source files into `.tmp/IMPLEMENTER.md`    │
│  3. Paste final prompt into Gemini pro chat          │
│  → responds with plan restatement + complete files   │
│  → may include COMMANDS section with install steps   │
└──────────────────────┬──────────────────────────────┘
                       │ copy full response
                       ▼
┌─────────────────────────────────────────────────────┐
│  REVIEW                                              │
│  → /dev:review [paste Gemini response]               │
│  → findings report (critical / should-fix / minor)  │
│  Fallback: use REVIEWER.md in a fresh browser tab    │
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

## Tool mapping summary

| Stage                   | Tool              | Command / Note                                                                                |
| ----------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| Scaffold .claude/       | aitk claude       | `aitk claude init` — seed .claude/ docs and sync .gitignore                                   |
| Sync managed prompts    | aitk claude       | `aitk claude sync` — sync managed role prompts, overwriting local changes                     |
| Planning (all docs)     | Claude chat       | Paste `.tmp/PLANNER.md`; context is pre-injected                                              |
| Generate master prompts | aitk claude       | `aitk claude prompt` — injects context into PLANNER and IMPLEMENTER, copies REVIEWER to .tmp/ |
| Build standalone rules  | aitk gov          | `aitk gov build` — concatenate rules into .cursor/.tmp/rules.md for direct paste              |
| Code generation         | Gemini pro chat   | Paste .tmp/IMPLEMENTER.md, fill SOURCE with relevant files                                    |
| Apply file changes      | Gemini CLI        | `/dev:apply` — file writer only, no planning                                                  |
| Feature review          | Gemini CLI        | `/dev:review` — paste Gemini response; outputs findings report                                |
| Code commenting         | Gemini CLI        | `/dev:comment` — Add comments to source code                                                  |
| Doc sync                | Gemini CLI        | `/docs:sync` — Update documentation based on code changes                                     |
| Review (fallback)       | Fresh Gemini chat | Copy REVIEWER.md template, paste full Gemini response into [PASTE GEMINI RESPONSE]            |
| Fix findings            | Gemini chat       | Paste critical/should-fix back into original session                                          |
| Lint / format / tests   | bun scripts       | `bun run check`                                                                               |
| Escalate design issues  | Claude chat       | Paste error + relevant plan context                                                           |
| Branch naming           | Gemini CLI        | `/git:branch` — Generate a branch name from commits or intent                                 |
| Branch splitting        | Gemini CLI        | `/git:split` — Split mixed commits into focused branches                                      |
| Staged file grouping    | Gemini CLI        | `/git:stage` — Group staged files by concern                                                  |
| Commit message          | Gemini CLI        | `/git:commit`                                                                                 |
| PR description          | Gemini CLI        | `/git:pr`                                                                                     |
| Changelog               | Gemini CLI        | `/release:changelog`                                                                          |
| Install gov rules       | aitk              | `aitk gov install [stack] [path]`                                                             |
| Sync gov rules          | aitk              | `aitk gov sync [path]`                                                                        |
| Build rules payload     | aitk              | `aitk gov build [path]`                                                                       |
| Install standards       | aitk              | `aitk standards install [path]`                                                               |
| Sync standards          | aitk              | `aitk standards sync [path]`                                                                  |

> Gov rules apply to code generation and fix failures only.
