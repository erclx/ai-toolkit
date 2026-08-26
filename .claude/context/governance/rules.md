---
title: Rules
description: The numbering bands and their two sources, the frontmatter contract, how Claude Code loads a rule, adding one, and rules a target authors itself
---

# Rules

A rule is a `.md` file carrying the Claude shape directly, so nothing generates it and install is a passthrough copy. Rules sit in subdirectories by domain and install preserves that layout, since a flat folder would leave the numbering bands as the only grouping signal.

What earns a rule in the first place, and which standard each one routes to, is `.claude/context/governance/routing.md`.

## Numbering bands

Rules follow a numbering scheme by band, so a new rule's number states its domain without opening it.

| Range     | Domain                                                                                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `000–099` | core (constitution, testing, error handling, planning, etc.)                                                                                                                      |
| `100–199` | lang (TypeScript, Python, etc.)                                                                                                                                                   |
| `200–299` | framework (React, Tailwind, FastAPI, etc.)                                                                                                                                        |
| `300–399` | lib (testing libs, Zod, Pydantic, security, etc.)                                                                                                                                 |
| `400–499` | ui (UI copy, accessibility, forms, UX completeness, surface capture, link behavior)                                                                                               |
| `500–599` | claude (markdown prose, markdown mechanics, .claude/ context, wireframe, canonical-doc, task-board, learning workspace, session map, skill, readme, rule, and standard authoring) |

### Two sources numbering into one folder

`internal/rules/` takes the top of a band and `governance/rules/` takes the gaps between the tens, so the two sources cannot collide silently. The core band is already full at every ten, which is what forces the split rather than leaving it to convention.

`standards/rule.md` states the division as a rule an authoring session reads, since a target project splitting its own rules against an installed set faces the same collision. Nothing checks it in either place.

### What the number supplies

The leading digit restates the folder in every rule, so what the number uniquely supplies is read order rather than routing. Nothing precedence-orders rules at load, which is why the band-to-folder mapping was left alone when folder entries landed. Renumbering would reach every installed target and buy nothing.

## Frontmatter contract

Path-scoped rules emit a `paths:` list, one entry per glob:

```yaml
---
description: Enforce strict Python type hints, casing, and import patterns
paths:
  - '**/*.py'
---
```

Always-on rules such as the core persona, testing, and error handling emit with no `paths:` key. The legacy Cursor schema of `globs`, `alwaysApply`, and `priority` is not consumed and must not appear in source.

## How Claude Code loads rules

`.claude/rules/*.md` discovers recursively at session start. Rules without a `paths:` field always apply, with the same priority as `CLAUDE.md`. Rules with `paths:` apply when Claude reads files matching the glob. See `wiki/claude/claude-memory.md` for the loading-time details.

## Gotchas

- A widened source rule fails `bun run check` until the copy is committed. The regen propagates the change and the drift assertion turns the resulting diff into a failure. A rule matching nothing still does not error, so the gate catches the stale copy rather than the dead glob.
- A rule authored under `governance/rules/` in a folder no stack names installs for nobody through `aitk gov install`. `.claude/context/governance/stacks.md` covers which folders close that and which do not. `governance/rules/snippets/` is the one folder that reaches a target anyway, through `aitk snippets install` rather than through a stack, which is what lets its rule stay off `base`'s folder-whole entry and still arrive only alongside the domain it describes. See `.claude/context/snippets.md`.
- Adding a rule stales a hardcoded count in two entries nothing gates. `.claude/context/development/regeneration.md` states how many rules the toolkit authors and consumes, and `.claude/context/sandbox/authoring.md` states the authored total beside what `base` resolves to. The Hero stage in `scripts/core/verify.sh` gates the count on the README frame and reaches neither of these, so both had drifted by 10 and 8 when they were re-measured on 2026-08-13 at 48 authored, 30 consumed, and 28 resolved by `base`. Re-measure both when a rule lands.

- `core/070-planning.md` is the only rule naming an `aitk` verb, which puts it on the wrong side of the two-speed gap `.claude/ARCHITECTURE.md` records. A rule reaches a target the moment an install copies it, while the verb it names reaches that target only once a release publishes, so a project on an older CLI reads an instruction its binary refuses. A rule citing a verb therefore owes the same release wait a skill body does, and nothing detects the skew.

A rule that publishes a heading some command parses is program input, so adding one is a code change and the reading command runs against the tree before the commit. `src/comments/vocabulary.ts` reads its terms out of whichever rule publishes `## Degradation vocabulary`, so `governance/rules/core/090-code-comments.md` turned a sweep that had only ever reported skipped into one returning six hits, four of them against the matcher's own doc comment naming the terms it matches. Grep for a reader of the heading or filename before writing the rule, and read every hit before treating any as a defect.

A `description` carrying a bare word, a colon, and a space breaks `Bun.YAML.parse` in `parseFrontmatter`, since YAML reads that shape as a nested mapping key rather than plain scalar text. The failure surfaces far from the cause: `aitk gov list --json` throws a stack trace pointing at `src/indexes/frontmatter.ts` rather than naming the rule file, and the Hero stage that depends on that catalog fails in turn with no mention of a colon. Rephrase the description to avoid the pattern rather than quoting it, since the frontmatter examples elsewhere in this repository are unquoted.

`claude/511-indexes.md` globs `**/index.md`, the first rule reaching every folder in the tree rather than one named folder's contents. `core/065-spelling.md` globs `.cspell/**`, the first rule reaching a folder outside `.claude/` or a project's own source, since the dictionaries four stacks seed there had been governed by prose in the always-loaded file rather than by any rule.

## Adding a rule

Create a `.md` file anywhere under `governance/rules/` using the numbering convention above. It is auto-discovered with no other changes needed.

Whether it reaches anyone depends on the stack roster rather than on the file. A rule added to `core/` or `claude/` reaches every `base` consumer with no stack edit, and a rule in any other folder needs its name in the relevant `governance/stacks/*.toml`. See `.claude/context/governance/stacks.md` for both cases and for the stage that reports the gap.

Glob the rule against every ecosystem it governs rather than only the one its stack serves, since `--add` layers a rule onto a stack that never names it. `360-security-server` and `370-database` sit on `python` alone and glob `**/*.py` beside `**/*.ts` and `**/*.js`, so a Node API project pulls either one in and the globs already match. A glob narrowed to the naming stack's language installs a rule that matches nothing in that case.

## Project-local rules

Target projects author their own rules that the toolkit does not ship. The `create-rule` plugin skill scaffolds one into `.claude/rules/project/<subdir>/<n>-<slug>.md` with the Claude frontmatter shape, picking a free number in the band that collides with neither the project nor the toolkit catalog.

These rules live only in the target. `aitk gov sync` skips any rule with no toolkit source match, classified as `orphaned` by `planSync` in `src/sync/engine.ts`. A rule under `.claude/rules/project/`, which is where `create-rule` writes, is orphaned by location instead, since the gov adapter declares that subfolder on `SyncAdapter`, so it survives sync even if a later toolkit rule takes the same name. Numbering bands still avoid the toolkit catalog by convention, since a band sharing a number across the two trees reads as a coincidence rather than a collision, but nothing enforces it any more.
