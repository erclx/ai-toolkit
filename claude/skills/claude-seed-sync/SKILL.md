---
name: claude-seed-sync
description: Audits a project's installed Claude seed docs against the toolkit's current seed source and proposes per-section edits without overwriting customizations. Use when asked to "sync seeds", "update my seeds", "check seed drift", "did the toolkit seeds change", or when reconciling `CLAUDE.md` and `.claude/` preambles after an upstream toolkit update.
---

# Claude seed sync

Surfaces drift between the toolkit's current seed docs and what was installed in this project, then proposes targeted edits. The CLI emits seed content. This skill diffs and reasons. It does not write files until the user confirms each edit.

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

For each seed in the JSON, read the file at its `target` path from the project root. Run reads in parallel. Mark missing files for "Add" treatment. Skip non-text seeds (`.json`) for section diffing. Flag a one-line note that the user can manually compare instead.

## Step 3: diff per section

For each seed file present in both sides, parse by `##` headers and compare section by section.

- **Identical:** ignore.
- **Toolkit-only section** (present in source, absent in target): candidate to **Add**.
- **Target-only section** (present in target, absent in source): preserve, never propose removal. These are user customizations.
- **Drifted section** (present in both, content differs): candidate to **Update**.
  - If the target version looks customized (extra bullets, project-specific paths, filled-in placeholders), call it out as **Customized**. Default action: **skip**, ask the user before overwriting.
  - If the target version looks like the original toolkit version with the toolkit having moved on, call it out as **Stale**. Default action: **propose update**.

The user judges intent. The skill makes the judgment legible.

## Step 4: report

Group findings by file. For each file:

```
<target-path>
  + Add:        <section name>     : <one-line reason>
  ~ Update:     <section name>     : <one-line reason>
  ! Customized: <section name>     : skipped by default
  = Unchanged:  <count> sections
```

End with a numbered list of proposed edits across all files, each with a short label like `1. CLAUDE.md / Rules → update`.

## Step 5: apply

Ask which edits to apply: `all`, `none`, a comma-separated list of numbers, or per-file. Apply only what the user picks. Use the `Edit` tool, replacing one section at a time. Never rewrite a whole file. Never touch sections marked **Customized** unless the user explicitly opted in by number.

Claude Code's tool permission dialog is the confirmation gate for each `Edit` call.

## After completion

Output one line per edit applied:

`✅ Updated: <target-path> / <section>`

If the user accepted nothing, output:

`✅ No changes applied.`
