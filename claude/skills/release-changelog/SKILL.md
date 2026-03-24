---
name: release-changelog
description: Generates a changelog entry from commits since main and appends it to CHANGELOG.md. Use when cutting a release, asking "update the changelog", or writing release notes.
---

# Release changelog

Before generating entries, read:

- `standards/changelog.md`: categories, formatting, and filtering rules
- `standards/prose.md`: prose conventions for all generated text

Follow them exactly.

## Context

Run these commands in parallel to gather context:

- `cat CHANGELOG.md 2>/dev/null || echo "NO_CHANGELOG"`
- `git log --pretty=format:"%h %s" --no-merges main..HEAD 2>/dev/null || echo "NO_COMMITS"`

## Guards

- If commits output is `NO_COMMITS`, stop:
  `❌ No commits ahead of main. Nothing to changelog.`

## Rules

- Use `## [Unreleased]` for draft state unless a version is specified.
- Only append new entries. Never modify, reorder, or remove existing entries.
- Exclude commits filtered by changelog.md rules.
- Do not generate version comparison URLs.
- Do not write to file before showing the preview.

## Response format

### Preview

- **Version:** `[Unreleased]` or `<version>`
- **Entries:** <count> changes across <categories>
- **New entries:**

<preview of changelog entries to be added>

### Action

On confirmation, append the new entries to `CHANGELOG.md` following changelog.md format exactly.
