# Tooling System

## Overview

Golden configs in `configs/` are the source of truth. Seeds, references, sandboxes, and AI audit commands all consume them. Sync auto-discovers new stacks, so adding one requires no infrastructure changes.

## Structure

```
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
└── claude/
    ├── seeds/         ← .claude/ workflow docs, seeded once never overwritten
    ├── manifest.toml  ← gitignore only, no configs or deps
    └── reference.md
```

## Configs vs Seeds vs References vs Gitignore

Configs are golden files and the source of truth. On sync they always overwrite the target. Drift is always wrong.

Seeds are user-owned files that grow with the project. Dictionary files (`.cspell/`) accumulate project-specific terms over time. Workflow docs (`.claude/`) are seeded once and never touched by tooling again. Sync appends only what's missing and never overwrites. Stacks ship seeds pre-populated with terms they introduce, such as `shellcheck` and `vitest`.

References are `reference.md` files synced to `tooling/<stack>.md` in target projects. They are AI audit context. Drop them with `gdev tooling ref`, then point a Gemini command at them. Run `gemini tooling:review <stack>` after config changes to keep references consistent with configs.

Gitignore entries are declared in `manifest.toml` under `[gitignore]` as named groups. They merge automatically on sync. The process is additive only; existing entries are never touched.

## Extends Chain

`manifest.toml` declares `extends = "base"`. The full chain resolves recursively: base applies first, the derived stack overlays second. This applies to configs, seeds, references, and gitignore equally.

## CLI

| Command                           | What it does                                     |
| --------------------------------- | ------------------------------------------------ |
| `gdev gov build`                  | Compile rules/standards into `.toml` artifacts   |
| `gdev gov sync [path]`            | Push governance rules and standards to a project |
| `gdev tooling [stack] [path]`     | Full sync: configs, seeds, refs, deps, gitignore |
| `gdev tooling ref [stack] [path]` | Drop reference docs only                         |
| `gdev claude init [path]`         | Seed `.claude/` workflow docs into a project     |
| `gdev claude update [path]`       | Diff `CLAUDE.md` against seed, offer to apply    |
| `gdev`                            | Sandbox picker: provision and test scenarios     |

## Common Workflows

Sync to a fresh project: `gdev tooling` → sync → pick stack → enter path.

AI audit of a mature project:

```bash
gdev tooling ref vite-react ../my-app   # drop references
gemini dev:setup tooling/vite-react.md  # AI audits drift, applies surgical fixes
```

Keep references consistent after a config change:

```bash
gemini tooling:review vite-react        # AI identifies gaps, updates on confirmation
```

## Testing

Each stack has a sandbox at `scripts/sandbox/tooling/<stack>.sh`. Run via `gdev` → tooling → pick scenario. The sandbox provisions a project, injects configs and seeds, installs deps, and runs the full `verify.sh` pipeline. It catches config typos, version incompatibilities, and missing dictionary terms. The `sync` scenario tests drift detection against a deliberately partial or drifted project, including config drift, missing seeds, and missing gitignore entries.

## Adding a New Stack

1. Create `tooling/<n>/configs/` with golden config files
2. Create `tooling/<n>/seeds/` with pre-populated dictionary terms
3. Create `tooling/<n>/manifest.toml` with `extends`, deps, scripts, and optionally `[gitignore]`
4. Create `tooling/<n>/reference.md` with prose documentation
5. Create `scripts/sandbox/tooling/<n>.sh`: inject configs, seeds, manifest, run verify
6. Test via `gdev` → tooling → `<n>`

Sync auto-discovers the new stack.

## Notes

- Commit golden config changes with `--no-verify`. Lint-staged runs on the template files themselves, not project source.
- `cspell.json` references `.cspell/` dictionaries. Seeds must exist, even if empty, or cspell errors on missing paths.
- Tooling configs are concrete files and skip the governance build compilation step.
