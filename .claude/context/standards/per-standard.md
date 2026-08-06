---
title: Per-standard decisions
description: What the plan standard fixes and why its sections are mixed, the inverted answer contracts, where an execution-time deviation is recorded, the memory standard, what the memory pen measured, the widened readiness test, and the architecture record's verification anchor
---

# Per-standard decisions

Four standards in the corpus cost more reasoning than their shape rules show.

- The plan and memory standards were both drafted against a live folder holding two or three files, so the plan standard shipped a rule the whole corpus failed and the memory standard was measured against the pen instead
- The plan standard costs a second time for an unrelated reason, two rules under separate headings that read as pointing opposite ways
- The tasks standard carries a readiness test that has to admit a row no fact on disk can confirm
- The architecture standard borrows a marker from a sibling surface that has two writers and gets none of its own

What each one settled belongs here rather than in the file itself, which states the rule and not the count behind it.

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

`558-plan` routes `.claude/plans/**` and `.claude/plans-archive/**` and joins `base`, following `556-groundwork` and `557-intake`. It carries the three directives that ship silently when violated, a filled answer slot, a deleted plan, and a deviation from a suggestion recorded off the plan, and points at the standard for the rest.

## Where an execution-time deviation goes

An executing session that reads the tree and picks other than the suggestion had two rules pointing opposite ways. `standards/plan.md` bars filling the answer slot and requires amending the plan in place when a decision changes, and `558-plan` carries the pair under separate headings, so the prohibition read as covering the whole question block. Twice the deviation went to a pull request description instead, and a review pass is what moved it onto a durable surface both times.

The route settled as a clarification rather than a new state. Amending the `- Suggested:` line was already permitted and already preserves the blank slot, so the gap was reach rather than permission, and the contract now says the prohibition covers the answer line alone.

The route reaches an unanswered question alone. A deviation from a filled slot goes back to whoever filled it, because a suggestion rewritten under an answer leaves the plan holding two picks with no default resolving them, which is the failure the blank slot exists to prevent arriving through the fix for it.

A fourth marker on the question block was the alternative it beat. The block already carries a suggestion, an answer slot, and a blank-means-accept default, and a template growing a line per edge case stops being read. The rewritten line opens with the fixed phrase `overridden at execution to <pick>,` instead, which names the source on a line already being rewritten and adds no marker.

The measurement was the first candidate for that tell and it does not discriminate. 219 of the 898 `- Suggested:` lines in the plan archive already carry a number and every one of them was written by the plan's author, so a reader meeting a measurement learns nothing about who put it there and the archived plan still reads as though its suggestion held. A tell that fires on a quarter of the authored corpus is the same outcome as no tell, which is what the fixed phrase closes.

The deviation also takes one line in the open task's `## Findings`, because the plan is archived at ship and the task is what the board still points at. Naming the plan alone puts the record in a file nobody opens after the fact. The two registers hold different halves, the plan carrying why the pick moved and the task carrying what shipped. `standards/tasks.md` names the finding class from its own side, since a handoff written on one side of a boundary is never checked against the standard on the other, which is the both-sides rule the answer-contract inversion above already follows.

Two occurrences is what the rule is written against. `#891` split a context entry into six files where its plan suggested four, `#907` split another into five where its plan suggested three, and both shipped with the slot blank and the reason off the plan. Both reached a correct outcome after review, so what the change removes is a review dependency rather than a broken artifact.

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

## The architecture record's verification anchor

`standards/architecture.md` takes the verification marker the diagram standard already carries, in a different form and on a narrower scope. A diagram entry is one file per kind and keys its marker in frontmatter. The architecture record is one file holding 15 decisions and carries no frontmatter at all, so a file-level key would date the newest edit and say nothing about the other 14. The anchor is therefore a trailing sentence on the decision entry, the only granularity the record's own diagram-folder reasoning permits.

Scope is forward. The 15 decisions already in the record stay unanchored, because dating each one by blame is archaeology for a marker nothing reads back. What that costs is a period where an unanchored entry means unchecked and never-anchored at once, which the standard resolves by turning the reading on whether the entry cites a number rather than on when it was written.

The rule reaches only a decision citing a measured number. The record's entries carry counts such as 486 occurrences across roughly 150 committed files, and those go stale while the reasoning around them stays correct. Requiring the anchor everywhere prices the cheap case at the expensive one, and an entry whose reasoning stands on its own has nothing to check.

A third class was drafted and cut, covering a decision that cites no number while resting on a state of the tree that can change. It gave the writing rule a case the reading rule could not express, since an unanchored entry in that class reads as needing nothing while the writing rule asked for a marker. Keying on the number alone is what collapses the two rules onto one test, and a marker over a claim nobody can re-measure is one no reader can falsify.

Nothing writes the anchor back. The diagram field has two writers that never touch each other's half, one setting `verified` and one appending `stale`, and the architecture record has neither. The rule shipped ahead of the pass that maintains it, since a rule with no anchored entries yet costs nothing to carry, and `.claude/ARCHITECTURE.md` records the gap as an open risk rather than leaving it to be re-derived.
