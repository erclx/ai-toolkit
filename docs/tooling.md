---
title: Tooling
description: Stacks, configs, seeds, references, manifests
category: Domain references
---

# Tooling system

## Overview

The tooling system ships golden configs layered across a `base` → `web` → framework chain. Each layer owns a slice. `base` is universal (prettier, cspell, commitlint, husky, shell). `web` is web-universal (ESLint, Vitest, Playwright, Tailwind, CI, screenshots). Framework adapters (`vite-react`, `astro`) ship only the framework-specific deltas (vite.config, framework tsconfig, stack-specific vitest helpers). The `python` stack extends `base` directly without going through `web`, runs on `uv` instead of `bun`, and layers ruff/mypy/pytest/coverage sidecars on top. Sync auto-discovers new stacks, so adding one requires no infrastructure changes.

## Structure

```plaintext
tooling/
├── base/
│   ├── configs/       ← authoritative, always overwrite on sync (prettier, cspell, commitlint, husky, shell)
│   ├── seeds/         ← user-owned, preserved on sync
│   ├── manifest.toml  ← extends chain, deps, scripts, gitignore
│   └── reference.md
├── web/
│   ├── configs/       ← web-universal golden configs (eslint.config.js, src/test/setup.ts, e2e/screenshot.ts, .vscode, CI, verify.sh)
│   ├── seeds/         ← cspell terms for web tooling
│   ├── manifest.toml  ← extends = "base", shared web deps and scripts
│   └── reference.md   ← anti-patterns and opinions only
├── vite-react/
│   ├── configs/       ← framework glue (vite.config.ts, vitest.config.ts, playwright.config.ts, tsconfig.json)
│   ├── seeds/         ← user-owned dictionary seeds
│   ├── manifest.toml  ← extends = "web", vite deps and scripts
│   └── reference.md   ← adapter delta: Chrome extension variant, setup script
├── astro/
│   ├── configs/       ← astro.config.mjs, getViteConfig vitest, astro tsconfig, astro-aware eslint
│   ├── manifest.toml  ← extends = "web", astro deps and scripts
│   └── reference.md   ← adapter delta: astro check, island scope, prettier-plugin-astro
├── python/
│   ├── configs/       ← ruff.toml, mypy.ini, pytest.ini, .coveragerc, .python-version, scripts/verify.sh
│   ├── seeds/         ← cspell terms for Python tooling
│   ├── manifest.toml  ← extends = "base", uv runtime, lint/typecheck/test scripts wrapping `uv run`
│   └── reference.md   ← anti-patterns, sidecar config rationale, hybrid project shape
├── gemini/
│   ├── seeds/         ← .gemini/settings.json, user-owned, never overwritten
│   ├── manifest.toml  ← gitignore only, no deps or scripts
│   └── reference.md
└── claude/            ← storage for `aitk claude`, excluded from tooling discovery, see docs/claude.md
```

Stack-specific configs override the extends chain. `collect_stack_configs` in `scripts/tooling/sync.sh` walks the current stack first. Files seen there block the same relative path from being copied from parent layers.

`tooling/claude/` is an exception. It holds seeds, roles, and a minimal manifest consumed only by the `aitk claude` CLI. Treat it as storage, not a stack.

## Stack exclusions

`scripts/lib/tooling.sh` centralizes the exclusion list via `TOOLING_STACK_EXCLUDE` and exposes `list_tooling_stacks` and `is_tooling_stack_excluded`. The four tooling subcommands (`list`, `ref`, `sync`, `create`) consume the helper for discovery and name validation. Excluded names print a redirect error pointing at the correct CLI and exit 1.

- `claude` is the current exclusion. Route claude work through `aitk claude` instead.
- Any future folder under `tooling/` that is not a real stack routes through the same helper.

## Configs, seeds, references, and generated files

Configs are golden files and the source of truth. On sync they always overwrite the target. Drift is always wrong. `base`, `web`, `vite-react`, and `astro` all ship golden configs. Layer precedence: current stack overrides extends chain. So `vite-react/configs/eslint.config.js` would win over `web/configs/eslint.config.js` at the same relative path.

Seeds are user-owned files that grow with the project. Dictionary files (`.cspell/*.txt`) accumulate project-specific terms over time, so sync merges new entries and sorts the file. The `base` stack also seeds `docs/development.md` and `docs/ci.md` as short human-facing guides with `title` and `description` frontmatter so they slot into the project's `docs/index.md` walker if indexes are installed. For the `claude` stack, state documents (`REQUIREMENTS.md`, `ARCHITECTURE.md`, etc.) are seeds. The user creates them once and owns them from that point on. Non-`.txt` seeds are copy-once: sync drops them on first install and leaves them alone after that. To re-seed a structured file, delete it and re-sync.

References are `reference.md` files synced to `tooling/<stack>.md` in target projects. They are AI audit context. Sync them with `aitk tooling ref`, which respects the extends chain. With golden configs in place, references shrink to anti-patterns, opinions, and framework-adapter notes. They carry the rationale the configs cannot express on their own.

Generated files are derived from target state, not copied from a source. On install and sync the CLI rewrites them from what is present in the target. `prompts/index.md` and `standards/index.md` use this pattern: each lists only the files actually installed. Hand edits are lost on the next sync.

Gitignore entries are declared in `manifest.toml` under `[gitignore]` as named groups. They merge automatically on sync. The process is additive only. Existing entries are never touched.

Dependencies and scripts declared in `manifest.toml` under `[dependencies.dev]` and `[scripts]` are injected into `package.json`. Missing entries are added. Existing scripts are never overwritten. Existing dependencies are preserved unless a manifest pin's major version does not match the installed major, in which case sync re-installs to enforce the pin.

## Extends chain

`manifest.toml` declares `extends = "base"`. The full chain resolves recursively: base applies first, the derived stack overlays second. This applies to configs, seeds, references, and gitignore equally.

## Manifest authoring

Each stack has a `manifest.toml` that controls what sync does. Below is the full structure with every supported block.

```toml
[stack]
name = "stack-name"     # must match the folder name under tooling/
extends = "parent"      # parent stack to inherit from, empty string if none
runtime = "runtime-name"      # reserved: package manager for this stack (not active yet)
scaffold = "scaffold-command"  # bootstrap command, read today by sandbox/tooling/upstream.sh, not yet by aitk tooling sync
```

`name` must match the folder name exactly. `extends` is the parent stack. Configs, seeds, scripts, deps, and gitignore all resolve through the chain. Leave empty if no parent.

`runtime` is reserved and not yet read by any script. `scaffold` is partially active: `scripts/sandbox/tooling/upstream.sh` reads it today to provision raw upstream templates. It is not yet used by `aitk tooling sync`. Declare both fields now so the intent is captured. Use an empty string if not applicable.

`[stack]` is the only required block. `[dependencies.dev]`, `[scripts]`, and `[gitignore]` are all optional. Omit any section the stack does not need.

```toml
[dependencies.dev]
packages = []

[scripts]
"script-key" = "command --flag"

[gitignore]
"# group-label" = ["pattern/", ".file"]
```

`[dependencies.dev]` injects into `devDependencies` in the target `package.json`. Only missing packages are added. Include a version tag or use `@latest`.

`[scripts]` injects into the `scripts` block of the target `package.json`. Only missing keys are added. Both key and value must use double quotes. Unquoted keys are not parsed.

`[scripts.override]` force-replaces existing keys on every sync. Use it for two cases: scaffolds that ship an anti-pattern by default (such as `vite-react` shipping `build = tsc -b && vite build` that the web reference bans), and toolkit-owned wrapper scripts (like `screenshot`) whose body changes across releases and must stay in lockstep with the shipped shell scripts.

`[gitignore]` appends to the target `.gitignore`. The quoted header becomes a comment, each path is appended as its own line. Additive only.

```toml
[verify]
prepare = "command to run after scaffold, before sync"
```

`[verify] prepare` declares a post-scaffold, pre-sync setup command for `aitk tooling verify`. Use it for integrations that can not ship as golden configs, like astro's `bunx astro add react --yes`. Optional.

## CLI

| Command                           | What it does                                                                        |
| --------------------------------- | ----------------------------------------------------------------------------------- |
| `aitk init [path] [flags]`        | Bootstrap a project with base tooling and toolkit domains                           |
| `aitk tooling [stack] [path]`     | Full sync: configs, seeds, deps, gitignore, and reference docs (`--no-ref` to skip) |
| `aitk tooling ref [stack] [path]` | Sync reference docs only (no configs, seeds, or deps)                               |
| `aitk tooling create`             | Create a new stack folder with stub manifest and reference (requires confirmation)  |
| `aitk tooling list [--json]`      | Emit catalog of stacks with extends chain and dep summary                           |
| `aitk tooling verify <stack>`     | Scaffold into `.claude/.tmp/`, sync, then run `check`, `test:e2e`, and `screenshot` |

## Common workflows

Bootstrap a new project: `aitk init` installs base configs, Claude workflow, governance, snippets, and wiki in one command. Optional domains (standards, prompts, antigravity) are offered interactively. Pass flags to run non-interactively: `--stack <name>`, `--add <rules>`, `--snippets <cat>`, `--with standards,prompts,antigravity`, `--skip wiki`. The `init-project` skill resolves these from project detection and runs the chain in one shot.

Sync tooling to a project: `aitk tooling` and pick stack and path. For the `vite-react` stack, this installs deps, scripts, gitignore entries, seeds, and drops `tooling/<stack>.md` across the extends chain for the agent to read. Pass `--no-ref` to skip the reference drop.

Drop reference docs only: `aitk tooling ref vite-react ../my-app` copies `tooling/vite-react.md` without touching configs, seeds, or deps. Useful when the stack is already synced and only the reference needs refreshing.

Update CI and development docs: the base tooling seeds `docs/ci.md` and `docs/development.md` with the base-level checks and scripts. Stack `reference.md` files contain `## CI docs (extend)` and `## Development docs (extend)` sections that tell the agent which rows to append. Per-stack `ci.md` / `development.md` seeds are not shipped because seeds are user-owned and never overwritten.

Scaffold a new stack: `aitk tooling create` generates the stub structure in `tooling/<name>/`.

Set up a multi-language monorepo: each language lives in its own subfolder, and each subfolder is a separate project root. Sync once per root with the matching stack. For example, a repo with a React frontend and a Python backend runs `aitk tooling vite-react ./frontend` and `aitk tooling python ./backend`. Each root gets its own `package.json` or `pyproject.toml` and its own golden configs. Stacks do not compose horizontally, so single-root polyglot (two languages under one `package.json`) is not supported. Use the subfolder pattern instead.

## Testing

`aitk tooling verify <stack>` is the end-to-end validator. It scaffolds fresh into `.claude/.tmp/verify-<stack>/`, runs the optional `[verify] prepare` hook, invokes `aitk tooling sync <stack> .`, then executes `bun run lint:fix`, `bun run check`, `bun run test:e2e`, and `bun run screenshot`, asserts screenshot artifacts, and reports a pass/fail matrix. The tmp dir auto-removes on success. Use `--keep` to inspect a green run, or rely on the auto-preserve on failure.

Run it after any change to `tooling/<stack>/configs/`, a manifest, or the sync logic in `scripts/tooling/sync.sh` and `scripts/lib/inject.sh`.

## Adding a new stack

1. Run `aitk tooling create` to generate the stub structure
2. Fill in `manifest.toml` with `extends`, deps, scripts, and optionally `[gitignore]` or `[verify]`
3. Fill in `reference.md` with prose documentation
4. Add golden configs to `configs/` for anything that ships as source of truth
5. Add seed files to `seeds/` for user-owned files that accumulate over time
6. Run `aitk tooling verify <name>` to validate end-to-end

Sync auto-discovers the new stack.

## Notes

- Commit golden config changes with `--no-verify`. Lint-staged runs on the template files themselves, not project source.
- Tooling configs are concrete files and skip the governance build compilation step.
- In `[scripts]`, both key and value must use double quotes. Unquoted keys are silently skipped by the parser.
