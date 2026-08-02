---
title: Standard reference
description: Shape and content rules for authoring a standard
---

# Standard reference

Applies to each authored standard in the folder. Skip for `index.md`, which is generated rather than authored.

## Overview

A standard is a target-facing authoring convention for one document type, or for one attribute carried across every document. It installs into a project under `.claude/standards/` and is consumed by skills and developers alike. This file governs itself, so every rule below applies to it.

## Scope

Governs what an authored standard contains: its stated jurisdiction, success criterion, frontmatter, structure, and rule phrasing.

Does not govern:

- The voice, punctuation, and formatting a standard is written in: `prose.md`
- The shape of any artifact a standard governs, which is that standard's own subject
- Which standards a project installs and where they land, which is a delivery concern rather than an authoring one

## What a working standard looks like

A standard answers these questions. Each can be answered wrong, which is what makes them a test rather than a preamble.

- Which single document type or attribute does this govern, and where does it apply?
- Can an author who has seen no example produce a conforming document from this file alone?
- Does every rule state a shape the document must have, rather than a fact about the repository that happens to store it?
- What does a conforming document achieve, stated so a reviewer can call one non-conforming without appealing to taste?

A standard failing these questions is non-conforming even when it satisfies every shape rule below.

## Scoping rules

### Declaring scope

- Govern one document type per standard, or one attribute across every document. Split unrelated conventions into separate files.
- Open with a `## Scope` section stating what the standard governs and what it does not, placed above the shape rules. A standard that specifies shape exhaustively and jurisdiction nowhere cannot refuse a rule, so the rule with no obvious owner lands in whichever standard sits nearest.
- Write it as one line naming the artifact or attribute and where it applies, then a `Does not govern:` list. Give each entry the excluded concern and the sibling standard that owns it, named by bare filename since standards install as siblings.
- Declare a boundary from both sides. A yield, an exemption, or a handoff stated in one standard alone is never checked against the standard on the other side of it, which is how two files come to claim the same rule or neither does.
- Separate a jurisdiction exclusion from a content exclusion. The first names a concern another standard owns and belongs in `## Scope`. The second names what does not belong inside the document and stays with the shape rules. Merging them puts a boundary claim where no sibling will read it.
- Stay silent on a section the standard holds today but should not own. Claiming it makes the scope statement false the moment it moves, and the mismatch is the evidence that moves it.

### Staying inside it

- Name no path, filename, or folder outside the document type the standard governs. A standard reaches projects whose layout is their own, so a path borrowed from the authoring repository is wrong in a target and nothing reports it.
- State the rule, never the mechanism enforcing it. Hooks, scripts, checks, and skill catalogs are facts about one repository. Name the condition the document must meet and let the enforcing surface name its own case.
- Invent inline examples rather than citing a real file elsewhere in the project. A cited file moves or is deleted and the standard goes stale in silence.

## Frontmatter

- Start the file with a frontmatter block carrying at least `title` and `description`. A consuming surface may require more.
- `title`: names the doc type in sentence case, suffixed `reference` (`Commit reference`, `Branch reference`)
- `description`: one line naming what the standard covers. It becomes the index link label on install.

## Structure

- Use sentence case for every heading
- Flat `##` rule groups for a single-topic standard. Group `##` headers by concern for a multi-topic one.
- When one `##` section covers more than one sub-concern, split its bullets into `###` subgroups, one subgroup per sub-concern. A flat bullet list under an `##` covers a single sub-concern. Roughly seven bullets is a signal to split, not a hard cap.
- Order groups from the most-used rule down to the edge case

## Rules

- Write rules as imperative bullets: one rule per bullet, one concern per group
- State the forbidden shape rather than enumerating allowed options, so a rule survives new categories
- Cut any rule that resists a crisp one-line phrasing
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
- When shown, label them `### Correct` and `### Incorrect` with an inline `# reason` on each entry
- Keep to two or three entries. Show the pattern, not a catalog.
- Keep each entry a short one-liner or command. Do not write multi-line correct and incorrect function blocks.
