---
title: Stacks
description: How a stack resolves its rule set, why an entry may name a whole folder, the extras flag, the unreferenced-rules stage, and adding a stack
---

# Stacks

Each stack declares an optional `extends` chain and a `rules` list. An entry names a rule or a whole rule folder. The chain resolves recursively, so `react` resolves through `node` to `base` and the full deduplicated set installs.

| Stack            | Extends | Rules                                                                                                                            |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `base`           | -       | the `core/` and `claude/` folders whole, which is every core rule plus every claude authoring rule                               |
| `node`           | base    | 100-typescript                                                                                                                   |
| `react`          | node    | 200-react, 230-nextjs, 250-tailwind, 300-testing-ts, 310-zod, 350-security-web, 400-ui, 410-a11y, 420-forms, 430-ux-completeness |
| `astro`          | node    | 210-astro, 350-security-web, 400-ui, 410-a11y, 430-ux-completeness                                                               |
| `python`         | base    | 110-python, 330-testing-py, 340-pydantic, 360-security-server, 370-database                                                      |
| `python-fastapi` | python  | 220-fastapi                                                                                                                      |

## Decisions

### A stack entry names a rule or a folder

`expandStackEntry` in `src/gov/stacks.ts` resolves one entry. A name matching a directory under `governance/rules/` yields every rule inside it, and anything else yields itself, so a folder and a slug leave the resolver as one shape. Dedupe runs on the expanded names, which is what lets a stack name a folder while an ancestor names a rule inside it without installing that rule twice.

`base` takes `core` and `claude` whole. Those two folders were enumerated one rule at a time and the list was always exactly the folder, so adding a rule needed a second edit nothing prompted. Every other stack stays enumerated, because taking three of six rule folders is a selection a folder entry cannot express.

The consequence is that both folders are now opt-out. A rule authored into `governance/rules/claude/` ships to every `base` consumer by existing, so the decision moved from the stack file to whether the file belongs in that folder. The install output is where the flat list is paid back, since `runInstall` expands before printing and the operator still reads every rule name.

### The extras flag layers rather than defines

`--add` takes rule names alone and does not expand a folder. The flag layers onto a resolved stack rather than defining one, and a folder there has no case behind it yet. An unknown name warns rather than aborting, so `--add core` is loud rather than silent.

Extras are deduped against the stack's resolved rules, so a rule already in the stack is a no-op.

## Gotchas

### A rule in an unnamed folder installs for nobody

A rule authored under `governance/rules/` in a folder no stack names reaches no target. Folder entries close that for `core` and `claude` alone, since the other four folders are still enumerated per stack.

### Why the unreferenced stage stays advisory

The `Unreferenced rules` stage in `scripts/core/verify.sh` reports rules no stack reaches and never fails. Its two standing findings, `260-shadcn` and `320-tanstack-query`, are opt-in libraries this repository ships on purpose, so a gate there would fail every push over the deliberate case.

`GOV_EXPECTED_UNREFERENCED` in that script holds the pair, and a third rule arriving reads as new against it. Reconsider failing once a third appears and the pattern is either a library set or an accident.

## Adding a stack

Create a new `.toml` file in `governance/stacks/`. Set `extends` to the parent stack name or leave it empty. List rule names without `.md` in the `rules` array, or a folder name under `governance/rules/` to take that folder whole. No build step needed.

```toml
extends = "node"
rules = ["200-react", "250-tailwind"]
```

Take a folder whole only when the stack wants every rule in it now and every rule added to it later. A stack selecting some of a folder stays enumerated, since the list is what records that the omission was a decision.

```toml
extends = ""
rules = ["core", "claude"]
```
