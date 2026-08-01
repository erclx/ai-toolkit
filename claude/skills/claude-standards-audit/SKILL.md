---
name: claude-standards-audit
description: Audits changed markdown files against applicable authoring standards (prose, skill, readme, branch, pr) and reports violations without fixing. Maps each file to its standards, greps for banned tokens, and groups findings by file. Use when asked to "audit prose", "audit standards", "check standards", "standards audit", or after editing markdown where standards compliance matters. Do NOT fix violations. Reporting only.
---

# Claude standards audit

## Guards

- Resolve the base ref first, per Diff baseline below, then scope the file list exactly as Step 1 does, fallback included. If no markdown files changed, stop: `✅ No markdown changes to audit.` A guard that reads bare local `main`, or that skips the unusable-baseline fallback, passes the skill clean on a branch it never read.
- If `.claude/standards/` does not exist, stop: `❌ No .claude/standards/ directory. Install toolkit standards first.`

## Diff baseline

Resolve the base ref once and reuse it in the guard and in Step 1:

```bash
git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main 2>/dev/null
```

Prefer `origin/main` over local `main`. On `main` itself the local ref resolves to HEAD, so every committed change drops out of the set and the audit passes clean rather than admitting it cannot see the files.

The baseline is unusable in two cases:

- No merge base resolves against either ref.
- The base equals HEAD, whichever ref resolved it. Nothing is committed ahead of the base to compare against. This is the ordinary shape on `main`, and on a feature branch before its first commit.

An unusable baseline costs only the committed half. Audit `git diff HEAD --name-only` instead and lead the report with `⚠ Baseline unusable. Audited the uncommitted set only.`, so a clean result is never read as a clean branch.

## Step 1: scope the audit

Get the changed file list, substituting `git diff HEAD --name-only` when the baseline is unusable:

```bash
git diff <base> HEAD --name-only
```

Filter to markdown (`.md`). Drop generated files the project does not hand-author (`index.md` when `auto: false` is absent, any file in a gitignored directory).

## Step 2: map files to standards

For each changed markdown file, pick the applicable standards:

- Any markdown with prose: `.claude/standards/prose.md`
- `SKILL.md` under `.claude/skills/` or `claude/skills/`: also `.claude/standards/skill.md`
- `README.md` at any level: also `.claude/standards/readme.md`
- Branch names proposed in the session: `${CLAUDE_SKILL_DIR}/references/branch.md`
- PR titles or bodies drafted in the session: `${CLAUDE_SKILL_DIR}/references/pr.md`

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
