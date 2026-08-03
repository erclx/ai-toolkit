---
title: Tooling
description: Stacks, configs, seeds, references, manifests
---

# Tooling system

## Overview

Owns the golden configs a project inherits, layered across a `base` to `web` to framework chain where each layer ships only its own slice. A stack is a folder holding configs, seeds, a manifest, and a reference. Sync auto-discovers new stacks, so adding one requires no infrastructure change.

## Layout

- `tooling/<stack>/` owns one stack, always with a `manifest.toml` and a `reference.md`
- `tooling/<stack>/configs/` owns golden files that always overwrite on sync
- `tooling/<stack>/seeds/` owns user-owned files that sync preserves
- `tooling/claude/` owns storage for `aitk claude`, excluded from stack discovery
- `src/tooling/` owns the manifest walk, scan, and injection engine in TypeScript
- `scripts/tooling/` owns the ref, create, and verify subcommands, still bash

| Stack        | Extends | Ships                                                                   |
| ------------ | ------- | ----------------------------------------------------------------------- |
| `base`       | -       | Universal: prettier, cspell, commitlint, husky, shell                   |
| `web`        | base    | Web-universal: ESLint, Vitest, Playwright, Tailwind, CI, screenshots    |
| `vite-react` | web     | Framework glue: vite.config, vitest.config, playwright.config, tsconfig |
| `astro`      | web     | Framework glue: astro.config, getViteConfig vitest, astro-aware eslint  |
| `python`     | base    | `uv` runtime plus ruff, mypy, pytest, and coverage sidecars             |

## Decisions

- Configs always overwrite and seeds are preserved. The boundary is structural versus user-extensible: linters and formatters with no project-specific surface ship as configs, while files projects routinely extend (`cspell.json`, `.lintstagedrc`) ship as seeds.
- Stack-specific configs override the extends chain. `scan` in `src/tooling/scan.ts` walks the current stack first, and a file seen there blocks the same relative path from every parent layer.
- Which stack wins a duplicate differs by category, and the split is inherited rather than designed. Configs, seeds, and scripts resolve nearest stack first. Dependencies, gitignore entries, and references resolve from the furthest ancestor inward. The TypeScript port preserved both directions rather than unifying them, because unifying would silently change what a target receives.
- `sync` dropped the `Review diffs` prompt branch. It was the only path that shelled out to `code --diff`, which is the behavior PR #605 fixed for headless callers, so rebuilding it would reintroduce the defect the migration exists to remove. Compare with git after syncing instead.
- Injection is reachable as `aitk tooling inject <stack>` so `aitk claude` and the sandbox can apply one stack without the scan and prompt. The excluded-stack guard sits on `sync` rather than in the shared path, which is what lets `aitk claude` drive the `claude` stack through it.
- `python` extends `base` directly rather than going through `web`. It runs on `uv` instead of `bun`, so the web layer's assumptions do not apply.
- Dictionary seeds merge rather than copy-once. `.cspell/*.txt` accumulates project terms over time, so sync appends new entries and sorts. Every other seed type copies once and is then left alone.
- Gitignore merging is additive only and existing entries are never touched, so a project can reorder or annotate its own ignores without sync fighting it.
- Scripts are never overwritten except through `[scripts.override]`, which exists for two cases: scaffolds that ship an anti-pattern by default, and toolkit-owned wrappers whose body must stay in lockstep with the shipped shell scripts.
- References shrank to anti-patterns and opinions once golden configs landed. The config is the source, the reference carries only what a config cannot express.
- Stacks do not compose horizontally. Single-root polyglot is unsupported, and a monorepo uses the subfolder pattern instead.
- `tooling/claude/` is storage, not a stack. It holds seeds, user-level config, and a minimal manifest consumed only by the `aitk claude` CLI, so `TOOLING_STACK_EXCLUDE` keeps it out of discovery.

## Gotchas

- Commit golden config changes with `--no-verify`. Lint-staged runs against the template files themselves, not project source.
- In `[scripts]`, both key and value must use double quotes. Unquoted keys are silently skipped by the parser.
- Each `[gitignore]` group must use single-line array syntax. Multi-line arrays parse as empty.
- Injection runs `bun add -D`, so a manifest whose runtime is not `bun` must leave `[dependencies.dev]` empty and document a manual install step in its `reference.md`.
- `runtime` is reserved and read by nothing today. `scaffold` is read only by `scripts/sandbox/tooling/upstream.sh`, not yet by `aitk tooling sync`.
- Syncing a monorepo subtree without `--skip base` re-drops husky per subtree. Git honors only one `core.hooksPath`, so the extra hook dirs silently break.
- `--skip base` relies on the layer boundary holding: repo-root-once configs live in `base`, per-root configs live in `web` and the adapters. Moving a per-root config into `base` would break the split.
- Non-`.txt` seeds are copy-once. To re-seed a structured file, delete it and sync again.
- Config copies must preserve an existing destination's mode, not the source's. `tooling/web/configs/scripts/verify.sh` is 644 while base ships 755, so a copy that applied the source mode would strip the executable bit on the `web` and `astro` chains. `cp` kept the destination mode and `copyPreservingMode` in `src/copy.ts` reproduces that. It sits at the top level rather than in `src/tooling/` because the sync engine needs the same guarantee.
- `Bun.Glob` skips dotfiles unless `dot: true` is set. Tooling configs are almost entirely dotfiles, so omitting it matches 4 of 14 files in `base` and fails silently.
- The base stack seeds `.claude/context/index.md` beside its entries, and `tooling/claude/seeds/` ships a byte-identical copy. Neither installer overwrites an existing file, so whichever runs first wins and matching frontmatter keeps the outcome the same. Without the base copy the tree carries no index, and `resolveFolders` skips a folder lacking one, so the shipped entries were not auditable.
- Per-stack `ci.md` and `development.md` seeds are not shipped, because seeds are user-owned and never overwritten. Stack references carry `## CI docs (extend)` sections telling the agent which rows to append instead.

## Manifest authoring

Each stack has a `manifest.toml` that controls what sync does. `[stack]` is the only required block.

```toml
[stack]
name = "stack-name"     # must match the folder name under tooling/
extends = "parent"      # parent stack to inherit from, empty string if none
runtime = "runtime-name"      # reserved: package manager for this stack (not active yet)
scaffold = "scaffold-command"  # bootstrap command, read today by sandbox/tooling/upstream.sh
```

```toml
[dependencies.dev]
packages = []

[scripts]
"script-key" = "command --flag"

[gitignore]
"# group-label" = ["pattern/", ".file"]
```

`[dependencies.dev]` injects into `devDependencies`, adding only missing packages. `[scripts]` injects into the `scripts` block, adding only missing keys. `[gitignore]` appends each group as a comment header plus one line per path. Group keys use single-word labels (`# VSCode`, `# Python`) so headers stay stable across renames.

```toml
[verify]
prepare = "command to run after scaffold, before sync"
```

`[verify] prepare` declares a post-scaffold, pre-sync setup command for `aitk tooling verify`. Use it for integrations that cannot ship as golden configs, such as astro's `bunx astro add react --yes`. Optional.

## CLI

| Command               | What it does                                                    |
| --------------------- | --------------------------------------------------------------- |
| `aitk init`           | Bootstrap a project with base tooling and toolkit domains       |
| `aitk tooling`        | Full sync: configs, seeds, deps, gitignore, and reference docs  |
| `aitk tooling ref`    | Sync reference docs only                                        |
| `aitk tooling create` | Create a new stack folder with stub manifest and reference      |
| `aitk tooling list`   | Emit catalog of stacks with extends chain and dep summary       |
| `aitk tooling verify` | Scaffold into a temp dir, sync, then run the full project check |

Flags and arguments live in `docs/agents.md`.

## Common workflows

Bootstrap a new project with `aitk init`, which installs base configs, Claude workflow, governance, standards, and snippets in one command, and scaffolds an empty `.claude/wiki/`. Governance installs the `base` stack when `--stack` is absent, and `--skip governance` is the way to decline it. The `setup-init` skill resolves the flags from project detection and runs the chain in one shot.

Sync tooling with `aitk tooling` and pick stack and path. Pass `--no-ref` to skip the reference drop, or `--skip <stack>` to drop a layer from the resolved chain.

Set up a multi-language monorepo by letting the repo root own the `base` layer and giving each language its own subfolder:

```bash
aitk init                                              # base at the root
aitk tooling sync vite-react ./frontend --skip base
aitk tooling sync python ./backend --skip base
```

`--skip <stack>` removes the named layer and its parents across configs, seeds, deps, scripts, gitignore, and refs. Each subtree still gets its own language configs and its own `.claude/tooling/<stack>.md` audit doc.

## Testing

`aitk tooling verify <stack>` is the end-to-end validator. It scaffolds fresh into `.claude/.tmp/verify-<stack>/`, runs the optional `[verify] prepare` hook, invokes `aitk tooling sync <stack> .`, then executes `bun run lint:fix`, `bun run check`, `bun run test:e2e`, and `bun run screenshot`, asserts screenshot artifacts, and reports a pass/fail matrix. The tmp dir auto-removes on success. Use `--keep` to inspect a green run, or rely on the auto-preserve on failure.

Run it after any change to `tooling/<stack>/configs/`, a manifest, or the sync logic in `src/tooling/`.

Unit tests cover the manifest walk, the gitignore transforms, the package.json comparisons, and the scan. Equivalence against the bash this replaced was established by syncing every stack into paired fixtures and diffing contents and file modes, which is the check to repeat when changing injection order or copy semantics.

## Adding a new stack

1. Run `aitk tooling create` to generate the stub structure
2. Fill in `manifest.toml` with `extends`, deps, scripts, and optionally `[gitignore]` or `[verify]`
3. Fill in `reference.md` with prose documentation
4. Add golden configs to `configs/` for anything that ships as source of truth
5. Add seed files to `seeds/` for user-owned files that accumulate over time
6. Run `aitk tooling verify <name>` to validate end-to-end

Sync auto-discovers the new stack.
