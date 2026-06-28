---
title: Requirements reference
description: Shape and content rules for .claude/REQUIREMENTS.md
---

# Requirements reference

Applies to `.claude/REQUIREMENTS.md`. Describes what the product does and why, not how it works. Update when scope changes, goals shift, or a non-goal is promoted to a feature.

## What goes in

- The problem being solved and for whom
- User-facing goals stated as outcomes, not implementation
- Explicit non-goals that prevent feature creep. Mark deferred items "(deferred)" so they read as paused, not excluded.
- MVP features as a numbered list: feature name and one-line description
- Tech stack as a plain list of tools
- Hard constraints that shape every decision

## What does not go in

- Implementation details, API names, or internal component references
- Rationale for tech choices. That belongs in `.claude/ARCHITECTURE.md`.
- Anything that describes how a feature is built rather than what it does

## Sections

Use `## Problem`, `## Goals`, `## Non-goals`, `## MVP features`, `## Tech stack`, and `## Constraints`. Drop a section rather than pad it with filler.

## Template

```markdown
# Requirements

## Problem

## Goals

## Non-goals

## MVP features

1. Feature: description

## Tech stack

## Constraints
```
