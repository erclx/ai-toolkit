---
name: standards-audit
description: What the standards audit is for, the gaps it closes, and the fixing it deliberately refuses
---

# Standards audit requirement

## Gap

Without this skill, markdown ships unchecked against the authoring standards it was written under. A session fresh from writing prose does not reopen the standard it was meant to follow, banned punctuation survives because it reads fine, and the mapping from a file to the standards governing it gets re-derived by guess on every pass.

## Must

- Scope the audit to markdown the project hand-authors, so a generated file is not reported against a standard nobody applies to it
- Decide which standards govern each changed file, rather than auditing every file against every standard
- Grep for the violations a standard makes mechanically detectable, because reading alone misses occurrences
- Report each finding with a file and a line, grouped so one file is one fix pass

## Must not

- Fix a violation, or propose the fix inline. The cheap swap satisfies the grep and breaks the rule the grep was standing in for.
- Enumerate specific rules or tokens from a standard. The standard is the list, and a copy of it here drifts the moment the standard changes.

## Guards

- No markdown changed since main: stop with a pass, not an error
- No installed standards to audit against: stop and say where they come from

## Out of scope

- Code style and structure, which `.claude/rules/` governs and Claude Code loads directly
- Whether a standard is itself correct. A finding against the corpus is an argument to change the standard, and that is a standards edit rather than an audit result.
- Persisting a report. The diff is the living state and the audit is a check against it at a moment.
