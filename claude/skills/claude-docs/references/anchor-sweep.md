---
title: Architecture anchor staleness sweep
description: How an anchored decision's cited paths are collected, the finding the diff fires, and the report line
---

# Architecture anchor staleness sweep

Mechanics for Step 6 of `claude-docs`. The body owns the skip conditions, the report-only constraint, and the standard citation, and this file owns what the sweep does once the diff touches a path an anchored decision cites.

## Anchored entries

Read `.claude/ARCHITECTURE.md` and take the H3 entries under `## Key technical decisions`. An entry is anchored when its reasoning closes on the marker the standard fixes:

```plaintext
Measured at <short-sha> on <YYYY-MM-DD>.
```

Skip every entry without one. An unanchored entry either predates the rule or cites no measured number, and the standard calls both correct, so the sweep has nothing to say about either.

For each anchored entry, collect the backticked code paths its reasoning cites. Same read the diagram sweep runs over an explanation, against a paragraph instead of a diagram.

## The finding

Report an entry when the diff touches one of its cited paths, however it was touched. A delete, a rename, and an edit inside the file all move a count of what sits under that path, and the entry's number was read before any of them landed. The diagram sweep narrows to deletes because a diagram survives a body edit, and a number does not.

The anchor's own SHA settles nothing here. A branch is compared against its merge base rather than against the commit the anchor names, so an entry anchored at a commit this branch already contains is still due a read once the branch moves what it counted.

Report an entry once however many of its cited paths the diff carries. Name the first as the evidence and leave the rest, since the reader opens the entry either way and a line per path buries the entry it is about.

What this misses is a claim whose number moved with no cited path in the diff, such as a count over a tree the branch never touched. That is the recall this trades for precision, and the alternative is re-running an arbitrary measurement read out of prose, which no sweep does reliably.

## What the sweep never does

- Write into the entry. The record carries no frontmatter, so the marker and the claim share one paragraph and an edit reaching one reaches the other.
- Refresh an anchor. Re-reading the number is the act the marker records, so a date written by a pass that measured nothing is the false confidence the marker exists to prevent.
- Flag an unanchored entry. The standard scopes the rule forward, and an entry written before it is dated by blame rather than by a read.

The session amending a decision writes its anchor, which Step 3 already requires.

## Output

Output one line per finding:

`⚠ Anchor stale: "<decision name>" cites <path>, which this branch changed. Re-measure and refresh the anchor.`

If no anchored entry cites a changed path, skip silently. A record carrying no anchored entry produces no output on any branch, which is every project until a decision is written or amended under the rule.
