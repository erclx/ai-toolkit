# Design

Authoring guidance: `standards/design.md`.

This document is rendered from `src/design/tokens.ts` by `canon design regen`, and the `design` stage of `bun run check` fails when the two disagree. Edit the module, never this file.

The values below are the system rather than a reading of one. Until 2026-09-01 this record transcribed two surfaces and agreed with nothing else, which is what made a change to it reach nobody. The slide theme, the token preview, and a teach workspace stylesheet now read the module this file is rendered from, so a value changed there changes what all three render.

Two surfaces still carry their own copies. The rendered hero at `assets/hero.html` is written by `scripts/core/regen-hero.sh` against a committed capture, and the terminal framing in `scripts/lib/ui.sh` and `src/ui.ts` writes ANSI rather than hex. The dark half below is the palette the hero carries, so the two agree today by value and not yet by construction.

## Personality

Warm neutrals carry the frame under a single rust accent, rendered in the same monospace the terminal uses. The subject picks the register rather than taste: a toolkit whose primary surface is a shell has no proportional voice available, so the rendered surfaces match the terminal instead of the reverse. One accent carries every count, link, and primary action. Promoting a second and third into structural roles is what reads as a generated interface, so the palette stays at one.

## Color

Every role clears WCAG AA at 4.5:1 against each ground it declares, asserted in `src/design/contrast.test.ts`. Two corrections landed with this record becoming the source. The light `muted` step moved from `#7A736A`, which read 4.38 and 4.09 against the two light grounds, and the dark `accent` moved off the `#C8602E` the slide theme carried, which read 4.36 and 3.99 against the two dark ones. Both now sit on the values below.

Success, warning, and error hold ANSI codes because that is what `scripts/lib/ui.sh` writes, and no rendered surface implements an equivalent. Giving them a hex value would invent a mapping no file has, so they carry no contrast reading either.

| Role             | Intent                                | Value            |
| ---------------- | ------------------------------------- | ---------------- |
| background       | page canvas                           | #191512          |
| surface          | cards, panels, raised blocks          | #211c19          |
| border           | every rule and panel edge             | #2f2823          |
| text             | headings, counts, emphasized runs     | #f4efe9          |
| text-body        | default body copy                     | #c9c0b7          |
| text-secondary   | labels, captions, supporting copy     | #a79d94          |
| muted            | the faintest step, trailing notes     | #948a81          |
| accent           | install command, mark, primary action | #e0724b          |
| success          | terminal confirmations                | ANSI 32          |
| warning          | terminal cautions                     | ANSI 33          |
| error            | terminal failures                     | ANSI 31          |
| light-background | page canvas on a light ground         | #faf7f2          |
| light-surface    | cards and panels on a light ground    | #f4efe6          |
| light-text       | primary text on a light ground        | #1a1815          |
| light-muted      | secondary text on a light ground      | #726b62          |
| light-accent     | links and primary action on light     | #a4471c          |
| light-border     | rules and panel edges on light        | #e4dcd0 ? verify |

## Typography

One family covers every role. The size scale runs from 11.5 to 34 pixels across ten values, and five of them map onto a role. The other five are adjustments inside a single component and get no role here, since a scale with five invented steps reads as a system the surfaces do not implement. They are 11.5, 12.5, 13, 14, and 15 pixels.

A tagged cell is one no rendering surface exercises yet, which is a declaration the system has not tested rather than one it has.

Two rules set tracking and no others touch it. The label role carries `0.05em`, and the display role tightens to `-0.01em`.

| Role    | Family                                      | Weight       | Size   | Line height   |
| ------- | ------------------------------------------- | ------------ | ------ | ------------- |
| display | Noto Sans Mono, DejaVu Sans Mono, monospace | 700          | 34px   | 1.3           |
| heading | Noto Sans Mono, DejaVu Sans Mono, monospace | 700          | 19px   | 1.3 ? verify  |
| body    | Noto Sans Mono, DejaVu Sans Mono, monospace | 400 ? verify | 16px   | 1.65          |
| label   | Noto Sans Mono, DejaVu Sans Mono, monospace | 400 ? verify | 12px   | 1.45 ? verify |
| code    | Noto Sans Mono, DejaVu Sans Mono, monospace | 700          | 14.5px | 1.3 ? verify  |

## Spacing

The base is six pixels, which is the largest unit dividing the values that recur: 6, 12, 18, 24, and 30. One-off paddings at 9, 10, 11, 13, 14, 16, 22, 26, 34, and 40 pixels sit off the scale entirely and get no step.

The outer window padding is a single declaration reading `44px 52px 38px`, and none of its three values divides by six. They carry no multiplier for that reason, and one declaration setting all three is the only thing grouping them, so they are a frame register rather than a scale.

| Step         | Multiplier | Value |
| ------------ | ---------- | ----- |
| xs           | 1          | 6px   |
| sm           | 2          | 12px  |
| md           | 3          | 18px  |
| lg           | 4          | 24px  |
| xl           | 5          | 30px  |
| frame-top    | none       | 44px  |
| frame-inline | none       | 52px  |
| frame-bottom | none       | 38px  |

## Borders

Every border is one pixel solid at the `border` role, and that value appears in no text role. Three radii appear, and the two blocks carrying the largest and smallest have no border at all, so radius and width are independent here rather than paired. Nothing renders a pill, so both of its cells stay tagged.

| Role   | Radius         | Width         | When used                         |
| ------ | -------------- | ------------- | --------------------------------- |
| frame  | 12px           | none          | the outer window, radius only     |
| panel  | 10px           | 1px           | cards and columns                 |
| action | 7px            | none          | the install command block         |
| rule   | none           | 1px           | horizontal dividers between bands |
| pill   | 999px ? verify | none ? verify | tags and status chips, none built |
| marker | 999px          | none          | the status dot, sized at 6px      |

## Motion

Motion is not used. No transition, animation, or keyframe declaration appears on any rendered surface, and the capture pipeline screenshots a static frame.

## Iconography

No icon library is installed. The surfaces draw literal glyph characters, `✦` for the hero mark and `│ ├ ✓ ! ✗ + - ◆ ◇ ❯` for the terminal framing, and a custom icon has no place to load from.
