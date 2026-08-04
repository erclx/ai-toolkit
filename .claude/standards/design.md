---
title: Design reference
description: Shape and content rules for .claude/DESIGN.md
---

# Design reference

Applies to `.claude/DESIGN.md`. Captures visual intent and the decisions behind how things look, not a style guide, component spec, or framework reference. Update when a visual decision is made or a rule changes.

## Scope

Governs the visual-intent document at `.claude/DESIGN.md`: tokens described as intent, layout constraints, and the omissions that keep visual scope closed.

Does not govern:

- Screen layout, on-screen copy, and interaction intent: `wireframes.md`
- Per-domain implementation narrative: `context.md`

## What goes in

- Tokens described as intent ("mid gray, muted text"), not computed values. Exact values live in code.
- Layout constraints and sizing rules not obvious from wireframes
- Visual rules a developer could get wrong without guidance
- Non-obvious omissions ("no motion", "no custom icons") that prevent scope creep

## What does not go in

- CSS classes, computed values, component filenames, and prop names. Those live in code.
- Anything that needs updating every time the code is refactored

## Format

- Use tables for token systems, one row per token. Use short bullets for component rules, one decision per line.
- Plain English over technical notation. If a section could be removed and the developer would still build correctly from wireframes and code alone, remove it.
- Keep table headers and role names intact so the render tooling can parse the token tables.

## Sections

Use `## Personality`, `## Color`, `## Typography`, `## Spacing`, `## Borders`, `## Motion`, and `## Iconography`. The token tables carry fixed headers the renderer reads.

## Template

Column headers and role names are the strings the renderer parses. Change a value, add a row, or drop a row the project has no use for, and leave the headers as they are.

```markdown
# Design

## Personality

<one paragraph on voice, tone, and the feeling a user should have>

## Color

| Role       | Intent                        | Value |
| ---------- | ----------------------------- | ----- |
| background | page canvas                   |       |
| surface    | cards, panels, raised blocks  |       |
| text       | primary body text             |       |
| muted      | secondary text, captions      |       |
| accent     | links, primary action         |       |
| success    | confirmations, positive state |       |
| warning    | cautions, pending state       |       |
| error      | failures, destructive action  |       |

## Typography

| Role    | Family | Weight | Size | Line height |
| ------- | ------ | ------ | ---- | ----------- |
| display |        |        |      |             |
| heading |        |        |      |             |
| body    |        |        |      |             |
| label   |        |        |      |             |
| code    |        |        |      |             |

## Spacing

| Step | Multiplier | Value |
| ---- | ---------- | ----- |
| xs   | 0.5        |       |
| sm   | 1          |       |
| md   | 2          |       |
| lg   | 3          |       |
| xl   | 5          |       |

## Borders

| Role    | Radius | Width | When used             |
| ------- | ------ | ----- | --------------------- |
| default |        |       | cards, inputs         |
| pill    |        |       | tags, status chips    |
| none    | 0      | 0     | edge-to-edge surfaces |

## Motion

<whether motion is used at all, and if so the default duration and easing>

## Iconography

<style, source library, and whether custom icons are allowed>
```
