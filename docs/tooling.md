# Tooling system

## Overview

Golden configs in `configs/` are the source of truth. Seeds, references, sandboxes, and AI audit commands all consume them. Sync auto-discovers new stacks, so adding one requires no infrastructure changes.

## Structure

```plaintext
tooling/
├── base/
│   ├── configs/       ← authoritative, always overwrite on sync
│   ├── seeds/         ← user-owned, merge only (never overwrite)
│   ├── manifest.toml  ← extends chain, deps, scripts, gitignore
│   └── reference.md   ← prose intent and rationale (for humans and AI)
├── vite-react/
│   ├── configs/       ← only files that differ from or extend base
│   ├── seeds/
│   ├── manifest.toml  ← extends = "base"
│   └── reference.md
├── chrome/
│   ├── configs/       ← golden config files
│   ├── manifest.toml  ← extends chain, deps, scripts, gitignore
│   └── reference.md
├── claude/
│   ├── seeds/         ← .claude/ workflow docs (role prompts and state docs)
│   ├── manifest.toml  ← gitignore only, no configs or deps
│   └── reference.md
├── cursor/
│   ├── manifest.toml  ← gitignore only
│   └── reference.md
└── gemini/
    ├── seeds/         ← .gemini/settings.json, user-owned, never overwritten
    ├── manifest.toml  ← gitignore only, no deps or scripts
    └── reference.md
```

## Configs vs seeds vs references vs gitignore

Configs are golden files and the source of truth. On sync they always overwrite the target. Drift is always wrong.

Seeds are user-owned files that grow with the project. Dictionary files (`.cspell/`) accumulate project-specific terms over time. Workflow docs (`.claude/`) are seeded once and never touched by tooling again. Sync appends only what's missing and never overwrites. Stacks ship seeds pre-populated with terms they introduce, such as `shellcheck` and `vitest`.

References are `reference.md` files synced to `tooling/<stack>.md` in target projects. They are AI audit context. Sync them with `aitk tooling ref`, which respects the extends chain.

Gitignore entries are declared in `manifest.toml` under `[gitignore]` as named groups. They merge automatically on sync. The process is additive only; existing entries are never touched.

Dependencies and scripts declared in `manifest.toml` under `[dependencies.dev]` and `[scripts]` are injected into `package.json`. Similar to seeds, only missing entries are added; existing dependencies or scripts are not modified or overwritten.

## Extends chain

`manifest.toml` declares `extends = "base"`. The full chain resolves recursively: base applies first, the derived stack overlays second. This applies to configs, seeds, references, and gitignore equally.

## CLI

| Command                           | What it does                                               |
| --------------------------------- | ---------------------------------------------------------- |
| `aitk tooling [stack] [path]`     | Full sync: configs, seeds, deps, gitignore                 |
| `aitk tooling ref [stack] [path]` | Sync reference docs for a stack and its parents            |
| `aitk tooling create`             | Create a new stack folder with stub manifest and reference |

## Common workflows

Sync to a fresh project: `aitk tooling` → sync → pick stack → enter path.

Scaffold a new stack: `aitk tooling create` → enter name → stub structure created in `tooling/<name>/`.

## Testing

Each stack has a sandbox at `scripts/sandbox/tooling/<stack>.sh`. Run via `aitk` → tooling → pick scenario. The sandbox provisions a project, injects configs and seeds, installs deps, and runs the full `verify.sh` pipeline. It catches config typos, version incompatibilities, and missing dictionary terms.

## Adding a new stack

1. Run `aitk tooling create` to generate the stub structure
2. Add golden config files to `tooling/<n>/configs/`
3. Add pre-populated seed files to `tooling/<n>/seeds/`
4. Fill in `manifest.toml` with `extends`, deps, scripts, and optionally `[gitignore]`
5. Fill in `reference.md` with prose documentation
6. Create `scripts/sandbox/tooling/<n>.sh`: inject configs, seeds, manifest, run verify
7. Test via `aitk` → tooling → `<n>`

Sync auto-discovers the new stack.

## Notes

- Commit golden config changes with `--no-verify`. Lint-staged runs on the template files themselves, not project source.
- `cspell.json` references `.cspell/` dictionaries. Seeds must exist, even if empty, or cspell errors on missing paths.
- Tooling configs are concrete files and skip the governance build compilation step.
- Gemini stack seeds `.gemini/settings.json` only — no deps, no scripts. It gitignores `.gemini/.tmp/` and the user-owned `.gemini/settings.json`.
