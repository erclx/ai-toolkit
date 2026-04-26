---
name: aitk-governance
description: Governance rules and stack definitions. Source `.mdc` files install as path-scoped Claude rules in `.claude/rules/`. Use for adding rules, editing stacks, or install and sync.
---

# Governance

Read `docs/governance.md` for system overview, numbering scheme, and stack structure before editing.

## Rules

- Read `docs/governance.md` for the numbering ranges before picking a number for a new rule.
- Follow `prompts/governance-rules.md` for frontmatter, heading style, and bullet conventions when writing a new `.mdc` file.
- `strip_frontmatter`, `build_rules_payload`, and `rule_subdir` live in `scripts/lib/gov.sh`. Do not duplicate.

## Install path

- `aitk gov install <stack> <target>` writes `.claude/rules/<subdir>/<rule>.md` as a passthrough copy. Source files carry the Claude shape directly, so the install only flips `.mdc` to `.md` and preserves subdirectories.
- `aitk gov sync` diffs `.claude/rules/` against source. It also removes any stale `.claude/GOV.md` left over from the retired build.
- `aitk gov build` produces a single concatenated paste-payload at `.claude/.tmp/gov/rules.md` from `.claude/rules/`.

## Stacks

- New stack: create a `.toml` in `governance/stacks/`, set `extends`, list rule names without `.mdc`

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
- `prompts/governance-rules.md`: conventions for writing .mdc rule files
