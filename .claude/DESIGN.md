# Design

Authoring guidance: `standards/design.md`.

Every value here is read off a surface that ships. Where a cell carries `? verify`, no source anchors it, so a reader may overturn it without checking anything. An untagged cell is a claim this record makes about a file, and `assets/hero.html` anchors most of them.

Five surfaces render something and none of them reads this file. The rendered hero at `assets/hero.html`, the slide theme at `src/slides/styles.ts`, the token preview at `src/design/render.ts`, the terminal framing in `scripts/lib/ui.sh` and `src/ui.ts`, and the capture pipeline at `scripts/core/regen-hero.sh` each carry their own values. All five stay independent. Naming a consumer would record an intention rather than a fact, and nothing reads a shared source today.

No two of them agree on a value. The slide theme carries a dark set of `1A1815`, `23201C`, `F4EFE6`, `A39C92`, and `C8602E` against the hero's `#191512`, `#211c19`, `#f4efe9`, `#a79d94`, and `#e0724b`, which is the closest pairing in the tree and reconciles on none of its five roles. The nearest miss is the primary text step, where the two differ in the last digit alone and read as a match on a quick scan. Arial and Calibri drive the slides where every other surface is monospace, so the single-family rule below describes the hero and the terminal rather than the whole tree.

## Personality

Warm neutrals carry the frame under a single rust accent, rendered in the same monospace the terminal uses. The subject picks the register rather than taste: a toolkit whose primary surface is a shell has no proportional voice available, so the rendered surfaces match the terminal instead of the reverse. One accent carries every count, link, and primary action. Promoting a second and third into structural roles is what reads as a generated interface, so the palette stays at one.

## Color

The dark set is read off `assets/hero.html`, and the light set off the `LIGHT` theme in `src/slides/styles.ts`, which is the only light palette in the tree. Both halves therefore come from surfaces that share a warm-neutral register and reconcile on no value, so the light half sits here because a surface ships it rather than because it follows from the dark half. No surface carries a `prefers-color-scheme` query, and nothing switches between the two at runtime.

Success, warning, and error hold ANSI codes because that is what `scripts/lib/ui.sh` writes, and no rendered surface implements an equivalent. Giving them a hex value would invent a mapping no file has.

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
| light-background | page canvas on a light ground         | #FAF7F2          |
| light-surface    | cards and panels on a light ground    | #F4EFE6          |
| light-text       | primary text on a light ground        | #1A1815          |
| light-muted      | secondary text on a light ground      | #7A736A          |
| light-accent     | links and primary action on light     | #A4471C          |
| light-border     | rules and panel edges on light        | #E4DCD0 ? verify |

The light set has no border value because the slide theme draws no rules. That one cell is the only proposal in the palette.

## Typography

One family covers every role on the hero and the terminal. The size scale runs from 11.5 to 34 pixels across ten values, and five of them map onto a role. The other five are adjustments inside a single component and get no role here, since a scale with five invented steps reads as a system the surfaces do not implement. They are 11.5, 12.5, 13, 14, and 15 pixels.

The hero sets line height on three declarations and leaves it to the browser everywhere else. Two of the three sit on roles this table carries, and the third sits on a 12.5px component the size scale excludes, which is why three of the five rows still carry a tagged value. Weight follows the same pattern, with `700` written where it applies and the rows without it falling to the browser default.

| Role    | Family                                      | Weight       | Size   | Line height   |
| ------- | ------------------------------------------- | ------------ | ------ | ------------- |
| display | Noto Sans Mono, DejaVu Sans Mono, monospace | 700          | 34px   | 1.3           |
| heading | Noto Sans Mono, DejaVu Sans Mono, monospace | 700          | 19px   | 1.3 ? verify  |
| body    | Noto Sans Mono, DejaVu Sans Mono, monospace | 400 ? verify | 16px   | 1.65          |
| label   | Noto Sans Mono, DejaVu Sans Mono, monospace | 400 ? verify | 12px   | 1.45 ? verify |
| code    | Noto Sans Mono, DejaVu Sans Mono, monospace | 700          | 14.5px | 1.3 ? verify  |

Two rules set tracking and no others touch it. The label role carries `0.05em`, and the display role tightens to `-0.01em`.

## Spacing

The base is inferred and not declared anywhere. Six pixels is the largest unit dividing the values that recur, which are 6, 12, 18, 24, and 30. A record calling six the base without that qualification would overstate what the source supports. One-off paddings at 9, 10, 11, 13, 14, 16, 22, 26, 34, and 40 pixels sit off the scale entirely.

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

Every border in the source is one pixel solid `#2f2823`, and that value appears in no text role. Three radii appear, and the two blocks carrying the largest and smallest have no border at all, so radius and width are independent here rather than paired. Nothing in the source is a pill, so that role has no anchor and both of its cells are proposals.

| Role   | Radius         | Width         | When used                         |
| ------ | -------------- | ------------- | --------------------------------- |
| frame  | 12px           | none          | the outer window, radius only     |
| panel  | 10px           | 1px #2f2823   | cards and columns                 |
| action | 7px            | none          | the install command block         |
| rule   | none           | 1px #2f2823   | horizontal dividers between bands |
| pill   | 999px ? verify | none ? verify | tags and status chips, none built |

## Motion

Motion is not used. No transition, animation, or keyframe declaration appears on any rendered surface, and the capture pipeline screenshots a static frame.

## Iconography

No icon library is installed. The surfaces draw literal glyph characters, `✦` for the hero mark and `│ ├ ✓ ! ✗ + - ◆ ◇ ❯` for the terminal framing, and a custom icon has no place to load from.
