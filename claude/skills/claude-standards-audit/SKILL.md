---
name: claude-standards-audit
description: Audits changed markdown files against applicable authoring standards (prose, skill, readme, branch, pr) and reports violations without fixing. Maps each file to its standards, greps for banned tokens, and groups findings by file. Use when asked to "audit prose", "audit standards", "check standards", "standards audit", or after editing markdown where standards compliance matters. Do NOT fix violations. Reporting only.
---

# Claude standards audit

## Guards

- Run `git diff main --name-only`. If no markdown files changed, stop: `✅ No markdown changes to audit.`
- If `standards/` does not exist at the project root, stop: `❌ No standards/ directory. Install toolkit standards first.`

## Step 1: scope the audit

Get the changed file list:

```bash
git diff main --name-only
```

Filter to markdown (`.md`). Drop generated files the project does not hand-author (`index.md` when `auto: false` is absent, any file in a gitignored directory).

## Step 2: map files to standards

For each changed markdown file, pick the applicable standards:

- Any markdown with prose: `standards/prose.md`
- `SKILL.md` under `.claude/skills/` or `claude/skills/`: also `standards/skill.md`
- `README.md` at any level: also `standards/readme.md`
- Branch names proposed in the session: `standards/branch.md`
- PR titles or bodies drafted in the session: `standards/pr.md`

Skip a file if none of the standards applies.

## Step 3: read standards and audit

Read each applicable standard once. For each changed file, audit against every rule:

- **Pattern rules**: grep the file for banned tokens called out by the standard. Grep is authoritative. Reading alone misses occurrences.
- **Judgment rules**: check each rule in context. Apply "ban the shape not instances", "crisp one-line phrasing", and "imperative voice" from `standards/skill.md` where relevant.

For prose specifically, grep every changed markdown file for `—` and `;`. Both are banned in prose.

## Step 4: report

Group findings by file with line references. Use this shape:

```markdown
path/to/file.md

- L12: em dash in prose
- L34: semicolon used to join clauses
- L67: bullet ends with period but is a single fragment
```

If clean, respond with `✅ No violations.`

Reporting only. Do not rewrite any file, swap any punctuation, or propose fixes inline. Fixes are a separate user-initiated step; lazy swaps (semicolon to period, em dash to comma) violate the prose rule against shallow substitution.

## Output

Chat output is the full report. This skill does not persist a file. The audit is a momentary check and living state is the diff itself.
