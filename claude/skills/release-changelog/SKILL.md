---
name: release-changelog
description: Generates a changelog entry from commits and staged changes since main and appends it to CHANGELOG.md. Use when cutting a release, asking "update the changelog", or writing release notes.
---

# Release changelog

Read these files from the project root in parallel:

- `standards/changelog.md`: categories, formatting, and filtering rules
- `standards/prose.md`: prose conventions for all generated text

## Context

Run these commands in parallel to gather context:

- `cat CHANGELOG.md 2>/dev/null || echo "NO_CHANGELOG"`
- `git log --pretty=format:"%h %s" --no-merges main..HEAD 2>/dev/null || echo "NO_COMMITS"`
- `git diff --cached -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_STAGED"`

## Guards

- If commits output is `NO_COMMITS` and staged diff is `NO_STAGED`, stop:
  `❌ No commits or staged changes ahead of main. Nothing to changelog.`

## Rules

- Use `## [Unreleased]` for draft state unless a version is specified.
- Only append new entries. Never modify, reorder, or remove existing entries.
- Exclude commits filtered by changelog.md rules.
- Do not generate version comparison URLs.
- Do not write to file before showing the preview.
- If staged diff is present, synthesize additional entries from the diff for changes not yet reflected in the commit log. Use the diff content and session context to infer intent.

## Response format

### Preview

- **Version:** `[Unreleased]` or `<version>`
- **Entries:** <count> changes across <categories>
- **New entries:**

<preview of changelog entries to be added>

### Action

After outputting the preview, append the new entries to `CHANGELOG.md` following changelog.md format exactly. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.
