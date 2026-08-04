---
name: claude-intake
description: Files a raw brain dump into a numbered intake folder under `.claude/intake/<slug>/`, one item per finding carrying a measured problem, a proposed fix, and a verdict. Use when asked to "file this dump", "triage my notes", "work through this list", "sort out this brain dump", or "run an intake pass". Do NOT use for one question that has to be measured before anyone can plan it. That is `claude-groundwork`.
---

# Claude intake

Intake dispositions many findings in breadth. A dump goes in, an inventory comes out, and every item carries a problem measured against the tree, one proposed fix, and a verdict. The item that turns out to be already settled is the highest-value output, and it is the one thing neither a plan nor a groundwork track has anywhere to put.

Read `${CLAUDE_SKILL_DIR}/references/folder-format.md` before writing any file in the folder. It holds the numbering, the file map, the frontmatter, and the item template.

## Routing

The test is one question. Can the item be answered by reading the repository today?

- Yes: intake owns it, and the cost is a session of grepping
- No, because it needs an experiment or a source outside the project: route it to `claude-groundwork`, where the cost is measured in runs and days
- Already decided, with only the work left: route it to `claude-feature`

Apply the test per item rather than per dump. A dump of forty items typically yields one groundwork candidate, so routing the whole dump on its worst item buys a folder nobody can close.

Using the wrong one fails in two shapes. Intake on a question that needs measuring yields a confident verdict with nothing behind it. Groundwork on a brain dump is refused by its own qualifying guard, and forcing past that refusal gives one folder holding dozens of unrelated threads and a decision file that can close one of them.

## Guards

- If no dump is given, stop: `❌ No dump to file. Paste the notes or name what to triage.`
- If the dump is one question rather than a set of findings, stop: `❌ One question, not a dump. Run /claude-groundwork to measure it or /claude-feature to plan it.`
- Do not pause for approval between steps. The write scope below is what makes that safe.

## Write scope

- Write only inside `.claude/intake/<slug>/`. A plan file, a task file, a source change, a standard, and a rule all live outside that folder, so this one rule forbids every one of them.
- There is no exception. Promoting an item onto the board runs through `claude-tasks` after the operator has answered, which is a separate invocation.
- Reading is unrestricted inside the project. Measuring is the work.
- Treat the folder as gitignored and unbacked. No check reaches its contents, so every rule stated here holds only while a session reads it.

Nothing outside this body carries the floor, and a path-scoped rule cannot. A rule globbing `.claude/intake/**` loads when a session opens a file inside the folder, which is the case that is already correct, while a write that escapes the folder lands on a path that glob never matches. What such a rule could carry is the item format and the answer contract, for a session editing the folder with this skill unloaded, and that is a document-type convention a rule points at rather than restates. The standard it would point at does not exist yet and `claude-groundwork` carries the identical shape, so the pair is queued as its own change rather than settled here.

## Step 1: detect open or resume

List `.claude/intake/` from the project root and match the topic against the folders already there before deriving a slug. A second pass over the same subject rarely phrases the topic the way the folder was named, so a fresh slug would open a duplicate beside a live folder.

Never match against `.claude/` itself. That directory holds every other workflow surface, so a topic matched there lands on a folder that was never an intake.

With no match, derive a kebab-case slug named for the subject rather than the activity. Prefer `toolkit-overview` over `august-triage`. An absent folder opens, and a present one resumes by appending items and revising verdicts the tree has moved under.

## Step 2: orient

Read these in parallel from the project root, skipping any that do not exist:

- `CLAUDE.md`: behavior rules, conventions, commands
- `.claude/REQUIREMENTS.md`: scope and non-goals
- `.claude/ARCHITECTURE.md`: decisions already made
- `.claude/tasks/index.md`: what is already tracked. Open a task file whose entry looks related to an item.

Then read only what a live item needs. Do not read entire directories speculatively. Where a folder carries an `index.md`, read it first and load only the files it points at.

## Step 3: measure against the tree

Grep for each construct an item names and count the sites. Every problem line carries a number or a file path taken during this pass.

Never carry a figure from an earlier session, a summary, or another document. The dump states the complaint and the tree states the size of it, and that measurement is the whole difference between an inventory and a list of opinions. Confirm that any work an item sequences behind is still open, so no item leads with something that already shipped.

Name the commit the pass measured against in the overview body. It is the half a later reader can check.

## Step 4: cluster

Split items by domain, one file per cluster, and let the file count follow the number of separable domains rather than the size of the dump. An item belongs to the domain its fix touches, not the domain the complaint arrived from.

Two heading levels is the right depth. A third means the cluster should have been split into its own file.

## Step 5: disposition each item

Write every item in the format below, in the cluster file its fix belongs to. Close each item with a verdict and an empty operator slot.

## Step 6: write the index

Write `00-overview.md` last, once the clusters are filed and the counts are real. It carries the format block, the cluster table, the verdict counts, the ready list, and the open questions.

Each open question in the index is a labeled markdown link to its owning item's heading anchor. The index points and the item owns, so no answer slot appears in the index. One question in two answerable places has no rule for which wins, and retrieval walks item headings, so an answer typed into the index is found by nothing and lost silently.

Add `99-next-session.md` only where the pass ends holding context no cluster file carries, such as a dump half filed or a measurement that has to be redone. Write it self-contained, since the folder is unbacked and the conversation behind it compacts away.

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
- `Suggested:` is required whenever `Open:` is present. A bare question invites a bare answer, and `ok` against two defensible options carries no information. Where the answer is the operator's preference rather than a technical call, say so in that form rather than inventing a default. The toolkit's `decision-help` snippet writes the same four-line shape for chat use, and the four lines above are the whole spec.
- `Overlaps:` never replaces `Worth it:`. The items where a live board task might be the thing that is wrong are exactly the ones whose verdict matters most.

## The answer contract

`You:` belongs to the operator and ships empty on every item.

Empty means unread. It never means agreement. Accepting a verdict is typed as one token, `- **You:** ok`.

That inverts the plan file's contract, where a blank `- Answer:` means accept the suggestion, and the inversion is deliberate. A plan is read in one sitting with every question already surfaced in chat. An intake folder is read over weeks, so an empty slot is ambiguous between accepting the verdict and never having reached the item, and the second reading is far more likely. Acting on silence as consent ships a change nobody approved.

Never fill a `You:` slot, and never infer a disposition from an empty one. On a resume pass, report unread items by count rather than deciding them.

## Numbering

Numbers are read order and nothing else. Reserve `00` for the index and carry the domain in every other filename, so `07-tooling.md` says what it holds before anyone opens it.

Do not reserve mid-range numbers. Clusters differ per dump, so a contract over `06` would force every future intake into one dump's shape. `claude-groundwork` reserves its numbers because its shape is fixed, and that half of the convention does not transfer.

## Output

Emit the full relative path from the project root for every file written, and name the heading and the act beside it. A path alone cannot distinguish three new items from one reworded sentence in a file that holds a dozen items and lives for weeks, so a bare path sends the reader to diff it against memory. This overrides the paths-only reporting the project states generally, which stays right wherever the reader is about to see a diff.

A file the pass only read gets no line, which is what keeps the block short.

```plaintext
📂 Opened .claude/intake/<slug>/

**Filed:**

- `.claude/intake/<slug>/05-coverage.md` gains items 6 to 8 under a new `## What the merge gate covers`
- `.claude/intake/<slug>/00-overview.md` cluster rows and verdict counts updated

**Routing:** <N> plan-ready, <N> groundwork candidates, <N> already settled

**Open questions:** <N> awaiting your call

Next: answer the `You:` slots, then /claude-tasks to promote what is ready
```

Use `📂 Resumed` in place of `📂 Opened` on a resume pass.
