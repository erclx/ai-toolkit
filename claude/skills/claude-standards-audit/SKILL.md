---
name: claude-standards-audit
description: Audits changed markdown files against applicable authoring standards (prose, skill, readme, branch, pr) and reports violations without fixing. Maps each file to its standards, greps for banned tokens, and groups findings by file. Use when asked to "audit prose", "audit standards", "check standards", "standards audit", or after editing markdown where standards compliance matters. Do NOT fix violations. Reporting only.
---

# Claude standards audit

## Guards

- Run `git diff main --name-only`. If no markdown files changed, stop: `✅ No markdown changes to audit.`
- If `.claude/standards/` does not exist, stop: `❌ No .claude/standards/ directory. Install toolkit standards first.`

## Step 1: scope the audit

Get the changed file list:

```bash
git diff main --name-only
```

Filter to markdown (`.md`). Drop generated files the project does not hand-author (`index.md` when `auto: false` is absent, any file in a gitignored directory).

## Step 2: map files to standards

For each changed markdown file, pick the applicable standards:

- Any markdown with prose: `.claude/standards/prose.md`
- `SKILL.md` under `.claude/skills/` or `claude/skills/`: also `.claude/standards/skill.md`
- `README.md` at any level: also `.claude/standards/readme.md`
- Branch names proposed in the session: `${CLAUDE_SKILL_DIR}/references/branch.md`
- PR titles or bodies drafted in the session: `${CLAUDE_SKILL_DIR}/references/pr.md`

Skip a file if none of the standards applies.

## Step 3: read standards and audit

Read each applicable standard once. For each changed file, audit against every rule:

- **Pattern rules**: grep the file for every token the standard bans. Grep is authoritative. Reading alone misses occurrences.
- **Judgment rules**: check each rule in context against the standard that states it.

Every changed markdown file gets the prose pattern pass, since `.claude/standards/prose.md` applies to all of them. Take the banned tokens from that standard at read time rather than from a list held here.

## Step 4: report

Group findings by file with line references. Use this shape:

```markdown
path/to/file.md

- L12: em dash in prose
- L34: semicolon used to join clauses
- L67: bullet ends with period but is a single fragment
```

If clean, respond with `✅ No violations.`

Reporting only. Do not rewrite any file, swap any punctuation, or propose fixes inline. Fixes are a separate user-initiated step because lazy swaps (semicolon to period, em dash to comma) violate the prose rule against shallow substitution.

## Output

Chat output is the full report. This skill does not persist a file. The audit is a momentary check and living state is the diff itself.
