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
- When one `##` section covers more than one sub-concern, split its bullets into `###` subgroups, one subgroup per sub-concern. A flat bullet list under an `##` covers a single sub-concern. Roughly seven bullets is a signal to split, not a hard cap.
- Order groups from the most-used rule down to the edge case.

## Rules

- Write rules as imperative bullets: one rule per bullet, one concern per group.
- State the forbidden shape rather than enumerating allowed options, so a rule survives new categories.
- Cut any rule that resists a crisp one-line phrasing.
- Do not pad with filler prose. Every line earns its place as a usable reference entry.

## Success criterion

- State what a conforming artifact achieves, not only what shape it takes. A standard that specifies structure exhaustively and success nowhere cannot be argued against, only edited on taste.
- Write the criterion as a small set of questions the artifact must answer, or a task a reader must be able to complete from it. Keep it checkable by a person in one sitting.
- Place it near the top, above the shape rules it governs. The shape rules are the means and the criterion is the test.
- Say that an artifact failing the criterion is non-conforming even when it satisfies every shape rule. Without that line the criterion reads as advice.
- Add a criterion to an existing standard when that standard is next exercised, not in a sweep. A criterion written without a failure to point at is the taste-based edit this section exists to prevent, so a standard with no criterion yet is a known gap rather than a violation.

## Changing a standard

- Change a standard on a failure, not on a finding. A finding is that the docs say X or a paper suggests Y. A failure is a conforming artifact that satisfied every shape rule and still missed the success criterion.
- Park findings wherever the project tracks pending work, or in the standard's own backlog section when it tracks none. They are hypotheses to test, not instructions to apply.
- Cite the failing artifact in the change that fixes it, so the next reader can tell which rules were paid for by evidence.

## Examples

- Include examples only where a rule is non-obvious. A self-evident rule needs none.
- When shown, label them `### Correct` and `### Incorrect` with an inline `# reason` on each entry.
- Keep to two or three entries. Show the pattern, not a catalog.
- Keep each entry a short one-liner or command. Do not write multi-line correct and incorrect function blocks.
