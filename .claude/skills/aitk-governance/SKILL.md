---
name: aitk-governance
description: Governance rules and stack definitions. Source `.mdc` files install as path-scoped Claude rules in `.claude/rules/` (default) or as flat Cursor rules in `.cursor/rules/`. Use for adding rules, editing stacks, or install and sync.
---

# Governance

Read `docs/governance.md` for system overview, numbering scheme, and stack structure before editing.

## Rules

- Read `docs/governance.md` for the numbering ranges before picking a number for a new rule.
- Follow `prompts/cursor-rules.md` for frontmatter, heading style, and bullet conventions when writing a new `.mdc` file.
- `strip_frontmatter`, `build_rules_payload`, `transform_to_claude_rule`, and `rule_subdir` live in `scripts/lib/gov.sh`. Do not duplicate.

## Install targets

- Default install: `aitk gov install <stack> <target>` writes `.claude/rules/<subdir>/<rule>.md` with transformed frontmatter (`globs:` → `paths:`, `alwaysApply: true` → no `paths:` key, `.mdc` → `.md`). Subdirectories are preserved.
- Cursor opt-in: `--target cursor` writes flat `.cursor/rules/<rule>.mdc`. Use only when the target project actually uses Cursor.
- Both: `--target both` writes both surfaces.
- `aitk gov sync` diffs whichever surface exists in the target. It also removes any stale `.claude/GOV.md` left over from the retired build.
- `aitk gov build` produces a single concatenated paste-payload at `.claude/.tmp/gov/rules.md`. Reads `.claude/rules/` first, falls back to `.cursor/rules/`.

## Stacks

- New stack: create a `.toml` in `governance/stacks/`, set `extends`, list rule names without `.mdc`.

## Sync checklist

When adding a rule:

- Add it to the relevant `rules` array in `governance/stacks/*.toml` if it belongs to a stack

When adding a stack:

- Create `.toml` in `governance/stacks/`, set `extends`, list rules

## Rule audit

After writing or revising a `.mdc` rule, audit each bullet against the checklist. Trigger phrases: "audit this rule", "review the governance rule", "is this rule worth keeping".

- Read `.claude/skills/aitk-governance/references/rule-audit.md` for the criteria and output shape.

## Reference

- `docs/governance.md`: system overview, numbering scheme, install vs sync vs build, stacks
- `prompts/cursor-rules.md`: conventions for writing .mdc rule files
