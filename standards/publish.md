---
title: Publish reference
description: Scan run against finished text leaving through a channel no automated check covers
---

# Publish reference

## Scope

Governs the scan an author runs against finished text on its way out, and the responses available when a source it reaches for cannot be read. It is an attribute standard rather than a document-type one, so it applies to any text leaving through a channel no automated check covers, and it carries no template because a scan has no document to shape.

Does not govern:

- Which characters are banned, and the formatting the text carries: `markdown.md`
- The voice and word choice the text is written in: `prose.md`
- The phase-label rule and the table of surfaces each namespace may appear on: `versioning.md`
- Which gap a given surface has, and what it publishes through, which that surface names for itself

## When it runs

Wherever text leaves through a channel no automated check covers, the author is the only gate and runs this scan. Text sent to another service, written to a path the project's checks exclude, and text inside a fenced block are the usual cases. The surface that publishes the text is what knows which gap applies, so it names its own rather than reading one here.

Run the scan as an explicit step against the finished text. Having read the underlying rules before drafting does not cover it, because the check has to happen after the text exists.

## Banned characters

`markdown.md` holds the character bans and `prose.md` holds the banned words. Read both at scan time rather than working them from memory, then scan the drafted text and rewrite each occurrence.

Restructure the sentence rather than substituting the character. A semicolon swapped for a period leaves both clauses in the order the semicolon chose, which is the shape the ban exists to remove.

## Phase labels

`versioning.md` holds the label rule and the table of surfaces. Read it at scan time rather than working the format from memory.

Scope this check by destination. Text published to a remote takes it. Text scanned on its way into the repository, where the reader has the task board, takes the character checks alone.

## An unreadable source

Stop and name the source when one this scan reaches for cannot be read. Do not scan what resolved and report the result.

A run that covers half its sources and says nothing is worse than one that visibly did not happen, because the surfaces running this scan are the ones that describe themselves as the only gate. A clean result from a half-run scan is read as coverage.
