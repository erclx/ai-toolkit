---
name: draft-and-pick
description: Drafts several candidates for a decision judged by looking, renders them side by side on one page, hands the operator the addresses, takes the pick through the structured question surface, and loops on the pick until they stop. Use when asked to "draft some options", "show me a few versions", "try a few variations", "mock up alternatives", "give me candidates for X", or when a choice is taste rather than correctness. Do NOT use when the request already names the answer and asks for it to be built, which is `claude-feature`. Do NOT use to read source for roughness, which is `claude-ux-audit`, to measure what a running interface costs to paint, which is `claude-ux-measure`, to write tests for a change already made, which is `claude-ui-test`, or to script a recording, which is `canon-screencast`.
---

# Draft and pick

Some decisions are settled by looking rather than by reasoning, and no draft is wrong until one is picked. Every step here puts several candidates in front of the operator and keeps the real surface untouched until they have chosen.

## Guards

- If the request names one answer and asks for it to be built, stop: `❌ This names one answer, so there is nothing to pick between. Use /canon:claude-feature.`
- If the decision has no visible form, stop: `❌ Nothing to look at. Drafting candidates needs a decision a render can show.`
- Draft no candidate for a decision the operator has not asked to make. A run offering options everywhere spends their attention rather than saving it.

## Step 1: name the decision and the arms

1. State the decision in one sentence, naming what changes between arms and what stays fixed.
2. Derive a kebab slug from that sentence. Every file this run writes goes to `.canon/tmp/<slug>/`, per `.claude/rules/core/055-scratch.md`.
3. Write one arm per candidate, each carrying an id, a label, and what the arm costs. An arm with no stated cost is not an option.
4. Make the current state arm `0`, so the baseline is a candidate rather than an absence. A decision with nothing shipped yet says so and starts at arm `1`.
5. Stop at three to five arms. Two is a comparison the operator can hold in prose, and past five the pick stops being a look and becomes a sort.

## Step 2: author the candidate set as one page

Write every arm side by side on one self-contained HTML page at `.canon/tmp/<slug>/candidates.html`.

- One page, never one file per arm. The comparison is the artifact, and several images handed over separately ask the operator to hold the differences in memory.
- Label each arm on the page with its id and its cost, so the render carries what the question will ask about.
- Inline every style, script, and asset the page needs. The render reads the file off disk, so a page reaching for a build step or a network font renders without it and the arms differ by something nobody chose.
- Vary one property across the arms. A page whose arms differ in three ways answers no question, since the pick cannot say which difference decided it.

## Step 3: render and hand off

Render the page, then look at what came back:

```bash
canon capture .canon/tmp/<slug>/candidates.html --selector <element>
```

- `--selector` has no default and the command refuses without it. Name the element wrapping the arms rather than `body`, which crops to whatever the page's own margins leave.
- `canon capture` and `canon drive` both need a browser binary the toolkit does not install. When either refuses for that reason, report the refusal and name `bunx playwright install chromium` as the repair, then stop rather than describing an arm nobody has seen.
- Serve the page instead of capturing it when the operator has to drive the decision, such as a hover response, a scroll-linked position, or a pace. Start `canon serve .canon/tmp/<slug> --entry candidates.html` in the background and read the link off its record, since the printed link opens `index.html` without that flag and the scratch folder holds no such file. A still answers how a thing looks and answers none of those.
- Hand over the address rather than a description. Emit the PNG path on its own line, and the link beside it where the page is served.
- Never report a visual result you have not looked at. A claim about appearance with no render behind it is a guess.

## Step 4: take the pick

Put the choice to the operator through the structured question surface, per `.claude/rules/core/005-behavior.md`.

- One option per arm, labeled with the arm's id and carrying its cost as the description.
- Rank the recommendation first and mark it `(Recommended)`.
- Author the real arms only. The surface appends its own escapes for a free-text answer and for reopening the question, so writing either as an option ships a duplicate the tool rejects.
- Take no pick on the operator's behalf when two arms are both defensible and the difference is taste. That call is theirs, and a silent one is the failure this skill exists to prevent.

## Step 5: loop on the pick

1. Narrow the page to the picked arm, plus whatever the operator asked to change about it.
2. Write fresh arms off the pick and return to Step 2 where the correction opens a new question. Revise the one arm where it does not.
3. Re-render, hand off again, and take the next answer.
4. Repeat until the operator says it is right. The loop stops on their word and on nothing else, so a run stopping because the arms stopped differing has stopped early.
5. Hold the real surface untouched across every iteration. Nothing outside `.canon/tmp/<slug>/` changes until the pick is final.

## Step 6: close

1. Apply the winning arm to the real surface, in one change.
2. Delete `.canon/tmp/<slug>/` and every losing arm with it. A variant left behind is a second design nobody maintains.
3. Report the surface that changed on its own line, and name the arm that won by its id and its cost.

## Reading a measurement

A capture proves appearance and a measurement proves a relationship, so reach for the second whenever the claim is about a number, such as a contrast ratio, a column width, or a tap target. `canon drive` runs the probes and ships the failure modes each one carries.

Three rules no probe reaches:

- Composite alpha before reading a color. A `color-mix` toward transparent resolves to channels plus an alpha, and reading those channels as opaque reports a color nobody sees.
- Sample inside the shape. A patch taken at the corner of a bounding box misses a round control and reads the page behind it, which is how a ground repair measured as no change at all.
- Ask whether a reader would see the thing, not only whether it has the right shape. A panel reported a healthy 1517 by 639 for as long as it sat 1868px above the viewport, and every check that read its size passed.

`canon drive` reports findings and never gates, by its own help text. Read its record as evidence handed to the operator rather than as a filter over the arms, since a run dropping an arm on a probe reading has made a claim the probe catalog has not earned.

## What this delegates

Cite these rather than restating them. A step reimplemented here rots against the skill that owns it.

- `claude-feature` plans the work once the pick is made, and declares the pull request boundary that plan carries
- `write-human` carries the voice for any copy an arm puts in front of a reader
- `git-stage`, `git-pr`, and `git-followup` carry the commits and the pull request
- `claude-review` and `claude-address-review` run the review pass
