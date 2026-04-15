# Tooling system

## Overview

The tooling system manages project setup through two mechanisms: golden configs for universal base tooling, and reference docs for stack-specific guidance. Sync auto-discovers new stacks, so adding one requires no infrastructure changes.

## Structure

```plaintext
tooling/
├── base/
│   ├── configs/       ← authoritative, always overwrite on sync
│   ├── seeds/         ← user-owned, merge only (never overwrite)
│   ├── manifest.toml  ← extends chain, deps, scripts, gitignore
│   └── reference.md   ← prose intent and rationale (for humans and AI)
├── vite-react/
│   ├── seeds/         ← user-owned dictionary seeds
│   ├── manifest.toml  ← extends = "base", deps, scripts, gitignore
│   └── reference.md   ← unified guide for all TS web projects (React, Chrome, Astro, Next)
├── claude/
│   ├── configs/       ← Role prompts (e.g. PLANNER.md). Seeded on `init`, overwritten on `sync`.
│   ├── seeds/         ← User-owned docs (e.g. REQUIREMENTS.md) and CLAUDE.md. Seeded on `init`.
│   ├── manifest.toml  ← gitignore only, no configs or deps
│   └── reference.md
└── gemini/
    ├── seeds/         ← .gemini/settings.json, user-owned, never overwritten
    ├── manifest.toml  ← gitignore only, no deps or scripts
    └── reference.md
```

## Configs, seeds, and references

Configs are golden files and the source of truth. On sync they always overwrite the target. Drift is always wrong. Only the `base` stack ships golden configs.

Seeds are user-owned files that grow with the project. Dictionary files (`.cspell/`) accumulate project-specific terms over time. For the `claude` stack, state documents (`REQUIREMENTS.md`, `ARCHITECTURE.md`, etc.) are seeds. The user creates them once and owns them from that point on. Sync appends only what is missing and never overwrites.

References are `reference.md` files synced to `tooling/<stack>.md` in target projects. They are AI audit context. Sync them with `aitk tooling ref`, which respects the extends chain. The `vite-react` stack is reference-only: the agent reads the reference and generates configs adapted to the specific project. No golden configs are shipped for stack-specific tooling.

Gitignore entries are declared in `manifest.toml` under `[gitignore]` as named groups. They merge automatically on sync. The process is additive only. Existing entries are never touched.

Dependencies and scripts declared in `manifest.toml` under `[dependencies.dev]` and `[scripts]` are injected into `package.json`. Similar to seeds, only missing entries are added. Existing dependencies or scripts are not modified or overwritten.

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

`[gitignore]` appends to the target `.gitignore`. The quoted header becomes a comment, each path is appended as its own line. Additive only.

## CLI

| Command                           | What it does                                                                       |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `aitk init [path] [flags]`        | Bootstrap a project with base tooling and toolkit domains                          |
| `aitk tooling [stack] [path]`     | Full sync: configs, seeds, deps, gitignore                                         |
| `aitk tooling ref [stack] [path]` | Sync reference docs for a stack and its parents                                    |
| `aitk tooling create`             | Create a new stack folder with stub manifest and reference (requires confirmation) |
| `aitk tooling list [--json]`      | Emit catalog of stacks with extends chain and dep summary                          |

## Common workflows

Bootstrap a new project: `aitk init` installs base configs, Claude workflow, governance, snippets, and wiki in one command. Optional domains (standards, prompts, antigravity) are offered interactively. Pass flags to run non-interactively: `--stack <name>`, `--add <rules>`, `--snippets <cat>`, `--with standards,prompts,antigravity`, `--skip wiki`. The `init-project` skill resolves these from project detection and runs the chain in one shot.

Sync tooling to a project: `aitk tooling` and pick stack and path. For the `vite-react` stack, this installs deps, scripts, gitignore entries, and seeds (no configs to copy).

Drop reference docs: `aitk tooling ref vite-react ../my-app` copies `tooling/vite-react.md` to the target project for the agent to use.

Scaffold a new stack: `aitk tooling create` generates the stub structure in `tooling/<name>/`.

## Testing

Each stack with golden configs has a sandbox at `scripts/sandbox/tooling/<stack>.sh`. Run via `aitk` sandbox tooling. The sandbox provisions a project, injects configs and seeds, installs deps, and runs the full `verify.sh` pipeline. It catches config typos, version incompatibilities, and missing dictionary terms.

Reference-only stacks like `vite-react` are validated by scaffolding a real project, letting the agent set up configs from the reference, and running `bun run check`.

## Adding a new stack

1. Run `aitk tooling create` to generate the stub structure
2. Fill in `manifest.toml` with `extends`, deps, scripts, and optionally `[gitignore]`
3. Fill in `reference.md` with prose documentation
4. For stacks with golden configs, add files to `configs/` and create `scripts/sandbox/tooling/<n>.sh`
5. For reference-only stacks, add seed files to `seeds/` if needed

Sync auto-discovers the new stack.

## Notes

- Commit golden config changes with `--no-verify`. Lint-staged runs on the template files themselves, not project source.
- Tooling configs are concrete files and skip the governance build compilation step.
- In `[scripts]`, both key and value must use double quotes. Unquoted keys are silently skipped by the parser.
