---
name: aitk-governance
description: Governance rules and stack definitions. Source `.md` files install as path-scoped Claude rules in `.claude/rules/`. Use for adding rules, editing stacks, or install and sync.
---

# Governance

Read `.claude/context/governance.md` for system overview, numbering scheme, and stack structure before editing.

## Rules

- Read `.claude/context/governance.md` for the numbering ranges before picking a number for a new rule.
- Follow `.claude/standards/rule.md` for frontmatter, heading style, and bullet conventions when writing a new rule file.
- `rule_subdir` is all that is left in `scripts/lib/gov.sh`. Frontmatter stripping is `src/frontmatter.ts`. Do not duplicate either.
- `sync` and `build` are TypeScript. The sync engine is `src/sync/engine.ts`, the gov adapter is `src/gov/adapter.ts`, and the payload builder is `src/gov/payload.ts`. `install` and `list` are still bash under `scripts/gov/`.
- Changing what counts as a change, or where a rule's source lives, belongs in the adapter. Changing the scan report, the prompt, or the apply loop belongs in the engine, where snippets and standards will inherit it.

## Install path

- `aitk gov install <stack> <target>` writes `.claude/rules/<subdir>/<rule>.md` as a passthrough copy. Source files carry the Claude shape directly, so the install copies the `.md` file as-is and preserves subdirectories.
- `aitk gov sync` diffs `.claude/rules/` against source. It also removes any stale `.claude/GOV.md` left over from the retired build.
- `aitk gov build` produces a single concatenated paste-payload at `.claude/.tmp/gov/rules.md` from `.claude/rules/`.

## Stacks

- New stack: create a `.toml` in `governance/stacks/`, set `extends`, list rule names without `.md`

## Sync checklist

When adding a rule:

- Add it to the relevant `rules` array in `governance/stacks/*.toml` if it belongs to a stack

When adding a stack:

- Create `.toml` in `governance/stacks/`, set `extends`, list rules

## Rule audit

After writing or revising a rule, audit each bullet against the checklist. Trigger phrases: "audit this rule", "review the governance rule", "is this rule worth keeping".

- Read `.claude/skills/aitk-governance/references/rule-audit.md` for the criteria and output shape.

## Reference

- `.claude/context/governance.md`: system overview, numbering scheme, install vs sync vs build, stacks
- `.claude/standards/rule.md`: conventions for writing rule files
