---
name: claude-seed-sync
description: Audits a project's installed Claude seed docs against the toolkit's current seed source and proposes per-section edits without overwriting customizations. Use when asked to "sync seeds", "update my seeds", "check seed drift", "did the toolkit seeds change", or when reconciling `CLAUDE.md` and `.claude/` preambles after an upstream toolkit update.
---

# Claude seed sync

Surfaces drift between the toolkit's current seed docs and what was installed in this project, then proposes targeted edits. The CLI emits seed content. This skill diffs, reasons, and writes the proposal to a review file. It does not write target files until the user confirms.

## Guards

- If the `aitk` CLI is not on PATH, stop: `❌ aitk CLI not found. Install the toolkit first.`
- If no `.claude/` directory exists at the project root, stop: `❌ No .claude/ directory found. Run aitk claude init first.`

## Step 1: read toolkit seeds

Run from the project root:

```bash
aitk claude seeds list --json 2>/dev/null
```

The JSON is an array of `{name, source, target, content}`. `target` is the path relative to the project root where each seed installs.

## Step 2: read installed copies

For each seed in the JSON, read the file at its `target` path from the project root. Run reads in parallel. Mark missing files for **Add** treatment. Skip non-text seeds (`.json`) for section diffing. Record a one-line note in the scope table that the user can compare manually.

## Step 3: diff per section

For each seed file present in both sides, parse by `##` headers and compare section by section.

- **Identical:** ignore.
- **Toolkit-only section** (present in source, absent in target): candidate to **Add**.
- **Target-only section** (present in target, absent in source): preserve, never propose removal. These are user customizations.
- **Drifted section** (present in both, content differs): candidate to **Update**.
  - If the target version looks customized (extra bullets, project-specific paths, filled-in placeholders), call it out as **Customized**. Default action: skip, record in the scope table only, never numbered.
  - If the target version looks like the original toolkit version with the toolkit having moved on, call it out as **Stale**. Default action: propose update.

The user judges intent. The skill makes the judgment legible.

### Absorbed-already check

Before proposing an Update, grep the target section for the seed text's keywords. If the rule is already implied by an adjacent bullet in the target version, drop the proposal and record the section as `in sync` in the scope table.

## Step 4: write the proposal to the review file

Derive a slug from the current git branch: run `git branch --show-current` and replace `/` with `-`. Fall back to `latest` on empty output.

Write the full proposal to `.claude/review/seed-audit-<slug>.md` at the main worktree root. Do not print the proposal inline.

Structure: a summary block at the top, a legend, a scope table, then one H2 per numbered item. Number items across all files so the user can reference them by number. Fuse the status, action, and target into each H2. Every item starts as 📝 pending.

````markdown
# Seed audit: <slug>

**Pending:** <all numbers>

Legend: ✅ applied · ⏭ skipped · 📝 pending

How to respond: fill in `Decision:` per item (`apply` or `skip`), then ping. Chat shortcut: `all`, `none`, or a list of numbers.

## Scope

| File       | Status     | Note                         |
| ---------- | ---------- | ---------------------------- |
| `<target>` | diffed     | <counts>                     |
| `<target>` | in sync    |                              |
| `<target>` | skipped    | non-text, compare manually   |
| `<target>` | customized | <section> skipped by default |

## 1. 📝 Update → `<target-path>` / <section>

Why: <one-line reason>

**Project version (current):**

``​`markdown
<current section body>
​```

**Seed version (proposed):**

``​`markdown
<seed section body>
​```

Decision:

## 2. 📝 Add → `<target-path>` / <section>

Why: <one-line reason>

**Seed version (proposed):**

``​`markdown
<seed section body>
​```

Decision:
````

Add items omit the project block. Customized sections appear in the scope table only, never numbered. A file with no drift still appears in the scope table as `in sync`.

After writing, tell the user `✅ Wrote proposal to .claude/review/seed-audit-<slug>.md`. Ask them to fill in `Decision:` per item, then re-ping or use the chat shortcut.

Rewrite the review file in place whenever the proposal changes mid-review. The file stays the source of truth for the current decisions.

## Step 5: apply

Re-read the review file as source of truth. For each item, parse `Decision:`:

- `apply` (or affirmative): run the `Edit`, flip emoji to ✅.
- `skip`: leave the target section as-is, flip emoji to ⏭.
- `defer` or empty: leave 📝 pending, no action.
- Contains `?` or unrecognized verb: leave 📝 pending, no action.

Chat shortcut: the user replies with `all`, `none`, or a comma-separated list of numbers. Apply only the numbered items.

Apply edits one at a time via `Edit`, replacing one section at a time. Never rewrite a whole file. Claude Code's tool permission dialog is the confirmation gate per edit.

As each item resolves, update its status in the review file: flip the H2 emoji from 📝 to ✅ for applied or ⏭ for skipped. Refresh the summary block counts at the top. Do not delete the review file. It stays as a receipt until the next `claude-seed-sync` run overwrites it or the user clears it.

## After completion

Output one line per action taken:

- `✅ Updated: <target-path> / <section>`
- `⏭ Skipped: <target-path> / <section>`

End with a one-line bucket summary: `✅ Applied: <nums> | ⏭ Skipped: <nums> | 📝 Pending: <nums>`. Omit empty buckets. If anything is pending, remind the user they can fill in a `Decision:` and re-ping, or commit a skip with `skip <nums>` in chat.

If the user accepted nothing, output:

`✅ No changes applied.`
