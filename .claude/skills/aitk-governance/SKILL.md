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

## Rule audit

After writing or revising a `.mdc` rule, audit each bullet against these criteria. Trigger phrases: "audit this rule", "review the governance rule", "is this rule worth keeping".

For each bullet, return `✅ keep`, `⚠️ revise`, or `❌ drop` with a one-line reason.

1. **Mechanical, not stylistic.** A reviewer must be able to grep for the violation. `Use X over Y` beats `prefer X` or `be careful with Z`.
2. **Catches a real footgun.** Violation should produce a concrete bug class (data injection, blocking I/O in async, runtime introspection breakage). If the worst case is "code looks slightly off," drop it.
3. **Not redundant with the toolchain.** Skip anything mypy strict, ruff, prettier, or cspell already enforces. Rules cover what tools cannot.
4. **Uncontested.** If the community is genuinely split (`from __future__ import annotations` is the textbook case for Python), drop the bullet or pick a side with explicit rationale tied to the stack.
5. **Scoped to observable patterns.** "Define a project exception hierarchy" is borderline because it cannot be grepped. Keep these sparse.
6. **Frontmatter integrity.** `description` is sentence case, under 100 chars, no trailing period. `globs` present iff `alwaysApply: false`. Numeric prefix matches the domain range in `docs/governance.md`.
7. **Template precedent.** H1 ALL CAPS, H2 sentence case, period-terminated bullets. Match `100-typescript.mdc` and `200-react.mdc` shape.

For multi-rule audits, group findings by file and put the per-file verdict count on the first line.

## Reference

- `docs/governance.md`: system overview, numbering scheme, install vs sync vs build, stacks
- `prompts/cursor-rules.md`: conventions for writing .mdc rule files
