---
name: aitk-tooling
description: Tooling stacks, golden configs, seeds, and manifests. Use for stack creation, manifest authoring, or config sync.
---

# Tooling

## Configs and seeds

- Configs in `configs/` always overwrite on sync. Drift is always wrong.
- Seeds in `seeds/` are user-owned and merge-only. Never overwrite them.
- `reference.md` files are AI audit context synced to `tooling/<stack>.md` in target projects via `aitk tooling ref`.

## Manifests

- `extends` resolves recursively. Base applies first, derived overlays second. Applies to configs, seeds, deps, scripts, and gitignore equally.
- In `[scripts]`, both key and value must use double quotes. Unquoted keys are silently skipped.
- `[dependencies.dev]`, `[scripts]`, and `[gitignore]` are all optional. Omit any block the stack does not need.

## Adding a new stack

- Use `aitk tooling create` to generate the stub structure, then fill in configs, seeds, `manifest.toml`, and `reference.md`.
- Sync auto-discovers new stacks. No other changes needed.

## Sync checklist

When modifying files in `configs/`:

- Update `reference.md` for the affected stack to reflect the change

When adding a new stack:

- Create `scripts/sandbox/tooling/<n>.sh`

When adding deps or scripts to `manifest.toml`:

- Verify they don't conflict with the parent stack in the extends chain

## Full reference

- `docs/tooling.md`: system overview, configs vs seeds, extends chain, manifest authoring
- `prompts/tooling-reference.md`: conventions for writing reference.md docs
