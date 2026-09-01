---
name: claude-ux-audit
description: Audits the current UI for incomplete, inconsistent, or confusing patterns. Reads DESIGN.md and .claude/wireframes/ for intent, scans UI files, and outputs observations grouped by surface. Use when asked "audit the UX", "audit the UI", "UX audit", or "find UI roughness". Do NOT use for new feature planning or code changes, and do NOT use to measure what a running interface costs to paint, which is `claude-ux-measure`.
---

# Claude UX audit

## Guards

- If no UI files exist in the project (no JSX, TSX, Vue, Svelte, or HTML under `src/`), stop: `❌ No UI surfaces found to audit.`
- If the request asks what the interface costs to paint, block, or shift at runtime, run nothing and name `claude-ux-measure`. This skill reads source and reaches no number a browser produces. Contrast is the exception and stays here, since it is computable from the two color values already in the token table.

## Step 1: read context

Read these in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: project type and conventions
- `.claude/DESIGN.md`: visual intent, tokens, typography, spacing rules
- `.claude/wireframes/index.md` + every `.claude/wireframes/<surface>.md`: intended UI layout, UI copy, interaction rules. Surfaces are loaded one file at a time during Step 3. Per `${CLAUDE_SKILL_DIR}/../../standards/wireframes.md`, these carry layout and intent, not implementation detail.
- `.claude/REQUIREMENTS.md`: feature scope and non-goals

## Step 2: identify surfaces

List the UI surfaces in the project. A surface is a distinct screen, page, panel, or major component (e.g. sidepanel, popup, settings page, empty state). Group files by surface. Do not audit speculative or unfinished code flagged in `.canon/tasks/` as in-progress.

## Step 3: audit each surface

For each surface, look for:

1. **Missing feedback states**: loading, empty, error, disabled, in-progress
2. **Unhandled edge cases**: long strings, overflow, zero items, many items, slow networks
3. **Inconsistencies**: spacing, tone of voice, interaction patterns, icon use, keyboard affordances
4. **Roughness in daily use**: friction, redundant steps, unclear affordances, ambiguous labels

Use `.claude/DESIGN.md` and the per-surface `.claude/wireframes/<surface>.md` files as ground truth for intent. For each implementation surface, read the matching wireframe file before flagging drift. Observations only, no implementation suggestions or fixes.

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

Derive `<slug>` per `${CLAUDE_SKILL_DIR}/../../standards/slug.md`. Fall back to `latest` on an empty result.

Write the full report directly to `.canon/review/ux-audit-<slug>.md` at the main worktree root, not the current worktree. See Worktrees in `CLAUDE.md`. Create the directory if it does not exist. Always overwrite.

From a linked worktree the file-editing tools refuse that path, so the report goes out through `Bash`. Send the `mkdir -p` and the heredoc as two plain commands rather than joining them with `&&`, which is refused as compound.

If there are no observations, write `✅ No observations.` to the file with a timestamp.

The `.canon/review/` directory is gitignored. Do not stage or commit the file.

### Chat output

Output only the summary line and the file path. Do not repeat the full report in chat.

```plaintext
X observations across N surfaces.
📝 Wrote .canon/review/ux-audit-<slug>.md
```

If no observations: `✅ No observations. Wrote .canon/review/ux-audit-<slug>.md`
