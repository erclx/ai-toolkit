---
title: Architecture reference
description: Shape and content rules for .claude/ARCHITECTURE.md
---

# Architecture reference

Applies to `.claude/ARCHITECTURE.md`. Describes the system shape and the decisions behind it, not a tutorial, setup guide, or implementation walkthrough. Pair it with `CLAUDE.md`: principles live there, patterns and decisions live here. Update when a decision is made or a risk is resolved.

## Scope

Governs the system-shape document at `.claude/ARCHITECTURE.md`: the overview, the decision entries, and the open risks.

Does not govern:

- Per-domain structure and narrative: `context.md`
- Setup commands and install instructions: `readme.md`
- Product scope, goals, and non-goals: `requirements.md`

## What goes in

- A high-level overview of how the system is structured and why
- Key technical decisions as named H3 entries: what was chosen and why over the alternatives, including stack and library choices
- Risks and open questions still unresolved

## What does not go in

- How individual functions work line by line. The code carries its own behavior.
- Full type definitions. They live in code. Reference the shape conceptually if needed.

## Sections

Use `## Overview`, `## Key technical decisions` with one named H3 per decision, and `## Risks / open questions`. Name each decision and give the reasoning, especially for non-obvious choices. Skip entries where the rationale is self-evident.

## Template

```markdown
# Architecture

## Overview

## Key technical decisions

### Decision name

Reasoning and tradeoffs.

## Risks / open questions
```
