---
title: Per-standard decisions
description: What the plan standard fixes and why its sections are mixed, the inverted answer contracts, where an execution-time deviation is recorded, how a constraint declares its expiry, the memory standard, what the memory pen measured, the widened readiness test, the architecture record's verification anchor, and the cross-reference form split by destination
---

# Per-standard decisions

Five standards in the corpus cost more reasoning than their shape rules show.

- The plan and memory standards were both drafted against a live folder holding two or three files, so the plan standard shipped a rule the whole corpus failed and the memory standard was measured against the pen instead
- The plan standard costs a second time for an unrelated reason, two rules under separate headings that read as pointing opposite ways
- The plan standard costs a third time for its constraint block, which is measured against a tree that has moved by the time a worker reads it
- The tasks standard carries a readiness test that has to admit a row no fact on disk can confirm
- The architecture standard borrows a marker from a sibling surface that has two writers and gets none of its own
- The publish standard splits one rule by destination, so the same reference takes opposite spellings on either side of the remote and no check can reach the half that goes wrong

What each one settled belongs here rather than in the file itself, which states the rule and not the count behind it.

## The plan standard

`standards/plan.md` fixes the section list, the suggested-and-answer contract, and the lifecycle from `.claude/plans/` to `.claude/plans/archive/`. `claude-feature` defined that shape inside its own body and two more skills consumed it, which is past the second-case bar, so the body now cites the standard and `claude-autoship` and `claude-docs` each point at the half they read.

The section markers are mixed on purpose, `## Summary` as a heading and the other four as bold labels, because that is what the corpus writes. Across 178 archived plans, `Summary` is a heading in 176 and a label in none, while `Files to touch` is a label in 146 against 21 headings and the other three split the same way.

The mix reads as an inconsistency until the counts are in front of you, which is why they are recorded here.

Sampling the live folder is what got that wrong the first time. Three plans were in `.claude/plans/`, two of them writing `## Risks` and `## Questions`, so the minority variant looked like the convention and the standard shipped requiring headings for all five.

Running the new check against the real folder returned a finding for every plan present, all of them that one rule, which is the signal that the rule rather than the corpus was wrong.

Measure a format claim against the archive, since the live folder holds two or three files and says nothing.

The check accepts either spelling for a section and names the table's form in the finding. A plan carrying `## Risks` has stated its risks, so failing it teaches a reader to skip the output on the rule they are least served by, which is the same failure as a gate whose findings are all whitelisted.

## The plan answer contract

The plan and intake answer contracts invert each other and both files state the inversion, which is the both-sides rule applied to a contract rather than to a scope entry.

A blank `- Answer:` accepts the suggestion because a plan is written and read in one sitting with every question already surfaced, while an empty `You:` means unread because an intake folder is read over weeks and silence there is far more likely to be absence than assent.

`558-plan` routes `.claude/plans/**` and joins `base`, following `556-groundwork` and `557-intake`. That one glob covers the archive as well, since a shipped plan moves into `.claude/plans/archive/` rather than to a folder of its own, so the second `paths` entry the rule used to carry came off with the move. It carries the three directives that ship silently when violated, a filled answer slot, a deleted plan, and a deviation from a suggestion recorded off the plan, and points at the standard for the rest.

## Where an execution-time deviation goes

An executing session that reads the tree and picks other than the suggestion had two rules pointing opposite ways. `standards/plan.md` bars filling the answer slot and requires amending the plan in place when a decision changes, and `558-plan` carries the pair under separate headings, so the prohibition read as covering the whole question block. Twice the deviation went to a pull request description instead, and a review pass is what moved it onto a durable surface both times.

The route settled as a clarification rather than a new state. Amending the `- Suggested:` line was already permitted and already preserves the blank slot, so the gap was reach rather than permission, and the contract now says the prohibition covers the answer line alone.

The route reaches an unanswered question alone. A deviation from a filled slot goes back to whoever filled it, because a suggestion rewritten under an answer leaves the plan holding two picks with no default resolving them, which is the failure the blank slot exists to prevent arriving through the fix for it.

A fourth marker on the question block was the alternative it beat. The block already carries a suggestion, an answer slot, and a blank-means-accept default, and a template growing a line per edge case stops being read. The rewritten line opens with the fixed phrase `overridden at execution to <pick>,` instead, which names the source on a line already being rewritten and adds no marker.

The measurement was the first candidate for that tell and it does not discriminate. 219 of the 898 `- Suggested:` lines in the plan archive already carry a number and every one of them was written by the plan's author, so a reader meeting a measurement learns nothing about who put it there and the archived plan still reads as though its suggestion held. A tell that fires on a quarter of the authored corpus is the same outcome as no tell, which is what the fixed phrase closes.

The deviation also takes one line in the open task's `## Findings`, because the plan is archived at ship and the task is what the board still points at. Naming the plan alone puts the record in a file nobody opens after the fact. The two registers hold different halves, the plan carrying why the pick moved and the task carrying what shipped. `standards/tasks.md` names the finding class from its own side, since a handoff written on one side of a boundary is never checked against the standard on the other, which is the both-sides rule the answer-contract inversion above already follows.

Two occurrences is what the rule is written against. `#891` split a context entry into six files where its plan suggested four, `#907` split another into five where its plan suggested three, and both shipped with the slot blank and the reason off the plan. Both reached a correct outcome after review, so what the change removes is a review dependency rather than a broken artifact.

## When a plan constraint expires

A constraint block names the file set of every track in flight, and a plan sits in the ready queue until a worker picks it up. Across the six plans written and executed on 2026-08-14, three named each other and were live at every branch point, one was planned and dispatched inside a single wave and stayed live, and two named a wave that had merged before their branch existed, so every constraint they carried was dead on arrival.

The two failures share a cause rather than an author error. Both were written during a refill while a wave was still building, which is the moment the sweep says to plan forward, so the constraint was correct when written and expired when read.

The block now opens with a stamp bullet reading Measured against `<commit>` on <YYYY-MM-DD>, and the standard says a worker re-tests before honoring it. A fetch paired with a log from the stamp to `origin/main`, scoped to the paths the constraint names, answers the test in one command, which is the bar the stamp had to clear, since a stamp a reader cannot act on costs a line per plan and saves nothing.

Two halves of that command carry the weight. The pathspec makes the read decisive, because a squashed merge carries a pull request number in its subject and the constraint names its track by work and file set. The fetch keeps the test honest, because a remote-tracking ref left behind reports fewer merges than have landed and hands back the dead-reads-as-live answer the stamp exists to remove. `claude-tasks` already pairs a fetch with a log in one command for the same reason.

One stamp covers the block however many tracks the constraints below it name, since a plan is written against the tree once. The stamp takes its own leading bullet rather than fusing to the first constraint, which is what leaves a two-track block with no question about which constraint the commit applies to.

A date alone was the cheaper stamp and does not discriminate. Two of the six were written the same afternoon and sat either side of three merges, so a reader comparing dates cannot tell which side of a wave a constraint was measured on.

Naming the tracks in the stamp beside the commit was the other candidate. The block already names each track by its work and its file set, so a second list of names is a second place to keep in step for a reader who has the first one directly above.

An unstamped constraint reads as unverified rather than as live, which is what covers the plans already in the queue. Restamping them is a sweep over files a worker may already hold, and confirming one without a stamp costs that worker the open pull request list, since the log has no commit to anchor against.

The rule sits in `standards/plan.md` with `claude-orchestrate` naming the stamp alone, because a worker running the planning skill in its own branch writes constraints too. Stating the obligation in both bodies puts one behavior in two places that ship on different cadences, and stating it only in the orchestrator covers one of the two plan authors.

No check parses the block. Nothing reads a plan's constraints today, and a validator over prose is a larger question than the line this answers, so the rule holds by being read.

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

Two of its rules pull opposite ways on a pass that amends a decision's reasoning without re-reading its numbers. Anchoring on an amendment asks for a refresh, and the marker recording what a claim was read against forbids one, so the honest answer dates the measurement rather than the edit. A branch retiring the worker cap imported a 2026-08-27 observation into the dispatch-boundary entry, stamped it at the branch point on 2026-08-28, and reverted to the observation's own date once the conflict surfaced.

## The publish standard's cross-reference form

`standards/publish.md` states the form a pull request or issue number takes, under `## Cross-reference form`. The rule is one test rather than a list of surfaces: bare where the destination auto-links it, backticked where it does not. A list goes stale when a seventh surface appears, and the test covers the cross-repository spelling without a clause of its own, since the same auto-linking reaches it.

The split runs through the remote. A pull request body, an issue body, a comment on either, and a commit message all auto-link, and a markdown file browsed from the repository tree links neither spelling, so the two forms are each correct in one place and a reference moved between them is rewritten. The failing artifact was a pull request body carrying the backticked form, corrected by hand, which is what surfaced that the spellings are not interchangeable.

`publish.md` holds the rule over `markdown.md` because it turns on where the text is going rather than on what the text is. `markdown.md` governs a file reference identically in every file, and this one is wrong in one destination and right in the other, which is the split `publish.md` already draws for phase labels. `markdown.md` carries the `Does not govern:` entry and `publish.md` names the rule in its own scope line, which is what makes the boundary declared from both sides. Writing the yield alone left a standard originating a rule its scope statement never claimed, and `.claude/context/standards/scope.md` holds that failure as the general case.

Six skills write GitHub conversational text and every one already cites the standard, so a single section reaches all of them and no skill body carries the rule. Restating it per skill would put one rule in seven places on seven cadences.

Quoted text is exempt, which the rule has to say rather than leave to judgment. Two of the six consumers quote repository prose into a GitHub comment, so an instruction to rewrite a reference moved between destinations reaches inside a quotation and reports the source as having said something it never said.

Nothing enforces it and nothing can. `aitk markdown audit` runs over repository files, where the backticked form is the correct one, so a check there would flag the compliant references in the tree and reach none of the published text that goes wrong. The rule joins the character and phase-label bans as something an author applies at publish time, and those at least have a verb behind them for the repository half.

## The glossary standard and its one stated exception

`standards/glossary.md` governs a glossary wherever it sits, which is why the format left `standards/teach.md` rather than staying inside it. A workspace glossary is promotable, so the shape has to travel with the file, and a rule stated in the standard over the folder it started in reaches nothing once it lands somewhere else. `teach.md` keeps the requirement that the file exists and yields the entry shape, which is the boundary declared from both sides.

The same reasoning is what moved it out of `teach.md` and into a standard of its own on 2026-08-20, since a promotion lands the file at a path no glob covers and `claude-teach` is the one surface driving every such move. It shipped at `standards/bundled/glossary.md` first and reached `claude-teach` through a fan-out copy, moving to the flat root once that route retired. Both readers name the skill rather than a path regardless of which route carried the file: `teach.md` because the file a promotion lands has no fixed address to point at, and `561-teach.md` because it ships with the CLI while the reference ships with the plugin, so it carries the report-the-gap instruction `500-prose` already uses across that split.

The format came from the external source the teaching surface was built against rather than from the one glossary-shaped page already here, which is the more specified of the two: it adds a term only once the material has used it, picks one word per concept and lists the rejected synonyms as aliases to avoid, and requires the glossary's own terms inside other definitions. `wiki/concepts/rule-writing-vocabulary.md` then departs on one rule and states the departure in its own intro, since a bank drawn from every session that produced a term has no first appearance to name and its use-when line carries what a reader came for instead. Recording the exception on the page rather than in the standard is what `standards/standard.md` already requires, since a standard citing a real file goes stale the moment that file moves.

## The diagram standard's aspect rule is a label-width problem

The taller-than-wide rule in `standards/diagrams.md` is decided by the widest rank's label text and column count, so a wide render is fixed by trimming node labels to three or four words and stacking independent siblings with a `~~~` invisible link, not by removing nodes. Five of six entries in the catalog expansion rendered wider than tall on the first pass at 1.10 to 2.03 and every fix came from label width or column count: `internal ~~~ domains` inside a subgraph moved `components.md` from 1.10 to 0.84 with every node and edge unchanged, and folding two bash nodes into one label took `components-cli.md` from 1.42 to 0.76. Read the ratio mechanically out of bytes 16 to 24 of a PNG header after rendering through `bunx -y @mermaid-js/mermaid-cli`. A fan-in the standard bans is a separate problem, and a vertical timeline with the trigger on each edge label clears both at once.
