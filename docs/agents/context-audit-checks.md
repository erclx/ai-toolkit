---
title: Context audit checks
description: What each non-gating check reports, the unit each checkpoint is measured in, which folders each check reaches, and what moved to the attribute tier
---

# Context audit checks

What each finding from `aitk context audit` means. The command surface, its flags, and the one gating check are in `context-audit.md`.

## Required sections

The required-section check reports what does not declare `## Overview` and `## Layout`, the two sections `.claude/standards/context.md` marks required. The list is held in code beside the numeric checkpoints rather than parsed out of the standard, so it fails on a defect rather than on a rewrite of the wording around it. A heading at any level counts, because a domain that split into a folder carries its overview in a sibling named `overview.md` where the section is the `#` title and an `##` beneath it would repeat the filename. Matching exactly is what keeps `## Layout catalog` from satisfying `Layout`.

Which unit answers depends on the folder. Entries of the folder named under `.claude/` are one domain each, so each answers for itself and a finding names the entry. Entries of a folder a domain split into describe that one domain between them, so any sibling answers and a finding names the folder. Holding a split folder to the rule per file would report every child beside its `overview.md`, and rolling the named folder up would let one conforming entry stand in for every other domain sitting next to it.

It reports rather than gates by default, the closer call because a missing section reads more like a fact than the other judgments. What settles it is that the standard sanctions omitting `## Layout` from a domain owning no paths in the repo, and no measure separates that from an entry that forgot it. A domain covering only external tools is that case, and it reports on every run. The JSON record carries the findings as `missingSections` and the list as `checkpoints.requiredSections`.

`--gate` promotes the finding to a failing exit code, which the seed stage runs and no other caller does. That mode needs an answer to the sanctioned omission above, so a file declaring `stub: true` in its frontmatter is dropped before the check and reported nowhere. Both are described in `context-audit.md`.

## Length

Length quotes its checkpoint from `.claude/standards/context.md`: roughly 150 rendered lines for an entry. It counts rendered lines rather than source lines, wrapping each line at 80 columns and summing the heights. Entries here are authored one line per bullet, so a block of fifteen paragraph-bullets occupies fifteen source lines and renders past sixty, which source counting cannot see. The measure counts fenced blocks and frontmatter, so a reference-heavy entry ranks by its examples, which the legend states on every run alongside the width, since a number in rendered lines cannot be reproduced without it.

Depth and bullet weight are quoted from `.claude/standards/markdown.md`, which states both over every markdown file rather than over a context entry, so `aitk markdown audit` measures them and this command no longer does. They share `renderedHeight` with the length measure, since the two checkpoints sit in one section of that standard and a reader compares them. What the split costs is that a session wanting both numbers for one entry runs two commands, and what it buys is that either number can be had for a file in a folder this audit refuses to resolve.

## Tables

The table check reports a catalog that grows a row per shipped thing, not a table count. A fixed comparison table never reflows, so its size costs nothing. A table qualifies at six or more body rows whose first column mostly carries a path, command, or link, which is what separates a catalog from a comparison without reading the prose. It stays here rather than moving with depth, because the shape it routes a catalog into is a judgment the context standard makes about an entry.

## Provenance

The provenance check reports the markers narrating how a domain reached its shape rather than describing what it is: a date, a change number, or a release label. The standard admits a rejected alternative and the reasoning that killed it while refusing the provenance attached to it, so a marker names a line to read rather than a line to delete. Findings group by entry and sort left to right within a line, since what a reader acts on is which file to open. Fenced blocks are excluded, which keeps a pinned version in an install command from reading as a claim the entry makes. Frontmatter is excluded with them, since the content checks read the body alone, and that is what keeps a diagram entry's dated `verified` stamp a record of its last check rather than a marker to settle. Length is the exception, counting the whole file, so a reader applying the 150-rendered-line checkpoint against the body alone lands a few lines under what the tool reports.

## Which folders each check reaches

The provenance and required-section checks cover `.claude/context/` alone, while length and the table finding reach every audited folder. What narrows the two is stated in `.claude/standards/context.md`, which opens its scope by handing diagrams and wireframes to `diagrams.md` and `wireframes.md`, and the sibling standards do not restate it. A marker reported in a diagram entry would cite a rule that entry's own standard routes elsewhere. The split is between kinds of rule rather than kinds of folder, and what decides it is which tier states the rule rather than what the check measures. Length and the table finding generalize as judgments about how far a reader travels, so both reach wherever the audit is pointed. Required sections narrow for a plainer reason: the names are the context standard's own, and neither sibling standard states a required section at all.

The same test is what moved depth and bullet weight out of this command entirely. A rule stated at the attribute tier reaches every markdown file, and a check reaching every markdown file has no reason to require a folder that resolves. The scoping key is the folder an entry was audited under, so `--folder` still reaches a folder the default list does not carry, and a domain split into `context/<sub-area>/` is governed as `context`. Every run states the reach, including a run where no audited folder is the governed one. The JSON record carries it as `checkpoints.provenanceFolder` and a per-folder `governsContent`.

## Index drift

Index drift compares an index against its siblings in both directions. An entry the index does not link is invisible to a session choosing what to open, and a linked name resolving to nothing sends one to a path that opens nothing.
