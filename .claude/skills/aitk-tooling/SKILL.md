---
name: aitk-tooling
description: Tooling stacks, golden configs, seeds, references, and manifests. Use for stack creation, manifest authoring, or config sync.
---

# Tooling

Read `docs/tooling.md` for system overview, configs vs seeds vs references, extends chain, and manifest authoring before editing.

## Layer model

Three layers, each with its own folder under `tooling/`:

- `base`: universal (prettier, cspell, commitlint, husky, shell tooling).
- `web`: web-universal (ESLint flat config, Vitest, Playwright, Tailwind v4, screenshots, CI workflow, VS Code). Extends `base`.
- Framework adapters (`vite-react`, `astro`): ship only the framework-specific deltas (framework config, vitest merge helper, tsconfig adapter). Extend `web`.

Stack-specific configs override extends-chain configs at the same relative path. `collect_stack_configs` in `scripts/tooling/sync.sh` walks current-first.

## Manifest rules

- In `[scripts]`, both key and value must use double quotes. Unquoted keys are silently skipped.
- Version pins in `[dependencies.dev]` (e.g. `"eslint@^9"`) are preserved by `sync.sh` and `inject.sh` and passed to `bun add -D` intact. Pins only apply to NEW installs; sync does not override a dep already present in `package.json`.
- `tooling/claude/` is excluded from stack discovery. It is storage for `aitk claude` only. Do not route claude work through the `aitk tooling` CLI, and do not add new exclusions without updating `scripts/lib/tooling.sh`.

## Adding a new stack

- Use `aitk tooling create` to generate the stub structure, then fill in seeds, `manifest.toml`, and `reference.md`.
- Pick the parent layer via `extends = "web"` for any web framework, or `extends = "base"` for non-web stacks.
- Golden configs go in `configs/`. Only ship files that genuinely differ from the parent layer. Duplicating a parent config for no reason creates drift.

## Sync checklist

When modifying files in `tooling/base/configs/`:

- Apply the same change to the matching file at the repo root if it exists. The toolkit dogfoods base tooling as its own config source.
- Preserve local overrides in the root copy. Port the delta, not the whole file.

When modifying `tooling/<stack>/configs/` or `tooling/<stack>/seeds/`:

- Update `tooling/<stack>/reference.md` if the intent or rationale changed. Typo fixes and dictionary term additions do not count.
- Validate headless by running the matching sandbox scenario end-to-end, not by eye. See `scripts/sandbox/claude/init-project.sh` for the fixture harness.

When adding deps or scripts to `manifest.toml`:

- Verify they don't conflict with the parent stack in the extends chain.
- Scripts walk the extends chain too: child scripts override parent scripts on the same key name.

## Cspell seeds

Seed files merge across layers. Each stack contributes words to the target's `.cspell/tech-stack.txt` via `merge_seed_file` in `scripts/lib/inject.sh`. Do not duplicate terms across layers; place each word in the narrowest layer that needs it (toolkit-ecosystem → `base`, web-universal → `web`, framework-specific → the adapter).

## Reference

- `docs/tooling.md`: system overview, configs vs seeds vs references, extends chain, manifest authoring
- `prompts/tooling-reference.md`: conventions for writing reference.md docs
