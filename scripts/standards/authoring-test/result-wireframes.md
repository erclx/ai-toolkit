> Verbatim run record, 2026-07-31, `standards/wireframes.md`. First-person voice below is the run's own output.
> Do not edit or rewrite this file. It is the evidence the change-control rule cites, so a prose pass over it
> destroys what it is for. Prose standards do not apply here.
>
> Result: PASS on all five criteria. Cost $0.74 over 15 turns.
> Two earlier attempts on the same day were inconclusive for harness reasons, recorded under Harness history below.

---

title: Feed list
description: Root screen listing subscribed feeds, with the inline add form, label filter, and empty state

---

# Feed list

The primary screen. It stacks a header, an inline add form, a filter input, and one row per subscribed feed.

## Wide (>600px)

```plaintext
┌──────────────────────────────────────────────────────────────────────┐
│ Feeds                                                  12 subscribed │   ← header, count is the full total
│                                                                      │
│ ┌──────────────────────────────────────────────────┐ ┌─────────────┐ │
│ │ https://example.com/feed.xml                     │ │  Add feed   │ │   ← add form, inline above the list
│ └──────────────────────────────────────────────────┘ └─────────────┘ │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ Filter feeds                                                     │ │   ← filter, full width
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ Daring Fireball  daringfireball.net RSS  (Healthy)  2 min ago Remove │   ← label + URL, kind, status pill, last polled, remove
│ ──────────────────────────────────────────────────────────────────── │
│ Hacker News  news.ycombinator.com   RSS  (Stale)    3 hr ago  Remove │
│ ──────────────────────────────────────────────────────────────────── │
│ Vercel Changelog  vercel.com        ATOM (Failing)  1 day ago Remove │
│ ──────────────────────────────────────────────────────────────────── │
└──────────────────────────────────────────────────────────────────────┘
```

The label and URL share one cell that takes about half the row. The four trailing cells hold their width as the list grows, so kind, status, last polled, and remove stay in vertical alignment down the list.

## Narrow (≤600px)

```plaintext
┌──────────────────────────────────────────┐
│ Feeds                     12 subscribed  │   ← header stays on one line
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ https://example.com/feed.xml         │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │               Add feed               │ │   ← submit drops below the input
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ Filter feeds                         │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Daring Fireball            ●      Remove │   ← status renders as a dot only
│ daringfireball.net        RSS  2 min ago │
│ ──────────────────────────────────────── │
│ Hacker News                ●      Remove │
│ news.ycombinator.com      RSS   3 hr ago │
│ ──────────────────────────────────────── │
└──────────────────────────────────────────┘
```

Each feed wraps to two lines. The label, status, and remove control sit on the first line, and the URL, kind, and last-polled time sit under them in the same columns.

## Empty state

```plaintext
┌──────────────────────────────────────────────────────────────────────┐
│ Feeds                                                   0 subscribed │
│                                                                      │
│ ┌──────────────────────────────────────────────────┐ ┌─────────────┐ │
│ │ https://example.com/feed.xml                     │ │  Add feed   │ │   ← add form still renders
│ └──────────────────────────────────────────────────┘ └─────────────┘ │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ Filter feeds                                                     │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│                            No feeds yet                              │
│          Add a feed URL above to start collecting items.             │
│                       ┌────────────────────┐                         │
│                       │ Add a sample feed  │                         │   ← seeds one feed, no typing
│                       └────────────────────┘                         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

The empty block is centered in the full content width and takes the vertical space the rows would have used.

## Copy

- Title: `Feeds`
- Count: `{total} subscribed`, where `{total}` is every subscribed feed and does not react to the filter
- Add form placeholder: `https://example.com/feed.xml`
- Add form submit: `Add feed`
- Add form error: `Enter a full feed URL, starting with http.`
- Filter placeholder: `Filter feeds`
- No-match line: `No feeds match “{query}”.`, where `{query}` is the text the visitor typed, in curly quotes
- Empty state title: `No feeds yet`
- Empty state body: `Add a feed URL above to start collecting items.`
- Empty state action: `Add a sample feed`
- Status pill: `Healthy`, `Stale`, or `Failing`
- Kind pill: the feed kind in capitals, `RSS` or `ATOM`
- Row action: `Remove`, read as `Remove {label}` by a screen reader

## Behavior

- Typing in the filter narrows the list to feeds whose label contains the query, matched without regard to case. Clearing the input restores every row.
- A filter that matches nothing empties the row list and puts the no-match line where the rows were. The header count, add form, and filter stay put.
- Submitting the add form with a URL that does not start with `http` keeps the typed value and shows the error under the form
- The empty state replaces the row list only when nothing is subscribed. The add form and filter still render above it, so the visitor can type a URL instead of taking the sample.
- Below 600px the status pill drops its text and renders as a colored dot. The status word stays in the accessible name, so a screen reader reads the same row at every width.
- Remove acts on its own row and carries the feed label in its accessible name

<!-- run commentary follows -->

Wrote `.claude/wireframes/feed-list.md`.

**What's in it**

- Frontmatter with `title` and `description`, both feeding `index.md` on regen.
- Three `plaintext` fences, one H2 each, named by trigger: `Wide (>600px)`, `Narrow (≤600px)`, `Empty state`. The narrow fence earns its place because the row genuinely reflows into two lines against shared columns and the add form's submit drops below the input, not because the gutter shrinks.
- `←` annotations only, no `#`.
- Copy section carrying every on-screen string verbatim, with `{total}` and `{query}` marked as dynamic. The count is flagged as the full total, since it ignores the filter.
- Six behavior bullets covering filter matching, the no-match state, add-form validation, empty-state conditions, and the dot-plus-accessible-name status treatment.

**Grid honesty**, I sized the ASCII from the real column ratios rather than eyeballing. The wide row's label cell reads as ~51% of the row against ~53% in the actual `1fr 4rem 6rem 8rem auto` track. I verified programmatically that all box edges land on one column per fence and that kind, status, last-polled, and remove start at identical offsets across all three sample rows in both variants.

**Two judgment calls**

The no-match state got Behavior and Copy coverage but no fourth fence. Its layout delta is one line of copy where the rows were, which the ASCII would not communicate better than the sentence does.

`src/ui/AddFeedForm.tsx:3` and `src/ui/FeedRow.tsx:21` carry comments that the standard routes to `.claude/context/`: the rejected modal approach for the add form, and the `clip-path` mechanism behind the status pill collapsing. I kept the intent from both and dropped the mechanism and the rejection history. There's no `.claude/context/` directory in this repo yet, so the wireframe references no context path rather than pointing at one that doesn't exist. If you want that entry, the modal rationale and the visually-hidden-text technique are the two things with a home waiting for them.

## Verdict, added after the run

Pass on all five criteria.

Every required section present with no padded headings. Section order follows the standard's own. No class names, no `clip-path`, and no pixel constants except the breakpoint triggers the standard endorses in variant names. The dot collapse is recorded with its accessible-name reasoning, and the empty state earns its own variant.

The strongest signal is the third planted intent. `AddFeedForm.tsx:3` carries the rejected modal approach, and the standard routes rejected approaches to `.claude/context/`. The run dropped the history, kept the layout intent, and named exactly what it was withholding and where that content belongs. Withholding was the conforming move, and nothing in the prompt pointed at it.

The fifth criterion passes under the rule in `pre-registration.md`. The run ends offering to draft a context entry, which is an offer rather than a question it needed answered to finish.

## Harness history

Two earlier attempts the same day produced no artifact that could be judged, and both were harness defects rather than standard failures.

The first, $1.73 over 24 turns, hit the sensitive-path block on `.claude/`, wrote the artifact to `feed-list.wireframe.md` in the fixture root instead, and lost it to the cleanup trap. That run is why the runner now snapshots the fixture and recovers any markdown created during the run.

The second, $0.86 over 15 turns, wrote nothing at all. Every write path was refused, including a `/tmp` fallback and Bash verification. Diagnosis came from a $0.15 smoke test: an untrusted workspace makes Claude Code ignore `permissions.allow` outright, and a `mktemp` path is never trusted, so fixture-local settings cannot grant the write. The runner uses `--dangerously-skip-permissions` from that point, which is safe only because the fixture is synthetic, disposable, outside the repo, and deleted on exit.

The context arm in #639 passed without either fix, which was luck. That session happened to return its artifact in its final message. Nothing in the harness would have caught it if it had not.
