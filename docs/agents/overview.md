---
title: Overview
description: What this folder covers, the invocation rules every command inherits, and where domain behavior is documented instead
---

# Overview

CLI catalog and invocation rules for agents working in this repository.

This folder is an index of what an agent can run and how to run it cleanly from a script. It does not cover domain behavior. Read `CLAUDE.md` for project behaviors and load the matching `.claude/skills/internal-*` skill when working inside a domain.

## Invocation rules

See `CLAUDE.md` design principles. They apply to every command in this folder.

## Where to start

- `output-shape.md`: the stream contract every command renders into and the exit discipline behind it, which is what a caller parsing stdout depends on
- `commands.md`: the full command catalog, project-level and per-domain
- `scripting.md`: the runtime catalogs that replace hardcoded names, plus headless invocation examples

## Related

- `CLAUDE.md`: project behaviors and design principles
- `.claude/skills/internal-*`: domain-scoped guidance for editing work
- `docs/index.md`: full docs directory
