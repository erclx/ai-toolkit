---
name: claude-ux-audit
description: Audits the current UI for incomplete, inconsistent, or confusing patterns. Reads DESIGN.md and WIREFRAMES.md for intent, scans UI files, and outputs observations grouped by surface. Use when asked "audit the UX", "audit the UI", "UX audit", or "find UI roughness". Do NOT use for new feature planning or code changes.
---

# Claude UX audit

## Guards

- If no UI files exist in the project (no JSX, TSX, Vue, Svelte, or HTML under `src/`), stop: `❌ No UI surfaces found to audit.`

## Step 1: read context

Read these in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: project type and conventions
- `.claude/DESIGN.md`: visual intent, tokens, typography, spacing rules
- `.claude/WIREFRAMES.md`: intended UI layout, UI copy, interaction rules
- `.claude/REQUIREMENTS.md`: feature scope and non-goals

## Step 2: identify surfaces

List the UI surfaces in the project. A surface is a distinct screen, page, panel, or major component (e.g. sidepanel, popup, settings page, empty state). Group files by surface. Do not audit speculative or unfinished code flagged in `TASKS.md` as in-progress.

## Step 3: audit each surface

For each surface, look for:

1. **Missing feedback states**: loading, empty, error, disabled, in-progress
2. **Unhandled edge cases**: long strings, overflow, zero items, many items, slow networks
3. **Inconsistencies**: spacing, tone of voice, interaction patterns, icon use, keyboard affordances
4. **Roughness in daily use**: friction, redundant steps, unclear affordances, ambiguous labels

Use `DESIGN.md` and `WIREFRAMES.md` as ground truth for intent. Flag where implementation drifts from documented intent. Observations only, no implementation suggestions or fixes.

## Step 4: report and persist

### Report format

Start with a summary line. Group findings by surface. Omit surfaces with no findings.

```markdown
X observations across N surfaces.

Surface: <name>

- Missing feedback state: <observation>
- Inconsistency: <observation>

Surface: <other>

- Edge case: <observation>
```

If nothing is wrong, use: `✅ No observations.`

### Persist

Derive a slug from the current git branch: run `git branch --show-current` and replace any `/` with `-`. If the result is empty (detached HEAD), use `latest`.

Write the full report directly to `.claude/review/ux-audit-<slug>.md` from the project root. Create the directory if it does not exist. Always overwrite.

If there are no observations, write `✅ No observations.` to the file with a timestamp.

The `.claude/review/` directory is gitignored. Do not stage or commit the file.

### Chat output

Output only the summary line and the file path. Do not repeat the full report in chat.

```plaintext
X observations across N surfaces.
📝 Wrote .claude/review/ux-audit-<slug>.md
```

If no observations: `✅ No observations. Wrote .claude/review/ux-audit-<slug>.md`
