---
title: Standard reference
description: Shape and content rules for authoring a standard
consumers: create-standard
---

# Standard reference

## Overview

A standard is a target-facing authoring convention for one document type. It installs into a project under `.claude/standards/` and is consumed by skills and developers alike. One standard governs one doc type. Split unrelated conventions into separate files.

## Frontmatter

- Start the file with a frontmatter block carrying `title` and `description`.
- `title`: names the doc type in sentence case, suffixed `reference` (`Commit reference`, `Branch reference`).
- `description`: one line naming what the standard covers. It becomes the index link label on install.

## Structure

- Use sentence case for every heading.
- Flat `##` rule groups for a single-topic standard. Group `##` headers by concern for a multi-topic one.
- Order groups from the most-used rule down to the edge case.

## Rules

- Write rules as imperative bullets: one rule per bullet, one concern per group.
- State the forbidden shape rather than enumerating allowed options, so a rule survives new categories.
- Cut any rule that resists a crisp one-line phrasing.

## Examples

- Include examples only where a rule is non-obvious. A self-evident rule needs none.
- When shown, label them `### Correct` and `### Incorrect` with an inline `# reason` on each entry.
- Keep to two or three entries. Show the pattern, not a catalog.
