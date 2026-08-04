---
title: Intake reference
description: Folder layout, reserved index number, frontmatter and dating, the item template, the answer contract, and retrieval
---

# Intake reference

Applies to an intake folder at `.claude/intake/<slug>/`. One folder holds one dump, filed by domain, and every finding in it is an item carrying a measured problem, one proposed fix, and a verdict.

The folder is gitignored and unbacked. No check reaches its contents, so the shape below survives only by being read.

## Scope

Governs an intake folder under `.claude/intake/<slug>/`: folder layout, the reserved index number, frontmatter and dating, the item format, the answer contract, and retrieval.

Does not govern:

- One question measured in depth before anyone can plan against it: `groundwork.md`
- The feature plan a promoted item feeds, and the inverted answer contract it keeps: `plan.md`
- The task file promoting an item onto the board, and the origin line pointing back at the folder: `tasks.md`
- Voice and word choice: `prose.md`
- Headings, punctuation, and file references: `markdown.md`
- Which findings belong in a dump at all, and the procedure that files one, which belong to the surface driving it

## What a working intake looks like

An intake works when a reader returning weeks later can act on it from the folder alone:

- Which items are ready to promote, and what does shipping each one cost?
- What measurement stands behind each problem line, and against which commit was it taken?
- Which items has the operator answered, and which has nobody reached?
- Which live board task does an item already overlap?

An intake failing these is non-conforming even when it satisfies every shape rule below.

## Files

| File                 | Holds                                                        | Required |
| -------------------- | ------------------------------------------------------------ | -------- |
| `00-overview.md`     | Index: format block, cluster table, verdicts, open questions | Always   |
| `NN-<domain>.md`     | One cluster of items, filed by the domain their fixes touch  | Always   |
| `99-next-session.md` | What a compaction destroys that no cluster file carries      | Optional |

`00` is the only reserved number. Everything else is read order, and the domain rides in the filename so a reader knows what `07-tooling.md` holds without opening it.

Do not reserve mid-range numbers. Clusters differ per dump, so a contract over `06` would force every future intake into one dump's shape. A folder whose shape is fixed can reserve its numbers, and that half of the convention does not transfer.

Let the file count follow the number of separable domains. A large dump with two domains is a small folder.

## Frontmatter and dating

Every file carries `title` and `description`. `00-overview.md` carries one field the others do not.

- `title` (required): the dump subject in sentence case
- `description` (required): one line naming what the dump covers
- `date` (required, `00-overview.md` only): the day the folder opened, as `YYYY-MM-DD`

Carry the opening date as a frontmatter field rather than a sentence in the body. A date written into prose is readable by a person and by nothing that walks the folder, and the two spellings drift once both are permitted.

Date the folder once rather than every file. Twelve dated files leave eleven stale the first time one cluster is edited, and the opening date never rots. The checkable half is the commit, which the overview body names as what the claims were measured against.

## 00-overview.md

The index. It points at items and answers nothing itself.

- The item format block, copied so a returning session picks the shape up from the folder
- The answer contract stated out loud, since it inverts the plan file's
- A cluster table of file, what it holds, item count, and open count
- The verdict counts across the folder
- A ready list, grouped by what shipping one actually costs
- The open questions, each a labeled markdown link to its owning item's heading anchor

The index carries no answer slot. One question in two answerable places has no rule for which wins, and retrieval walks item headings, so an answer typed into the index is found by nothing and lost silently.

Where an item touches a task already on the board, say so in the index rather than only inside the item. A reader deciding what to promote reads the index first.

## Item format

```markdown
### N. Short title stating the defect

- **Problem:** what is wrong today, stated against the tree and carrying a number or a file path
- **Fix:** the one change proposed
- **Worth it:** yes, later, or no, with the reason
- **Open:** only where the call is the operator's
- **Suggested:** the pick in one sentence, then the reason and the main tradeoff in one or two
- **Overlaps:** the live board task that already owns this item
- **You:**
```

- `Problem:`, `Fix:`, `Worth it:`, and the empty `You:` slot ship on every item. The other two are conditional.
- `Suggested:` is required whenever `Open:` is present. A bare question invites a bare answer, and `ok` against two defensible options carries no information. Where the answer is the operator's preference rather than a technical call, say so in that form rather than inventing a default.
- `Overlaps:` never replaces `Worth it:`. The items where a live board task might be the thing that is wrong are exactly the ones whose verdict matters most.

Two heading levels is the right depth inside a cluster file. A third means the cluster should have been its own file.

An item may carry a bolded standalone line between the bullets where a finding needs a name of its own. Keep it rare. Everything fitting the four bullets belongs in them.

## The answer contract

`You:` belongs to the operator and ships empty on every item.

Empty means unread. It never means agreement. Accepting a verdict is typed as one token, `- **You:** ok`.

That inverts the plan file's contract, where a blank answer slot means accept the suggestion, and the inversion is deliberate. A plan is read in one sitting with every question already surfaced in conversation. An intake folder is read over weeks, so an empty slot is ambiguous between accepting the verdict and never having reached the item, and the second reading is far more likely. Acting on silence as consent ships a change nobody approved.

Never fill a `You:` slot, and never infer a disposition from an empty one. On a resume pass, report unread items by count rather than deciding them.

## Retrieval

Answers live on items, so one pass over the folder reports every touched slot.

```bash
awk '/^### /{h=FILENAME": "$0} /^- \*\*You:\*\*./{print h; print "   "$0}' *.md
```

Counting what is still unread runs against the empty slot instead.

```bash
grep -c '^- \*\*You:\*\*$' *.md
```

Both walk `###` headings, which is the mechanical reason an answer typed anywhere else is lost.

## Conventions

- State a number with what it settles. The strongest items are the ones where a measurement decides the verdict and says so.
- File an item under the domain its fix touches, not the domain the complaint arrived from.
- Name a live board task an item overlaps, and keep the verdict beside it.
- Revise a verdict the tree has moved under rather than appending a second one narrating the change.
- Report unread items by count on a resume pass. Never decide one.

## Anti-patterns

- **Silence read as consent.** An empty slot on a folder read over weeks means nobody reached the item, and treating it as acceptance ships a change nobody approved.
- **A verdict with nothing behind it.** An item whose problem line carries no number is an opinion, and it reads exactly like the ones that were measured.
- **The overlap that ate the verdict.** Replacing `Worth it:` with `Overlaps:` drops the call on the items most likely to change what a live task should do.
- **A question in two places.** An open question answerable in the index and on the item resolves to whichever a reader happens to open.
- **The dump filed as one concern.** Forty findings under one heading is a folder nobody can promote from, and the split by domain is what makes each item liftable on its own.
- **The date left in the body.** A frontmatter field and a sentence both claiming the opening date resolve to whichever a reader happens to hit, and only one of them is readable by a walker.

## Template

```markdown
---
title: <Dump subject>
description: <one line naming what the dump covers>
date: <YYYY-MM-DD>
---

# <Dump subject>

<One line on what the dump covers and the commit it was measured against.>

## Item format

<the item format block, copied so a returning session picks the shape up here>

## The answer contract

`You:` ships empty and empty means unread. Accepting a verdict is typed as
`- **You:** ok`. Nothing here is decided by silence.

## Clusters

| File             | Holds           | Items | Open |
| ---------------- | --------------- | ----- | ---- |
| `NN-<domain>.md` | <what it holds> | <n>   | <n>  |

## Verdicts

<counts across the folder>

## Ready

- <item, grouped by what shipping it costs>

## Open questions

1. [<question>](NN-<domain>.md#n-short-title-stating-the-defect)
```
