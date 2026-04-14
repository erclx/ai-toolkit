---
name: aitk-governance
description: Cursor governance rules and stack definitions. Use for adding rules, editing stacks, or install and sync.
---

# Governance

## Rules

- Rules live in `governance/rules/` organized by domain subdirectory, but flatten into `.cursor/rules/` on sync. Cursor reads flat.
- Rules follow a numbering scheme by domain. Read `docs/governance.md` for the ranges before picking a number.
- Follow `prompts/cursor-rules.md` for frontmatter, heading style, and bullet conventions when writing a new `.mdc` file.
- New `.mdc` file anywhere under `governance/rules/` is auto-discovered. No other changes needed to register it.
- `strip_frontmatter` and `build_rules_payload` live in `scripts/lib/gov.sh`, sourced by both `gov/build.sh` and `claude/prompt.sh`. Do not duplicate.

## Stacks

- Stack `.toml` files live in `governance/stacks/`. `extends` resolves recursively and the full deduplicated rule set is installed.
- New stack: create a `.toml` in `governance/stacks/`, set `extends`, list rule names without `.mdc`.

## Sync checklist

When adding a rule:

- Add it to the relevant `rules` array in `governance/stacks/*.toml` if it belongs to a stack

When adding a stack:

- Create `.toml` in `governance/stacks/`, set `extends`, list rules

## Full reference

- `docs/governance.md`: system overview, numbering scheme, install vs sync vs build, stacks
- `prompts/cursor-rules.md`: conventions for writing .mdc rule files
