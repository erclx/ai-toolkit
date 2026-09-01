# Project

[One-line description]

## Context

- Before non-trivial work in a domain read `.claude/context/<domain>.md`, and before touching a UI surface read `.claude/wireframes/<surface>.md`. Pick which from the index anchors below.

@.claude/REQUIREMENTS.md
@.claude/ARCHITECTURE.md
@.claude/context/index.md
@.claude/wireframes/index.md

## Commands

- These conventions came from a toolkit with its own CLI. A rule or standard naming a command is naming that CLI, present only where this project installed it.
- [Command to run before committing]. Full script reference in the development entry under `.claude/context/`.

## Key paths

- `src/`: [description]
- `.claude/`: planning docs (requirements, architecture, design, tasks)
- `.claude/context/`: per-domain narrative (how a domain is structured, decisions, gotchas), indexed via `.claude/context/index.md`
- `.claude/wireframes/`: per-surface ASCII layouts loaded on demand, indexed via `.claude/wireframes/index.md`
