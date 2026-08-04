---
title: Groundwork folder reference
description: Reserved file numbers, required file contents, and anti-patterns for a .claude/groundwork/ folder
---

# Groundwork folder reference

Applies to a groundwork folder at `.claude/groundwork/<slug>/`. The numbering is the table of contents: a reader opens the folder and knows where to start and what follows, with no index maintained inside each file. Protect that first, because the instinct when adding a file mid-track is to name it for its topic instead.

The folder is gitignored and unbacked. It dies with the machine, which is why the handoff file has to be self-contained.

## Reserved numbers

Five slots carry a fixed meaning. The rest are free, which is what lets the middle of a folder follow its subject.

| Number       | Holds                                           | Required                    |
| ------------ | ----------------------------------------------- | --------------------------- |
| `00`         | Scope: constraints, risks, question list        | Large tracks only           |
| `01`         | Current state, measured                         | Always                      |
| `02` to `05` | Topic files, whatever the subject demands       | As needed                   |
| `06`         | Decision                                        | To close                    |
| `07`         | Handoff, self-contained                         | To close                    |
| `08`         | Spikes: method, result, and cost per experiment | Tracks that run experiments |

A folder missing `06` and `07` is live. That is the only status marker, and no separate tracking is needed.

`08` sits after the closing files because it is an appendix. It holds evidence rather than a topic, so folding it into the `02` to `05` range buries it, and a track closes with or without one.

## README.md

Orients. Holds no findings.

- A one-line definition of the investigation
- The date opened
- A `## Why` section stating why the track is running now
- A file-map table of filename and what it holds, kept current as files are added or retired
- A `## Method` section splitting internal sources from external ones, naming which were used and which were not yet done, and listing under a leads heading any external source found but not opened
- A `## Prior art` section
- A `## Source citation` section stating the rule below, so a returning session picks it up from the folder
- The phase stated out loud in the first three lines, in the form `Groundwork phase. Nothing here is a feature plan.`

The file map is how a returning reader re-enters. After the decision, it is the highest-value thing in the folder.

Every claim about a source outside the project carries a link to it, wherever the claim appears in the folder. A sentence asserting that the vendor documents something reads the same whether it came from a fetched page or from recall, and a later reader can neither check it nor tell the two apart.

A source found and not read is listed as a lead and is never cited. That half is what keeps the rule from producing citation theater, because a link attached to a page nobody opened is worse than no link. Listing it still pays, since it stops a later pass re-searching for what this one already surfaced.

Where the track supersedes an earlier plan or an earlier folder, name it and say not to go looking for it. Without that, the old reasoning keeps circulating.

## 01-current-state.md

Facts before opinion. Verified measurement only, taken during this pass.

- Never carry a figure from a previous session without re-measuring. Stale ratios survive a sunset that invalidates them, and every number built on top of one is quietly wrong.
- Mark an inference as an inference where one is unavoidable.
- Measure only what an open question needs. A number with no question attached is the mechanism by which the groundwork becomes the work.

## 00-scope.md

Written when the subject is large enough to run away. Holds constraints, risks, the open question list, and the downstream surfaces a decision would touch. A small track skips it and carries its questions inside the topic files.

## 06-decision.md

Closes the folder. Everything above it is input.

- The problem stated once
- The goal
- The items to do
- What was considered and dropped

The dropped list pays off later. It is what stops a future session re-proposing something already rejected.

## 07-next-session.md

Written to survive a compaction that loses the conversation. It repeats facts held elsewhere in the folder rather than pointing at them. That duplication is correct here and wrong everywhere else.

## 08-spikes.md

Evidence by experiment, sitting beside the evidence by measurement `01-current-state.md` holds. Optional, and most tracks never open it, because measuring what is already there settles most questions.

Each spike carries four things:

- The open question it answers, named by file and number. A spike attached to no question is the same runaway the current-state file is capped against.
- The method, stated fully enough for a later reader to re-run it. Name the fixture and where it lived, the exact command, and how many repetitions were run. A headless arm pointed at a fixture inside the repository measured the repository, so the fixture location is part of whether the result stands.
- The result, and which question it closes. A spike that settles nothing is still recorded, so a later pass does not pay to learn the same thing twice.
- The measured cost, and the caveats that bound what the result proves.

Cost is a report rather than a limit, and it is what makes the next spike estimable before anyone commits to it. Record it even when it comes to a single read.

Reach for a test harness the project already carries before building one. A track that needs an experiment no existing harness can express has found a finding, and it belongs in the folder rather than in a new abstraction.

One method error is worth naming here, because it was made and corrected rather than imagined. Counting matches in a transcript overstates whether a file was read, since an instruction that names a path puts that path in the transcript whether or not anything opened it. The check is the tool call.

## Conventions

- Questions carry an open or answered marker, and open ones repeat at the end of the file they belong to. That gives `06-decision.md` its agenda for free.
- Every open question carries a lean and what would overturn it, in the open question format in `SKILL.md`. A measurement question records that it needs measuring instead of guessing.
- State a number with what it settles. The strongest sections are the ones where a measurement answers a named question and says so.
- Send findings that would change an existing standard or rule to a backlog. Only a demonstrated failure changes one.
- Let the file count follow the number of genuinely separable questions, not the importance of the topic. A large topic with one question is a small folder.

## Anti-patterns

- **The groundwork becomes the work.** Gathering expands until the measuring costs more than the change it justifies. Cap it, and drop any thread with no question attached.
- **Deciding by omission.** Closing a track while an unresolved question quietly fails an outcome. Resolve it or record it as knowingly accepted.
- **Recording a constraint discovered while defending a decision.** Check a constraint against the alternative design before writing it down, or a fact about the current shape gets written up as inherent to the problem.
- **A plan written before the groundwork.** Every track that has done this had to supersede the plan it wrote.
