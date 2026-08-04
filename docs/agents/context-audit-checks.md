---
title: Context audit checks
description: What each non-gating check reports, the unit each checkpoint is measured in, and which folders each check reaches
---

# Context audit checks

What each finding from `aitk context audit` means. The command surface, its flags, and the one gating check are in `context-audit.md`.

## Required sections

The required-section check reports what does not declare `## Overview` and `## Layout`, the two sections `.claude/standards/context.md` marks required. The list is held in code beside the numeric checkpoints rather than parsed out of the standard, so it fails on a defect rather than on a rewrite of the wording around it. A heading at any level counts, because a domain that split into a folder carries its overview in a sibling named `overview.md` where the section is the `#` title and an `##` beneath it would repeat the filename. Matching exactly is what keeps `## Layout catalog` from satisfying `Layout`.

Which unit answers depends on the folder. Entries of the folder named under `.claude/` are one domain each, so each answers for itself and a finding names the entry. Entries of a folder a domain split into describe that one domain between them, so any sibling answers and a finding names the folder. Holding a split folder to the rule per file would report every child beside its `overview.md`, and rolling the named folder up would let one conforming entry stand in for every other domain sitting next to it.

It reports rather than gates by default, the closer call because a missing section reads more like a fact than the other judgments. What settles it is that the standard sanctions omitting `## Layout` from a domain owning no paths in the repo, and no measure separates that from an entry that forgot it. A domain covering only external tools is that case, and it reports on every run. The JSON record carries the findings as `missingSections` and the list as `checkpoints.requiredSections`.

`--gate` promotes the finding to a failing exit code, which the seed stage runs and no other caller does. That mode needs an answer to the sanctioned omission above, so a file declaring `stub: true` in its frontmatter is dropped before the check and reported nowhere. Both are described in `context-audit.md`.

## Length and depth

Length and depth quote their checkpoints from `.claude/standards/context.md`: roughly 150 rendered lines for an entry, roughly 40 for a run no heading breaks. Depth measures the longest such run rather than everything under one `##`, skips fenced blocks so a markdown example does not read as three headings, and exempts a run whose lines are all list items at one indent averaging under 130 characters. The weight condition is what separates a scannable catalog of one-liners from a stack of paragraph-bullets, which reach the same count and read nothing alike.

Depth exempts a second shape, and the two are excused for opposite reasons. A peer list is already navigable, so a subheading dropped into it splits a set that belongs together. A table is exempt because the remedy does not exist: a heading placed inside one splits the table rather than the run, so a catalog renders as an unbroken stretch by construction and no edit short of rewriting it as a list clears the report. The test is whether the run is a table rather than whether it holds one, so a table with prose either side still reports and a heading breaks it at the seam. A run of piped lines carrying no delimiter row is not a table and reports like any other prose. The table finding above is unaffected, so a catalog silenced here still reports as a candidate for a bullet list, which is the measure whose remedy does exist.

Both checks count rendered lines rather than source lines, wrapping each line at 80 columns and summing the heights. Entries here are authored one line per bullet, so a block of fifteen paragraph-bullets occupies fifteen source lines and renders past sixty, which source counting cannot see. Measuring one checkpoint in each unit would put an entry length beside a run length that mean different things. Their exclusions still differ: the file measure counts fenced blocks and frontmatter, while the run measure skips a fence so an example cannot break the run around it. A reference-heavy entry therefore ranks by its examples, which the length legend states on every run. Runs count blank lines, which the standard leaves open, so a hand reader who drops them lands a line or two lower. Both sections state the width on every run, since a number in rendered lines cannot be reproduced without it.

## Bullet weight and tables

The bullet check reports a top-level bullet past roughly 400 characters, which is where a bullet stops carrying a decision alone and starts carrying the incident that motivated it beside the decision. Continuation lines fold into the bullet they belong to, so a heavy bullet cannot fall under the checkpoint by wrapping across two source lines, while a nested item is left out because the parent's own text is what the checkpoint asks about. Findings group by entry and narrow to `.claude/context/` for the reasons the provenance ones do both. Unlike the peer-list threshold above it, this corpus has no gap behind the number: bullet weight decays smoothly from a median near 170, so the number is a judgment where that one was a measurement, and a bullet reading well past it means the number is wrong rather than the rule.

The table check reports a catalog that grows a row per shipped thing, not a table count. A fixed comparison table never reflows, so its size costs nothing. A table qualifies at six or more body rows whose first column mostly carries a path, command, or link, which is what separates a catalog from a comparison without reading the prose.

## Provenance

The provenance check reports the markers narrating how a domain reached its shape rather than describing what it is: a date, a change number, or a release label. The standard admits a rejected alternative and the reasoning that killed it while refusing the provenance attached to it, so a marker names a line to read rather than a line to delete. Findings group by entry and sort left to right within a line, since what a reader acts on is which file to open. Fenced blocks are excluded, which keeps a pinned version in an install command from reading as a claim the entry makes. Frontmatter is excluded with them, since the content checks read the body alone, and that is what keeps a diagram entry's dated `verified` stamp a record of its last check rather than a marker to settle. Length is the exception, counting the whole file, so a reader applying the 150-rendered-line checkpoint against the body alone lands a few lines under what the tool reports.

## Which folders each check reaches

The provenance, bullet-weight, and required-section checks cover `.claude/context/` alone, while length, depth, and the table finding reach every audited folder. The rule is stated in `.claude/standards/context.md`, which opens its scope by handing diagrams and wireframes to `diagrams.md` and `wireframes.md`, and the sibling standards do not restate it. A marker reported in a diagram entry would cite a rule that entry's own standard routes elsewhere. The split is between kinds of rule rather than kinds of folder, and what decides it is whether the remedy is actionable rather than what the check measures. Subdividing a run and splitting a file mean something in any entry, so length and depth generalize. Moving an incident out of a bullet and keeping the decision means nothing in a folder whose entries declare no decisions, which is why bullet weight narrows despite measuring a distance like the two that do not. Required sections narrow for a plainer reason: the names are the context standard's own, and neither sibling standard states a required section at all. The scoping key is the folder an entry was audited under, so `--folder` still reaches a folder the default list does not carry, and a domain split into `context/<sub-area>/` is governed as `context`. Every run states the reach, including a run where no audited folder is the governed one. The JSON record carries it as `checkpoints.provenanceFolder` and a per-folder `governsContent`.

## Index drift

Index drift compares an index against its siblings in both directions. An entry the index does not link is invisible to a session choosing what to open, and a linked name resolving to nothing sends one to a path that opens nothing.
