---
title: Intake folder reference
description: Reserved index number, file map, frontmatter and dating, the item template, retrieval, and anti-patterns
---

# Intake folder reference

Applies to an intake folder at `.claude/intake/<slug>/`. One folder holds one dump, filed by domain, and every finding in it is an item carrying a measured problem and a verdict.

The folder is gitignored and unbacked. No check reaches its contents, so the shape below survives only by being read.

## Files

| File                 | Holds                                                        | Required |
| -------------------- | ------------------------------------------------------------ | -------- |
| `00-overview.md`     | Index: format block, cluster table, verdicts, open questions | Always   |
| `NN-<domain>.md`     | One cluster of items, filed by the domain their fixes touch  | Always   |
| `99-next-session.md` | What a compaction destroys that no cluster file carries      | Optional |

`00` is the only reserved number. Everything else is read order, and the domain rides in the filename so a reader knows what `07-tooling.md` holds without opening it.

Do not reserve mid-range numbers. Clusters differ per dump, so a contract over `06` would force every future intake into one dump's shape. Groundwork reserves its numbers because its shape is fixed, and that half of the convention does not transfer.

Let the file count follow the number of separable domains. A large dump with two domains is a small folder.

## Frontmatter and dating

Every file carries `title` and `description` per the project's prose standard. `00-overview.md` carries one field the others do not, a `date` holding the day the folder opened.

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

## Item template

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

`Problem:`, `Fix:`, `Worth it:`, and the empty `You:` slot ship on every item. `Open:` appears only where the call is the operator's, `Suggested:` is required whenever it does, and `Overlaps:` is optional and never replaces the verdict.

Two heading levels is the right depth inside a cluster file. A third means the cluster should have been its own file.

An item may carry a bolded standalone line between the bullets where a finding needs a name of its own. Keep it rare. Everything that fits the four bullets belongs in them.

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
