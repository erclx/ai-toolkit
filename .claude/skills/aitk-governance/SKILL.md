---
name: aitk-governance
description: Cursor governance rules and stack definitions. Use for adding rules, editing stacks, or install and sync.
---

# Governance

Read `docs/governance.md` for system overview, numbering scheme, and stack structure before editing.

## Rules

- Read `docs/governance.md` for the numbering ranges before picking a number for a new rule.
- Follow `prompts/cursor-rules.md` for frontmatter, heading style, and bullet conventions when writing a new `.mdc` file.
- `strip_frontmatter` and `build_rules_payload` live in `scripts/lib/gov.sh`, sourced by both `gov/build.sh` and `claude/prompt.sh`. Do not duplicate.

## Stacks

- New stack: create a `.toml` in `governance/stacks/`, set `extends`, list rule names without `.mdc`.

## Sync checklist

When adding a rule:

- Add it to the relevant `rules` array in `governance/stacks/*.toml` if it belongs to a stack

When adding a stack:

- Create `.toml` in `governance/stacks/`, set `extends`, list rules

## Reference

- `docs/governance.md`: system overview, numbering scheme, install vs sync vs build, stacks
- `prompts/cursor-rules.md`: conventions for writing .mdc rule files
