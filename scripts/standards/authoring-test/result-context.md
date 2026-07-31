The file content is ready, but the write was blocked: the harness flagged `.claude/context/feedwatch.md` as a sensitive path and this session is non-interactive, so I can't get approval. I'm not going to route around that with a shell write. To land it, either approve the path or re-run interactively.

Here is the entry, ready to paste to `.claude/context/feedwatch.md`:

```markdown
---
title: Feedwatch
description: Feed polling, content-hash dedupe, and the durable queue that fans items out to delivery sinks
---

# Feedwatch

## Overview

Owns the whole path from feed URL to delivered item: fetching and parsing RSS and Atom, deciding which items are new, and handing them to delivery sinks through a SQLite-backed queue. The three stages stay decoupled through `FeedItem`, which pollers produce and sinks consume without either knowing the other exists. State lives entirely in one SQLite file, so there is no daemon and no in-memory queue that survives a crash.

## Layout

- `src/pollers/` owns fetching and parsing feed formats into `FeedItem`
- `src/sinks/` owns delivery targets and the retry queue that feeds them
- `src/store/` owns SQLite schema and the dedupe cursor

## Decisions

- Dedupe keys on a SHA-256 of trimmed title plus link, never GUID. Two polled aggregators mint a fresh GUID whenever their upstream re-crawls an article, so GUID-keyed dedupe redelivered the same article three or four times a day.
- The poll cycle enqueues and returns. It never awaits delivery. A webhook endpoint that hangs for its full timeout would otherwise stall every feed later in the same cycle, and a long enough cycle gets killed by the supervisor before it reaches the tail of the feed list.
- Both fan-out layers use `Promise.allSettled` rather than `Promise.all`. One broken feed must not abort the cycle, and one dead sink must not fail the drain batch.
- Enqueue fans every item to every registered sink. There is no per-feed sink selection, so adding a sink immediately starts delivering all feeds to it.
- Pollers and sinks both resolve through a `Map` registry built at module load. Registration is the only wiring step, and the `kinds` and `sinks` commands read straight off those maps.
- Retained hashes cap at 500 per feed, pruned on every `recordSeen`. The cursor is a bounded recent-window, not a permanent archive.

## Gotchas

- A delivery that exhausts its attempts is deleted from `sink_queue`. There is no dead-letter table and nothing logs the drop, so permanently failing deliveries vanish silently.
- Feed errors inside `pollAll` are swallowed by `Promise.allSettled` and never inspected. A feed that has 404'd for a month looks identical to one with no new items.
- `BACKOFF_MS` has five entries but only the first four are reachable. `MAX_ATTEMPTS` of 5 drops the row on the fifth failure, so the 6-hour delay never fires and the real ceiling is 1 hour.
- A feed publishing more than 500 items inside its own window can redeliver. Pruning evicts the oldest hashes, and any evicted item still present in the feed reads as fresh on the next poll.
- `drain` takes 50 rows per call and `poll` drains exactly once. Two registered sinks mean two rows per item, so a heavy cycle leaves a backlog that waits for the next run.
- Atom entries with multiple `<link>` elements produce a junk link. `entry.link?.['@href']` misses on an array, the fallback stringifies the array itself, and because link feeds the fingerprint the item dedupes against nothing.
- The two pollers configure `XMLParser` differently. Atom sets `attributeNamePrefix: '@'`, RSS leaves the `@_` default. Copying attribute-reading code between them silently reads `undefined`.
- Nothing in the code applies `schema.sql`. There is no migration runner, so the file is applied by hand against `FEEDWATCH_DB` before first use.
- `publishedAt` is parsed but never read. Ordering and dedupe ignore it, and a malformed date lands as `NaN` rather than `null`.

## Hidden contracts

- `sink.name` is the persisted queue key in `sink_queue.sink`. Renaming a sink orphans its queued rows, which then throw `unknown sink` on each drain until they burn four retries and get dropped.
- A sink signals failure by throwing. Returning normally deletes the queue row, so a sink that swallows its own errors permanently loses items.
- Queue payloads are whole serialized `FeedItem` values, not references. Changing the `FeedItem` shape has to stay readable against rows enqueued by the previous version.
- `feeds.kind` carries a `check` constraint mirroring the `FeedKind` union. Adding a format means editing both, and the schema side needs a migration on existing databases.
- `fingerprint` calls `.trim()` on title and link, so pollers must emit strings. Every parser coerces with `String(... ?? '')` for this reason.

## Adding a poller

Create `src/pollers/<kind>.ts` exporting a `Poller`, add the kind to the `FeedKind` union in `src/pollers/types.ts`, register it in the map in `src/pollers/index.ts`, and widen the `check` constraint on `feeds.kind`. The fetch call carries a 10-second `AbortSignal.timeout` and throws on a non-OK status, which is what marks the feed failed for the cycle.

## Adding a sink

Create `src/sinks/<name>.ts` exporting a `Sink` and register it in the map in `src/sinks/index.ts`. Read credentials from the environment inside `deliver` and throw when they are missing, so a misconfigured sink retries instead of crashing the drain. Registration alone starts fan-out to every feed, and existing queued rows are unaffected because they were written before the sink existed.

## CLI

- `poll`: fetch every feed, queue new items, then drain once
- `drain`: drain the delivery queue without fetching
- `kinds`: list registered feed kinds
- `sinks`: list registered delivery sinks

Environment variables are documented in `README.md`.
```

Notes on how I applied the standard, and a few things I found while reading:

- `## Layout` is three folder lines, no per-file breakdown. `src/cli.ts` is deliberately absent since the standard says folders only.
- Weight sits in `Decisions`, `Gotchas`, and `Hidden contracts`, since those are what `ls` and `--help` can't reproduce. The `CLI` section is verbs only, with env vars pointed at `README.md` rather than restated.
- Two gotchas are things I derived from the code rather than found documented, so they're worth your review: `BACKOFF_MS[4]` is unreachable given `MAX_ATTEMPTS = 5` (attempts 1–4 index 0–3, then the row is dropped), and the Atom multi-`<link>` case falls through `?? entry.link` to stringify an array. Both look like real bugs, not intentional design. I documented them as current behavior rather than fixing them, since you asked for a context entry.
