# Workflow Documents Reference

A concise overview of all documents in the dev workflow, with placeholders and tool mappings.

> **Session note:** "Session start" = opening a new chat tab (new context window). New message in the same chat = no re-orientation needed. New chat tab = paste in this order: `SESSION.md` → `TASKS.md` → `PROJECT.md` → active feature context. Add `REQUIREMENTS.md` + `ARCHITECTURE.md` only when starting a brand new feature.

## File Location

All planning docs live in `.claude/` at the project root. Git tracked, part of the project, not throwaway notes.

> **Setup:** Run `gdev claude init` in a new project to generate this structure automatically.

```
.claude/
├── SESSION.md           ← session system prompt, paste first always
├── REQUIREMENTS.md
├── ARCHITECTURE.md
├── TASKS.md
└── PROJECT.md           ← ASCII tree only, auto-generated, gitignored
```

## 1. `SESSION.md` — Session System Prompt

> Created with: **Claude chat**, once per project. Paste this first every session.

```md
# Claude: [Project Name]

## Role

Senior engineer helping plan, track and debug this project. Concise and direct. No fluff.

## Sync

After any response that produces updated document content, end with a sync block:

SYNC REQUIRED
□ .claude/TASKS.md — updated above, copy and overwrite
□ .claude/[other-file].md — updated above, copy and overwrite

List only files that actually changed. Order by priority (TASKS.md first).
Sync after each completed feature, not end of session.

## Output

- Output full updated file content only — no explanation around it.
- Use the `present_files` tool for any file output — never write file contents inline into chat.

## Planning

- Clarify before planning. Use the `ask_user_input` tool — never prose questions.
- Before modifying existing behavior, request relevant src files first.
- For any feature with UI, generate ASCII wireframes before the todo list — layout and component hierarchy only, no decoration.
- For every feature todo list, state test strategy explicitly: unit, integration, e2e, or none. Justify in one word.
- Never offer to implement. Planning ends at synced docs; implementation happens in Gemini.

## Debug

- Diagnose fast, suggest fix, skip re-explaining the project.

## Session Context

[Fill in each session — e.g. "working on Feature C, verify failing with X error"]
```

## 2. `REQUIREMENTS.md` — Project Overview

> Created with: **Claude chat**

```md
# [Project Name]

## Problem

[One paragraph: what problem this solves and for who]

## Goals

- [Goal 1]
- [Goal 2]

## Non-Goals

- [What this explicitly does NOT do]

## MVP Features (must have)

- [ ] Feature A
- [ ] Feature B
- [ ] Feature C

## Nice to Have (post-MVP)

- [ ] Feature D
- [ ] Feature E

## Tech Stack

- [Frontend / Extension / CLI / etc]
- [Language, framework]
- [Key libs]

## Constraints

- [e.g. no backend, local storage only, must work on X]
```

## 3. `ARCHITECTURE.md` — Technical Design

> Created with: **Claude chat**. One-time spike before writing any code.

```md
# Architecture: [Project Name]

## Overview

[One paragraph describing the system]

## Structure

[Folder/module breakdown]
src/
├── [module-a]/ ← [what it does]
├── [module-b]/ ← [what it does]
└── [entry]

## Key Technical Decisions

- **[Decision 1]:** [chosen approach] — because [reason]
- **[Decision 2]:** [chosen approach] — because [reason]

## Risks / Open Questions

- [ ] [Risk or unknown that needs validation]
- [ ] [Tricky integration to prototype early]
```

## 4. `TASKS.md` — Persistent Task Tracker

> Created with: **Claude chat**, updated manually or via Claude each session. Source of truth for what's done, in progress, and blocked.

```md
# Tasks: [Project Name]

## In Progress

- [ ] Feature B — [brief note on current status]

## Up Next

- [ ] Feature C
- [ ] Feature D

## Done

- [x] Feature A
- [x] Project setup

## Blocked

- [ ] Feature E — waiting on [reason]
```

## 5. The Core Implementation Loop

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
│ Paste error back │    │ Mark todos done in TASKS.md   │
│ into Gemini chat │    │ Update TASKS.md               │
│ (same session,   │    │ → /git:commit                 │
│ it has context)  │    │ → /git:pr                     │
│                  │    │ Next feature                  │
│ If design issue  │    └──────────────────────────────┘
│ escalate to      │
│ Claude chat      │
└──────────────────┘

Feedback routing rule:
  verify fails  → Gemini chat (code problem, it has context)
  design fails  → Claude chat (planning problem)

Note: Gemini CLI is a file writer only via /dev:apply.
      All planning stays in Claude chat.
      All code generation stays in Gemini pro chat.
```

## 6. `CHANGELOG.md` — Release Notes

> Generated with: **/release:changelog** Gemini command

```md
# Changelog

## [version] — YYYY-MM-DD

### Added

- [Feature A]

### Fixed

- [Bug fix]

### Changed

- [Behavior change]
```

## Document Creation Order

```
0. SESSION.md            ← Claude chat, once per project, paste first always
1. REQUIREMENTS.md       ← Claude chat, before anything
2. ARCHITECTURE.md       ← Claude chat, before any code
3. TASKS.md              ← Claude chat, derived from requirements
4. PROJECT.md            ← bun run snapshot, ASCII tree only, regenerate when structure changes
5. Implementation loop   ← Gemini chat generates, /dev:apply writes files only
6. CHANGELOG.md          ← /release:changelog after features done
```

## Tool Mapping Summary

| Stage                   | Tool                 | Gov rules? | Command / Note                                      |
| ----------------------- | -------------------- | ---------- | --------------------------------------------------- |
| Scaffold .claude/       | gdev                 | —          | `gdev claude init`                                  |
| Project snapshot        | bun script           | —          | `bun run snapshot` — ASCII tree only, gitignored    |
| Session orientation     | Claude chat          | No         | Paste SESSION.md first, every session               |
| Requirements & planning | Claude chat          | No         | —                                                   |
| Architecture design     | Claude chat          | No         | —                                                   |
| Task tracking           | Claude chat + manual | No         | Paste TASKS.md every session after SESSION.md       |
| Feature planning        | Claude chat          | No         | New feature: also paste REQUIREMENTS + ARCHITECTURE |
| Code generation         | Gemini pro chat      | Yes        | Master prompt via `gdev prompt`                     |
| Apply file changes      | Gemini CLI           | No         | `/dev:apply` — file writer only, no planning        |
| Lint / format / tests   | bun scripts          | —          | `bun run check`                                     |
| Fix failures            | Gemini chat          | Yes        | Paste error in same session                         |
| Escalate design issues  | Claude chat          | No         | Paste error + relevant plan context                 |
| Commit message          | Gemini CLI command   | —          | `/git:commit`                                       |
| PR description          | Gemini CLI command   | —          | `/git:pr`                                           |
| Changelog               | Gemini CLI command   | —          | `/release:changelog`                                |
| Prompt generation       | gdev                 | —          | `gdev prompt`                                       |
| Gov sync to project     | gdev                 | —          | `gdev gov sync [path]`                              |
