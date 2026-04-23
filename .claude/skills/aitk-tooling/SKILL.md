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
- Version pins in `[dependencies.dev]` (e.g. `"eslint@^9"`) are enforced by major version. Sync compares the installed dep's major against the pin's major and re-installs on mismatch. Deps without pins are left alone when present.
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
- Validate headless via `aitk tooling verify <stack>`. Scaffolds into `.claude/.tmp/verify-<stack>/`, runs the full chain through `check`, `test:e2e`, and `screenshot`, and reports pass/fail per phase.

When adding deps or scripts to `manifest.toml`:

- Verify they don't conflict with the parent stack in the extends chain.
- Scripts walk the extends chain too: child scripts override parent scripts on the same key name.

## Verify command

`aitk tooling verify <stack>` is the end-to-end validator. Scaffolds fresh, syncs, runs `lint:fix`, `check`, `test:e2e`, and `screenshot`, asserts screenshot artifacts, reports a results matrix. Use it after any change to `tooling/<stack>/`, `scripts/tooling/sync.sh`, or `scripts/lib/inject.sh`.

- The `[verify] prepare` manifest field declares post-scaffold setup that runs before sync. Use for integrations that can not ship as golden configs (astro's `bunx astro add react`).
- Tmp dir auto-removes on success. Keeps on failure. Use `--keep` to inspect after a green run.

## Cspell seeds

Seed files merge across layers. Each stack contributes words to the target's `.cspell/tech-stack.txt` via `merge_seed_file` in `scripts/lib/inject.sh`. Do not duplicate terms across layers. Place each word in the narrowest layer that needs it (toolkit-ecosystem → `base`, web-universal → `web`, framework-specific → the adapter).

## Reference

- `docs/tooling.md`: system overview, configs vs seeds vs references, extends chain, manifest authoring
- `prompts/tooling-reference.md`: conventions for writing reference.md docs
