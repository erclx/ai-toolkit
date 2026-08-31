---
title: Rules
description: The numbering bands and their two sources, the frontmatter contract, how Claude Code loads a rule, adding one, and rules a target authors itself
---

# Rules

A rule is a `.md` file carrying the Claude shape directly, so nothing generates it and install is a passthrough copy. Rules sit in subdirectories by domain and install preserves that layout, since a flat folder would leave the numbering bands as the only grouping signal.

What earns a rule in the first place, and which standard each one routes to, is `.claude/context/governance/routing.md`.

## Numbering bands

Rules follow a numbering scheme by band, so a new rule's number states its domain without opening it.

| Range     | Domain                                                                                                                                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `000–099` | core (constitution, testing, error handling, planning, etc.)                                                                                                                                                                      |
| `100–199` | lang (TypeScript, Python, etc.)                                                                                                                                                                                                   |
| `200–299` | framework (React, Tailwind, FastAPI, etc.)                                                                                                                                                                                        |
| `300–399` | lib (testing libs, Zod, Pydantic, security, etc.)                                                                                                                                                                                 |
| `400–499` | ui (UI copy, accessibility, forms, UX completeness, surface capture, link behavior)                                                                                                                                               |
| `500–599` | claude and snippets (markdown prose, markdown mechanics, .claude/ context, wireframe, canonical-doc, task-board, learning workspace, session map, skill, readme, rule, and standard authoring, plus the `@`-reference convention) |
| `700–799` | ci (GitHub Actions workflow files)                                                                                                                                                                                                |

`snippets/` is the one folder sharing a band rather than holding its own. Its single rule numbers at 505, so the leading digit reads as claude and the folder is what separates them. Every other folder maps one to one, which is why a number states its domain everywhere else.

An eighth range sits outside the table. `900-999` is reserved for a rule a target authored itself, and no shipped rule takes a number in it. `600-699` and `800-899` are what remain of the headroom between the two, held for categories the toolkit has not added. `ci` is the first category drawn from that headroom, opening `700` at a band boundary rather than crowding a range the six original folders already divide.

### Two sources numbering into one folder

`internal/rules/` takes the top of a band and `governance/rules/` takes the gaps between the tens, so the two sources cannot collide silently. The core band is already full at every ten, which is what forces the split rather than leaving it to convention.

`core/087-git.md` is the first shipped rule in this band to claim a gap. The `claude` and `lib` bands already hold several, so a reader taking core's unbroken run of tens as the pattern would have read the convention backwards.

A target's own rules are the third source and they are divided by reservation rather than by that convention. Neither of the two bands the toolkit crowds most has room left for a top-of-band claim: `core/` runs to 090 with internal at 095 through 097, and `claude/` runs to 592 with internal at 595 through 598, leaving three free numbers in the band where the collision was actually measured. `standards/rule.md` states `900-999` instead, which no release can reach.

`standards/rule.md` also keeps the top-of-band division for a pair the reservation does not cover, which is the internal-against-shipped split above. Nothing checks either one.

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

An always-loaded rule sitting in `core/` reads as an odd fit next to the folder's path-scoped members, since nothing about `paths:` requires the band. The reason is whether a target can update it rather than glob scope: `governance/stacks/base.toml` takes `core` whole, so a bullet moved there from the seeded root file reaches a target through `canon gov sync` instead of through a one-time copy nothing ever refreshes. A `CLAUDE.md` bullet carries the same session-start priority either way, so the band is the only thing the move changes.

## Gotchas

- A widened source rule fails `bun run check` until the copy is committed. The regen propagates the change and the drift assertion turns the resulting diff into a failure. A rule matching nothing still does not error, so the gate catches the stale copy rather than the dead glob.
- A rule authored under `governance/rules/` in a folder no stack names installs for nobody through `canon gov install`. `.claude/context/governance/stacks.md` covers which folders close that and which do not. `governance/rules/snippets/` used to reach a target only through `canon snippets install`, and that install channel retired with nothing left to deliver the folder. `base` now carries `snippets` as a folder-whole entry, the same way it already does `core` and `claude`, so the folder reaches every base consumer through governance instead. See `.claude/context/snippets.md`.
- Adding a rule stales a hardcoded count in five entries nothing gates at edit time. `.claude/context/development/regeneration.md` states how many rules the toolkit authors and consumes, `.claude/context/sandbox/authoring.md` states the authored total beside what `base` resolves to, and `.claude/context/cli/audits.md` with `docs/agents/counts.md` quote both sentences as specimens of the trigger grammar, so a figure moving in either source moves three more in each quoting file. The Hero stage in `src/gate/stages.ts` gates the count on the README frame and reaches none of them, so the first pair had drifted by 10 and 8 when they were re-measured on 2026-08-13 at 48 authored, 30 consumed, and 28 resolved by `base`. Three numbers move together and each has its own reader: the authored total from `governance/rules/`, the consumed total from `.claude/rules/`, and what `base` resolves to, which `canon gov list --json` reports rather than any count of the source folder.
- `canon gov counts` closes the row above. It read past both rule figures until `#1223` widened the trigger set to reach the `all <n> rules` and `authors <n> rules` shapes, which were the two the matcher missed, and landing a rule on 2026-08-28 then produced eight findings across those five entries where the earlier reading had produced none. Run it after a rule lands, fix every figure it names, and re-run it to confirm clean. The manual re-measure is the fallback rather than the instrument.
- A landing rule also drifts the hero frame, which the row above names as reaching neither entry without saying the branch owes the render. `bun run check` fails its Hero stage until `bun src/cli.ts capture assets/hero.html` rewrites the image, and that stage and the Consumed copies stage both assert against git rather than the working tree, so the regenerated rule copy and the three hero files have to be staged before either passes.

- `core/070-planning.md` is the only rule naming a `canon` verb, which puts it on the wrong side of the two-speed gap `.claude/ARCHITECTURE.md` records. A rule reaches a target the moment an install copies it, while the verb it names reaches that target only once a release publishes, so a project on an older CLI reads an instruction its binary refuses. A rule citing a verb therefore owes the same release wait a skill body does, and nothing detects the skew.

A rule that publishes a heading some command parses is program input, so adding one is a code change and the reading command runs against the tree before the commit. `src/comments/vocabulary.ts` reads its terms out of whichever rule publishes `## Degradation vocabulary`, so `governance/rules/core/090-code-comments.md` turned a sweep that had only ever reported skipped into one returning six hits, four of them against the matcher's own doc comment naming the terms it matches. Grep for a reader of the heading or filename before writing the rule, and read every hit before treating any as a defect.

A `description` carrying a bare word, a colon, and a space breaks `Bun.YAML.parse` in `parseFrontmatter`, since YAML reads that shape as a nested mapping key rather than plain scalar text. The failure surfaces far from the cause: `canon gov list --json` throws a stack trace pointing at `src/indexes/frontmatter.ts` rather than naming the rule file, and the Hero stage that depends on that catalog fails in turn with no mention of a colon. Rephrase the description to avoid the pattern rather than quoting it, since the frontmatter examples elsewhere in this repository are unquoted.

`claude/511-indexes.md` globs `**/index.md`, the first rule reaching every folder in the tree rather than one named folder's contents. `core/065-spelling.md` globs `.cspell/**`, the first rule reaching a folder outside `.claude/` or a project's own source, since the dictionaries four stacks seed there had been governed by prose in the always-loaded file rather than by any rule.

## Adding a rule

Create a `.md` file anywhere under `governance/rules/` using the numbering convention above. Discovery is automatic and the rest of the branch is not.

`bun run check` has three things to say about the new file. The Consumed copies stage regenerates `.claude/rules/` and asserts no drift against the index, so the copy has to be staged before the stage clears. Governance rules are one of the five catalogs `scripts/core/regen-hero.sh` counts, so the rule moves both the count and the sampled entry list on `assets/hero.html`, and the Hero stage fails until `canon capture assets/hero.html` re-renders the image and the stamp beside it. The stacks entry states that for a new stack file and it holds the same way for a rule. Then the two hardcoded counts the Gotchas below name need re-measuring in the same branch, since nothing gates either.

Whether it reaches anyone depends on the stack roster rather than on the file. A rule added to `core/`, `claude/`, `snippets/`, or `ci/` reaches every `base` consumer with no stack edit, since `base` names each of those folders whole, and a rule in any other folder needs its name in the relevant `governance/stacks/*.toml`. See `.claude/context/governance/stacks.md` for both cases and for the stage that reports the gap.

Glob the rule against every ecosystem it governs rather than only the one its stack serves, since `--add` layers a rule onto a stack that never names it. `360-security-server` and `370-database` sit on `python` alone and glob `**/*.py` beside `**/*.ts` and `**/*.js`, so a Node API project pulls either one in and the globs already match. A glob narrowed to the naming stack's language installs a rule that matches nothing in that case.

## Project-local rules

Target projects author their own rules that the toolkit does not ship. The `create-rule` plugin skill scaffolds one into `.claude/rules/project/<subdir>/<n>-<slug>.md` with the Claude frontmatter shape, taking the lowest free number at or above 900.

These rules live only in the target. `canon gov sync` skips any rule with no toolkit source match, classified as `orphaned` by `planSync` in `src/sync/engine.ts`. A rule under `.claude/rules/project/`, which is where `create-rule` writes, is orphaned by location instead, since the gov adapter declares that subfolder on `SyncAdapter`, so it survives sync even if a later toolkit rule takes the same name.

An orphan the name inference caught rather than the location test now carries a notice naming the path under `project/` it would take, since that is the shape the two measured targets are in. Seven files across `career` and `erclx.dev` sit at flat toolkit paths, two of them at 561 and 562, which the toolkit later shipped as `561-teach` and `562-session`. The report names the destination and moves nothing, because a rule's installed path is one the project's own rules and docs may cite, and the seven were reported rather than migrated for the same reason.

The notice offers that destination on a condition rather than asserting the project wrote the file, because no source name matching is also what a rule the toolkit shipped and later renamed looks like. Moving one of those into `project/` marks it the project's permanently. The stamp does not separate the two: `recordStamp` skips a file whose source is gone and `writeStamp` replaces the domain's whole `files` map, so a renamed rule's entry survives exactly one sync past the rename, and a target installed before stamping shipped carries no entry at all. `src/sync/engine.test.ts` holds that as a test rather than a comment, since it is the reason the wording is conditional.

The band is what keeps a number from reading as a coincidence, and location is what keeps a file from being overwritten. Neither is checked at write time. The report is the only thing that names a rule sitting on the wrong side of either, and it names location alone, since nothing reads a number back against the reserved range.
