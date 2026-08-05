---
title: lib
description: The four shared bash libraries, the functions each exports, and where the TypeScript equivalents sit
---

# lib

`scripts/lib/` holds the functions domain scripts source and never execute. Each file owns one concern, and the surfaces below are what a session reads before adding a helper that already exists. `worktree.sh` is documented with the verification stage that calls it, in `.claude/context/scripts/core.md`.

## `ui.sh`

Source this in any script that needs terminal output. When `AITK_NON_INTERACTIVE=1` is set, `select_option` auto-selects the first option and `ask` returns the default without blocking. `select_or_route_scenario` reads `SANDBOX_SCENARIO` and skips the picker when set, letting agents target a specific scenario via `aitk sandbox <cat>:<cmd> <scenario>`. It also provides the color palette.

- `open_timeline` and `close_timeline`: open `┌` with an optional banner and close `└` on stderr. Pair with `trap … EXIT`
- `log_info`, `log_warn`, `log_error`, `log_step`, `log_add`, and `log_rem`: framed log lines on stderr. `log_error` exits 1
- `select_option`: interactive picker. Sets `SELECTED_OPTION` and errors with a framed message on non-TTY stdin
- `ask`: prompt for a value with a default. Exports the result to a named variable
- `select_or_route_scenario`: sandbox-aware picker. Skips when `SANDBOX_SCENARIO` is set
- `guard_root`: rejects the toolkit root as a target
- `require_project_root`: errors when run outside the repo or inside a sandbox

## `gov.sh`

Narrowed to one function. The payload builder that used to live here is `src/gov/payload.ts`, and `strip_frontmatter` is `src/frontmatter.ts`.

- `rule_subdir`: emit a source rule's subdirectory relative to the rules root, or empty when the rule sits at the root. Stays bash permanently

`rule_subdir` has three remaining call sites across two sandbox scenarios, which stay bash by decision. `manage-sandbox.sh` dropped its own caller when gov injection moved to the real installer, so the dispatcher no longer sources `gov.sh` at all. `ruleSubdir` in `src/gov/install.ts` is the TypeScript copy the migrated installer uses. The two must agree, since a rule installed to the wrong subdirectory is one the sandbox scenarios then fail to find.

The bash `strip_frontmatter` treated the first `---` on any line as the start of a frontmatter block, so a document whose body carried two horizontal rules lost everything between them. `stripFrontmatter` in `src/frontmatter.ts` anchors to the first line instead and leaves such a body intact. The docs migration took the TypeScript reading, which means `aitk docs <topic>` now emits sections the bash silently swallowed.

The divergence is latent on the current corpus. All 22 documents under `docs/` and `.claude/context/` strip byte-identically under both, so the fix guards documents not yet written rather than repairing today's output. Three other inputs diverge and each favors the TypeScript: a file with no trailing newline, a block opening on line 2, and an unterminated block. The last two are the ones worth knowing, since the bash emitted nothing at all for an unterminated block and swallowed a mid-document block that was never frontmatter.

## `tooling.sh`

Consumed by `scripts/tooling/{ref,verify,create}.sh` for discovery and name validation, and by `scripts/core/verify.sh` and `scripts/core/check-seed-independence.sh` for seed discovery. `listStacks` in `src/tooling/manifest.ts` is the TypeScript equivalent, and it discovers by `manifest.toml` rather than by directory.

- `list_tooling_stacks`: emit names of every directory under `tooling/`, minus excluded
- `is_tooling_stack_excluded`: return 0 if the name is in `TOOLING_STACK_EXCLUDE`, 1 otherwise
- `collect_seed_roots`: emit every `tooling/*/seeds` directory holding a `.claude/`, relative to `PROJECT_ROOT`

`collect_seed_roots` serves the two stages that measure seed content, Seed standards and Seed independence. Both discover through it rather than naming a stack, so one glob decides what a seed stage covers and a stack seeding `.claude/` later arrives covered with no edit to either caller.

## `frontmatter.sh`

Sourced by `scripts/docs/list.sh`, `scripts/standards/list.sh`, and `scripts/core/regen-skill-references.sh`. The index engine that used to sit alongside this function is TypeScript now, in `src/indexes/`.

- `read_frontmatter_field`: read a YAML field from a markdown file's frontmatter. Strips wrapping quotes
