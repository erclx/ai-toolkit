---
name: aitk-tooling
description: Tooling stacks, golden configs, seeds, references, and manifests. Use for stack creation, manifest authoring, or config sync.
---

# Tooling

Read `docs/tooling.md` for system overview, configs vs seeds vs references, extends chain, and manifest authoring before editing.

## Manifest rules

- In `[scripts]`, both key and value must use double quotes. Unquoted keys are silently skipped.
- `tooling/claude/` is excluded from stack discovery. It is storage for `aitk claude` only. Do not route claude work through the `aitk tooling` CLI, and do not add new exclusions without updating `scripts/lib/tooling.sh`.

## Adding a new stack

- Use `aitk tooling create` to generate the stub structure, then fill in seeds, `manifest.toml`, and `reference.md`.
- For stacks with golden configs, add files to `configs/` and create `scripts/sandbox/tooling/<n>.sh`.

## Sync checklist

When modifying files in `tooling/*/configs/`:

- Apply the same change to the matching file at the repo root if it exists. The toolkit dogfoods its own tooling.
- Preserve local overrides in the root copy. Port the delta, not the whole file.
- Update the stack's `reference.md` if the rationale or intent changed, not for every value tweak.

When adding deps or scripts to `manifest.toml`:

- Verify they don't conflict with the parent stack in the extends chain

## Reference

- `docs/tooling.md`: system overview, configs vs seeds vs references, extends chain, manifest authoring
- `prompts/tooling-reference.md`: conventions for writing reference.md docs
