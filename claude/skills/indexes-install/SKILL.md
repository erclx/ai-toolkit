---
name: indexes-install
description: Bootstraps the toolkit's `index.md` system in a target project. Scans for markdown-heavy folders, drafts `title` and `description` frontmatter, scaffolds `index.md` per chosen folder, and runs `aitk indexes regen` to validate. Use when asked to "set up indexes", "bootstrap indexes", "add index.md to this project", or "install indexes". Assumes the `aitk` CLI is on PATH.
---

# Indexes install

Adds the index.md system to a project that does not have it. Operates in the active Claude session: Claude reads files, drafts frontmatter, confirms with the user, and writes. The CLI handles validation and regeneration only.

Read `docs/indexes.md` from the toolkit if context on the system is needed before scanning.

## Scope

- Bootstrap un-indexed folders only. Skip folders that already contain an `index.md`.
- All-or-nothing per chosen folder. Every `*.md` sibling in a chosen folder gets `title` and `description` injected, or none does. Partial migration creates folders that hard-error on regen.

## Scan

Walk the project root for folders containing three or more sibling `*.md` files. Prune `.git`, `node_modules`, `.claude`, anything matched by `.gitignore`, and any folder that already contains an `index.md`.

For each candidate, capture:

- Folder path relative to project root
- Sibling count
- Existing frontmatter coverage (how many siblings already carry `title` and `description`)

## Present candidates

Output one line per candidate:

```plaintext
- docs/         (8 files, 0/8 with frontmatter)
- guides/       (5 files, 2/5 with frontmatter)
- references/   (3 files, 0/3 with frontmatter)
```

Ask the user which to bootstrap. Accept folder paths, `all`, or `none`. The user can also force a folder with fewer than three siblings by naming it explicitly.

## Draft frontmatter

For each chosen folder, read every `*.md` sibling and draft frontmatter:

- `title`: derived from the first H1. If absent, derive from the filename in sentence case.
- `description`: one line summarizing the file's purpose, drawn from the first paragraph after the H1. Keep under 100 characters, sentence case, no trailing period, no leading article.

Surface every drafted entry to the user grouped by file:

```plaintext
docs/architecture.md
  title: Architecture
  description: System boundaries, data flow, and module responsibilities
```

The user accepts, edits, or rejects per file. Offer "accept all remaining" once the user confirms two in a row to keep the loop short.

Never write drafts before the user confirms. Drafted text is a proposal, not a commit.

## Scaffold the folder index

Compose `index.md` for each chosen folder with:

```markdown
---
title: <folder name in sentence case, user-editable>
subtitle: <one-line folder purpose, user-editable>
---
```

Surface the proposed `title` and `subtitle` and let the user edit before writing.

## Inject

After all confirmations, write frontmatter into each sibling and `index.md` into each folder. Use a single batched write per file. Preserve existing content below the frontmatter block. If a sibling already has frontmatter without `title` or `description`, merge in the missing fields. Do not touch files the user rejected.

## Validate

Run from the project root:

```bash
aitk indexes regen --dry-run --json
```

Parse the JSON. On any `error` action, surface the file and reason and stop. On `would-write` for the bootstrapped folders, the dry-run is healthy. Run for real:

```bash
aitk indexes regen
```

Report the `written` count.

## Offer the convention seed

First check whether `CLAUDE.md` exists in the project root. If absent, do not scaffold one. Skip the seed install with this exact message:

```plaintext
No CLAUDE.md in the project. Skipping convention seed.
To add the convention later, run `aitk tooling sync` or `aitk init`,
then re-invoke this skill.
```

If `CLAUDE.md` exists, check it for an existing `## Indexes` section:

```bash
grep -l '^## Indexes' CLAUDE.md 2>/dev/null
```

If the section is present, skip the seed silently.

If `CLAUDE.md` exists but has no `## Indexes` section, offer to install the canonical convention block. The text below is the source of truth and is mirrored in `tooling/claude/seeds/CLAUDE.md`. Paste it verbatim. Do not rewrite, paraphrase, condense, or add punctuation.

```markdown
- When a folder has an `index.md`, check it before reading individual files in that folder.
- For folders where an agent browses to pick a document, `index.md` is regenerated from each file's frontmatter. Do not hand-edit `index.md`. Code folders and scratch folders do not need one.
- Every `index.md` carries its own frontmatter (`title`, `subtitle`) that the walker preserves. To keep a folder's `index.md` hand-edited, add `auto: false` to its frontmatter.
```

Append a new `## Indexes` section at the end of the file containing the three lines. Do not touch any other section.

## Closeout

Always emit this block as the final message of the skill run. Do not skip it regardless of how the seed step concluded (installed, already present, declined, or skipped because no `CLAUDE.md` exists). Output exactly one closeout, even if the seed step paused for user input. Resume the flow after the user responds and emit the closeout next.

Format:

```plaintext
Bootstrap complete.

Folders bootstrapped:
- <path> (<n> files)

Drafts: <n> accepted, <n> edited, <n> rejected
Convention seed: <installed | already present | declined | skipped (no CLAUDE.md)>

Optional maintenance (opt in, the skill does not configure these):
- lint-staged entry in .lintstagedrc.json:
    "**/*.md": "aitk indexes regen"
- Claude Code PostToolUse hook on Edit and Write matching **/*.md running:
    aitk indexes regen
```

Replace bracketed values with the values from this run. Drop the "Folders bootstrapped" line if zero folders were chosen.

## Reference

- `docs/indexes.md`: system rationale, frontmatter contract, when to adopt
- `docs/agents.md`: `aitk indexes regen` flags, exit codes, JSON shape
