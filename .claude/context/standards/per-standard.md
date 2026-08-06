---
title: Per-standard decisions
description: What the plan standard fixes and why its sections are mixed, the inverted answer contracts, the memory standard, what the memory pen measured, and the widened readiness test
---

# Per-standard decisions

Three standards in the corpus cost more reasoning than their shape rules show. The plan and memory standards were both drafted against a live folder holding two or three files, so the plan standard shipped a rule the whole corpus failed and the memory standard was measured against the pen instead. The tasks standard carries a readiness test that has to admit a row no fact on disk can confirm. What each one settled belongs here rather than in the file itself, which states the rule and not the count behind it.

## The plan standard

`standards/plan.md` fixes the section list, the suggested-and-answer contract, and the lifecycle from `.claude/plans/` to `.claude/plans-archive/`. `claude-feature` defined that shape inside its own body and two more skills consumed it, which is past the second-case bar, so the body now cites the standard and `claude-autoship` and `claude-docs` each point at the half they read.

The section markers are mixed on purpose, `## Summary` as a heading and the other four as bold labels, because that is what the corpus writes. Across 178 archived plans, `Summary` is a heading in 176 and a label in none, while `Files to touch` is a label in 146 against 21 headings and the other three split the same way.

The mix reads as an inconsistency until the counts are in front of you, which is why they are recorded here.

Sampling the live folder is what got that wrong the first time. Three plans were in `.claude/plans/`, two of them writing `## Risks` and `## Questions`, so the minority variant looked like the convention and the standard shipped requiring headings for all five.

Running the new check against the real folder returned a finding for every plan present, all of them that one rule, which is the signal that the rule rather than the corpus was wrong.

Measure a format claim against the archive, since the live folder holds two or three files and says nothing.

The check accepts either spelling for a section and names the table's form in the finding. A plan carrying `## Risks` has stated its risks, so failing it teaches a reader to skip the output on the rule they are least served by, which is the same failure as a gate whose findings are all whitelisted.

## The plan answer contract

The plan and intake answer contracts invert each other and both files state the inversion, which is the both-sides rule applied to a contract rather than to a scope entry.

A blank `- Answer:` accepts the suggestion because a plan is written and read in one sitting with every question already surfaced, while an empty `You:` means unread because an intake folder is read over weeks and silence there is far more likely to be absence than assent.

`558-plan` routes `.claude/plans/**` and `.claude/plans-archive/**` and joins `base`, following `556-groundwork` and `557-intake`. It carries the two directives that ship silently when violated, a filled answer slot and a deleted plan, and points at the standard for the rest.

## The memory standard

`standards/memory.md` fixes the filename and its type prefix, the frontmatter, the body shape each type carries, links between entries, and the lifecycle. The format sat in three places, as eight bullets in `CLAUDE.md`, the write format in `claude-memory-capture`, and the retire rule in `claude-memory-review`.

`CLAUDE.md` keeps two bullets, the write location because `.claude/memory/` rather than `~/.claude/projects/` is project policy, and the routing rule because it has to fire before an entry is written at all rather than once the standard is opened.

The delete prohibition stayed in `CLAUDE.md` while the rest of the block moved. A path-scoped rule fires when a session edits a file the glob matches, and a bulk retire runs through the shell as a `mv`, so `559-memory.md` is never loaded at the moment the irreversible act happens.

The test in `.claude/ARCHITECTURE.md` asks whether a rule fires on a path being edited, and this is the case where the answer is no because the violating action is not an edit at all.

The rule sits in both tiers on purpose: the always-loaded copy is what reaches the shell path, and the rule copy is the reminder a session gets while editing an entry.

## The tasks readiness test

`standards/tasks.md` admits a row to `## Up next` on a written plan plus a stated reason the task cannot start, and that group's `Waiting on` cell carries a collision, a sibling task, or an external condition. `## Needs a plan` heads a column by the same name, so the three forms are stated under the group they govern rather than under the header they share. A test naming only the first two leaves a planned task waiting on a condition outside the board passing neither it nor the `## Needs a plan` test below it, so such a row sits in a group whose stated rule does not admit it.

A fourth heading is the obvious alternative and the standard bans one, because a board grouped under names of its own reads as empty to anything counting rows under a heading. Widening a test costs one clause and keeps the three headings every reader already parses.

The three tests are read in order, so widening `## Up next` alone leaves its new kind unreachable. A `## Run now` test whose second half names only a file collision admits a task blocked on an external condition, since such a task collides with nothing running, and the ordered read hands it to a worker before `## Up next` is ever consulted. Both tests therefore turn on the same clause, that the task carries no reason it cannot start, with the collision kept named under `## Run now` so the `Touches` column and the validator's collision check keep their basis.

The external kind names what would satisfy the condition rather than the condition alone. Without that clause the kind admits any excuse, including a row nobody has looked at, which collapses the group into a holding pen for whatever is stalled.

`aitk tasks validate` resolves the `Task`, `Plan`, and `Touches` columns by header text and never reads the `Waiting on` cell, so the widened test holds on reading alone and the standard says so. A non-empty check is the alternative and every row already passes it, which buys a check that has never once fired. Every finding the validator does report compares a written claim against the tree, and an external condition puts no fact there to disagree with, unlike a plan pointer that resolves or two file sets that intersect.

## What the memory pen measured

The shape rules were measured against the 174-entry pen rather than drafted from the three sources, which is the lesson `plan.md` paid for. Every body opens with a prose rule line, no marker is ever indented, `**Why:**` and `**How to apply:**` co-occur in all 169 rule-bearing entries, and the 5 without either are exactly the 4 `reference` and 1 `user` entries.

Blank lines between the three parts split 102 to 64, so the standard states the three parts as the contract and stays silent on the separator. Requiring one spelling would have reported a third of the corpus on the rule readers are least served by.

`category` is compared against the sentence-case form of the filename prefix rather than checked field by field. One comparison catches a prefix outside the four types, a field disagreeing with the prefix, and a casing drift that would open a second group in the generated catalog, and it reports one finding where three separate rules would report the same defect three times.

No dangling-link check ships. `[[name]]` appears in 147 entries against 98 distinct targets, and the two resolving to nothing name entries never written rather than retired ones, which the format treats as a marker worth keeping. Two of the four apparent dangles were backticked TOML `[[table]]` syntax, so a check would have had to exclude code spans to report a class that is legitimate anyway.

The two classes the verb catches against a real pen are an entry titled with its own filename stem, which renders a slug in the catalog where the rule belongs, and a filename prefix belonging to none of the four types. The live pen reads clean of both.
