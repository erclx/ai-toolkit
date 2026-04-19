# Design

Capture visual intent and the decisions behind it: the why behind how things look. Not a style guide, component spec, or framework reference. Update this doc when a visual decision is made or a rule changes.

What belongs:

- Tokens described as intent ("mid gray, muted text"), not computed values. Exact values live in code.
- Layout constraints and sizing rules not obvious from wireframes
- Visual rules a developer could get wrong without guidance
- Non-obvious omissions ("no motion", "no custom icons") that prevent scope creep

What does not belong:

- CSS classes, computed values, component filenames, and prop names. Those live in code.
- UX copy and interaction flows, which live in WIREFRAMES.md
- Anything that requires updating every time the code is refactored

Use tables for token systems, one row per token. Use short bullets for component rules, one decision per line. Plain English over technical notation. If a section could be removed and the developer would still build it correctly from wireframes and code alone, remove it.

The `aitk design render` command reads the tables below and writes an HTML plus CSS preview to `.claude/review/design/`. Keep table headers and role names intact so the parser can find them.

## Personality

One paragraph. Voice, tone, and the feeling a user should have. The same content a design intake form asks for.

## Color

One row per role. Intent is a short phrase a human can picture. Value is a hex or a named system token.

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

One row per role. Size and line height in pixels or rem. Family names use their product casing.

| Role    | Family | Weight | Size | Line height |
| ------- | ------ | ------ | ---- | ----------- |
| display |        |        |      |             |
| heading |        |        |      |             |
| body    |        |        |      |             |
| label   |        |        |      |             |
| code    |        |        |      |             |

## Spacing

Base unit and scale. The renderer draws a swatch per step.

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

One line. State whether motion is used at all, and if so, the default duration and easing.

## Iconography

One line. Style (outline, filled, duotone), source library, and whether custom icons are allowed.
