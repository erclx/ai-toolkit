---
title: Overview
description: What the development domain owns, the toolchain setup, the run command table and its consumers, and why the entry is a folder
---

# Overview

Owns the local development loop: toolchain setup, the run commands, and the git hooks that gate commits and pushes. CI runs the same stages through `bun run check:ci`, covered in `.claude/context/ci.md`. Domain behavior for what each script does lives in the entry for that domain. `CONTRIBUTING.md` at the repository root states the contributor-facing subset of this domain and points back here for the rest.

## Layout

- `scripts/` owns every shell script except the Claude Code hooks, grouped into a folder per domain
- `.claude/hooks/` owns the Claude Code hooks
- `.husky/` owns the git hooks

## Setup

- Install [Bun](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`
- Install bash 4+ on macOS: `brew install bash`.
- Install dependencies: `bun install`

## Scripts

| Command                 | Purpose                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `bun run check`         | Verification scoped to changed files. Auto-formats, regenerates indexes, asserts clean.  |
| `bun run check:ci`      | Every stage via `--all`, asserting formatting instead of applying it. Still regenerates. |
| `bun run check:format`  | Read-only prettier and shfmt format check.                                               |
| `bun run check:spell`   | Read-only cspell check against project dictionaries.                                     |
| `bun run check:shell`   | Read-only shellcheck against `scripts/`, `tooling/`, and `.claude/hooks/`.               |
| `bun run check:types`   | Read-only `tsc --noEmit` against `src/`.                                                 |
| `bun run check:install` | Clones the repo to tmp and asserts `aitk init` lands a fresh scaffold.                   |
| `bun run format`        | Auto-fix prettier and shfmt formatting.                                                  |
| `bun run clean`         | Wipe `node_modules/`, clear bun cache, reinstall.                                        |
| `bun run update`        | Interactive `bun update` followed by verification.                                       |
| `bun run snapshot`      | Snapshot project state for diffs.                                                        |

### What reads the table

`standards/context.md` scopes the `## Scripts` heading to this domain by name, and this file is where it lands. Three surfaces read the table, so a command added anywhere else is a command they cannot see: `project-commands` resolves a request against it, every stack reference extends it, and `docs/target-projects.md` tells a target to keep its own copy current.

The table stays a table against the catalog rule beside it, which sends a surface that grows a row per shipped thing to a bullet list. That rule answers reflow conflicts between sibling branches, and the same standard names this section a table in the sentence that scopes it here. `aitk context audit` reports the row count under Tables on every run, so the finding is expected rather than outstanding.

## Gotchas

### Why the entry is a folder

The entry is a folder on the sub-area condition rather than on length. `standards/context.md` splits a domain at three or more sub-areas that do not fit cleanly in one file, and setup with the run commands, the scoping of `bun run check`, the stages that regenerate, the stages that gate, the hook families, and session scratch are six that do not. Length is what raised the question and answers nothing by itself.

### Why most citations kept the flat path

The citation surface is what made this split harder than the one `standards/` took. Fifteen files named the flat path and ten of them instruct a target project about its own entry rather than pointing into this repository. A target seeded from `tooling/base/seeds/` carries a flat `development.md`, so retargeting those sites would ship a path that resolves nowhere into every scaffolded project, and no stage here would report it.

Those sites keep the flat spelling, and the citation gate is what that costs. It resolves every `.claude/context/*.md` string in the repository against this root, and it passed on all fifteen only because the toolkit's layout matched the layout it seeds. The split ends that coincidence.

Two repairs follow. A line the path carries nothing in drops it, which is what the seeded `CLAUDE.md` and the `project-commands` comparison row took, since a marker in a file a target reads daily leaks toolkit bookkeeping into it. Every other target-facing line carries `<!-- audit-ignore-citations -->`, the per-line marker `docs/agents/context-audit.md` documents. Widening the gate by location was the alternative, and it silences a real stale reference in the same trees.
