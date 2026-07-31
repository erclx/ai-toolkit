# Pre-registration

Written before either run. Fixes what counts as a hit so a miss cannot be reinterpreted afterward.

Held outside both fixture roots on purpose. Neither test session can read this file, since each runs with its cwd set to the `feedwatch/` directory inside its own arm.

## What is being tested

Whether a session that has never seen the standard can author a conforming entry from the standard alone. This is a spec-quality test on the standard, not an efficacy test on the context system. No baseline arm, N=1 per standard, per `05-experiment-design.md:29`.

## Fixture

A synthetic tool, `feedwatch`, that polls RSS and Atom feeds and fans items to delivery sinks. Synthetic rather than a real domain: all 17 domains in this repo carry entries as of 2026-07-31, so the plan's fallback in question 4 is the only honest option. A real domain with an existing entry would let the session pattern-match from prior exposure rather than from the standard.

Each arm holds the tool, a copy of the standard under test at `.claude/standards/`, a copy of `prose.md`, and an empty destination folder. No `CLAUDE.md` at any level, verified: no user-level `~/.claude/CLAUDE.md` exists on this machine, and the fixture sits outside the toolkit repo so the repo's own `CLAUDE.md` cannot load through the ancestor chain.

## Planted decisions, context arm

Three non-obvious choices are recoverable from the source. Each carries its reasoning in a code comment rather than in a doc, so recording it requires reading code and deciding it matters.

1. **Dedupe keys on a content hash of title plus link, never the feed GUID.** `src/store/cursor.ts:10`. Two upstream aggregators republish the same article under a fresh GUID, so GUID-keyed dedupe re-emitted articles several times a day.
2. **Delivery is enqueue-then-drain, not inline.** `src/sinks/index.ts:16`. A hanging webhook would otherwise stall every later feed in the same cycle, and a long cycle gets killed by the supervisor before reaching the tail of the feed list.
3. **The seen-hash table is pruned to the last 500 per feed.** `src/store/cursor.ts:5` and the `prune` function. This is the gotcha rather than the decision: a feed that rewrites history beyond that window silently re-emits.

Recording any one of these with its reasoning satisfies the "at least one real decision" criterion. Recording none is a fail on that criterion.

## Planted intent, wireframes arm

1. **The add-feed form is inline at the top of the list, not a modal.** `src/ui/AddFeedForm.tsx:3`. The modal version cost two clicks before the visitor could type.
2. **Below 600px the status pill drops its text and renders as a colored dot.** `src/ui/FeedRow.tsx:18` and the media query in `feed-list.css`. This is a genuine layout change across a breakpoint, so it earns a second fence under the standard's variants rule.
3. **The empty state is its own layout with a sample-feed shortcut.** `src/ui/EmptyState.tsx`. A second named variant.

## Pass criteria

Verbatim from `05-experiment-design.md:21`. Applied to the context arm as written, and read across to the wireframes arm by its own standard's section names.

- Produces every required section, with no padded empty headings
- Puts irreducible content above recoverable content, per the ordering rule
- Does not hand-maintain a per-file tree or restate command help
- Records at least one real decision with its reasoning
- Needs no follow-up question to get there

## Reading the fifth criterion against a blocked write

"Needs no follow-up question to get there" is ambiguous when the harness blocks the write, and every run hits the same ambiguity. The judgment, fixed here so it does not get re-decided per run.

A run that ends by asking the operator to approve the path or re-run interactively passes this criterion. That is a request for operator action on a harness constraint, not a question about the authoring task, and the artifact is already complete in the same message. Score the artifact, not the delivery.

A run fails this criterion when it asks something it needed answered to write the entry, such as which domain the entry covers or which sections apply. That is the standard failing to be self-sufficient, which is what the criterion measures.

## Standing rule for this run

The outcome text accepts failure as a result. Do not iterate either standard against these results inside this task. A fix ships as its own change with the failure cited, per the change-control rule this task adopts.
