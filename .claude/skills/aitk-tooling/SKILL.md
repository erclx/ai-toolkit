---
name: aitk-tooling
description: Tooling stacks, golden configs, seeds, references, and manifests. Use for stack creation, manifest authoring, or config sync.
---

# Tooling

## Configs, seeds, and references

- Configs in `configs/` always overwrite on sync. Drift is always wrong. Only the `base` stack ships golden configs.
- Seeds in `seeds/` are user-owned and merge-only. Never overwrite them.
- `reference.md` files are AI audit context synced to `tooling/<stack>.md` in target projects via `aitk tooling ref`.
- Reference-only stacks (like `vite-react`) have no `configs/` directory. The agent reads the reference and generates configs adapted to the specific project.

## Manifests

- `extends` resolves recursively. Base applies first, derived overlays second. Applies to configs, seeds, deps, scripts, and gitignore equally.
- In `[scripts]`, both key and value must use double quotes. Unquoted keys are silently skipped.
- `[dependencies.dev]`, `[scripts]`, and `[gitignore]` are all optional. Omit any block the stack does not need.

## Adding a new stack

- Use `aitk tooling create` to generate the stub structure, then fill in seeds, `manifest.toml`, and `reference.md`.
- For stacks with golden configs, add files to `configs/` and create `scripts/sandbox/tooling/<n>.sh`.
- Sync auto-discovers new stacks. No other changes needed.

## Sync checklist

When modifying files in `configs/`:

- Update `reference.md` for the affected stack to reflect the change

When modifying a reference-only stack:

- Update `reference.md` directly (no configs to keep in sync)

When adding a new stack:

- For golden config stacks, create `scripts/sandbox/tooling/<n>.sh`

When adding deps or scripts to `manifest.toml`:

- Verify they don't conflict with the parent stack in the extends chain

## Full reference

- `docs/tooling.md`: system overview, configs vs seeds vs references, extends chain, manifest authoring
- `prompts/tooling-reference.md`: conventions for writing reference.md docs
