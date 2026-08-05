---
title: Markdown audit
description: Running the audit over any markdown path, where its bans and checkpoints are read from, what each check reports, and why nothing gates yet
---

# Markdown audit

`aitk markdown audit [path...]` reports any markdown file against the two attribute standards, `markdown.md` and `prose.md`. An attribute standard governs a file rather than a folder, so this resolves no folder and requires no `index.md`, which is what puts `.claude/rules/`, `governance/`, and `snippets/` in reach. Folder-shaped findings stay in `aitk context audit`, described in `context-audit.md`.

```bash
aitk markdown audit
aitk markdown audit --json
aitk markdown audit .claude/rules governance
aitk markdown audit docs/agents/commands.md
aitk markdown audit 'snippets/**/*.md'
```

| Option   | Behavior                                                   |
| -------- | ---------------------------------------------------------- |
| `--json` | Add a machine-readable record on stdout, keeping the frame |

## Scope

An argument is a file, a directory, or a glob. A directory narrows to everything under it and a glob narrows by match, both against the corpus git lists, which is what keeps `node_modules/` and the gitignored session-scratch folders out without naming either. An explicit file path is taken as given, so a gitignored draft can be measured before it is committed. Quote a glob the shell would expand first.

A bare run measures every markdown file git lists, tracked plus untracked-and-not-ignored, so a file added on this branch is in scope on the branch that adds it. An argument matching no markdown file is named on the scope line rather than passed over, since a run measuring the paths that did resolve otherwise reads as a pass over one it never opened.

## Where the rules come from

Both ban sets and all five checkpoints are read out of the standards per run, resolved under `.claude/standards/` first and the authoring root second, so a target project measures against the copy it actually has. Holding the lists in code was the alternative and it puts each ban in two places, where an author adding one gets no enforcement until someone edits TypeScript.

The trade is a reader of prose that a reformat can break. `src/markdown/bans.test.ts` answers it by asserting the parsed sets against the shipped standards, so a rewrite that narrows a set fails there rather than passing quietly. A checkpoint falls back per number rather than per file, and the depth legend names every checkpoint that fell back on the run that used one.

## What each check reports

### Bans

Three closed sets report a hit: the characters `markdown.md` bans under `## Punctuation`, the single lowercase words `prose.md` bans under `## Language`, and the British spellings derived by applying that section's own suffix rules to its own examples.

Deriving the spellings rather than pattern-matching a suffix is what keeps `exercises`, `promises`, and `revised` out of the report. A suffix pattern over the same corpus produced 46 false positives from words of that shape, and a closed set of whole words reaches none of them.

Frontmatter, fenced blocks, inline code spans, and link destinations are excluded. Without the code-span exclusion each standard would report its own backticked examples, and without the link exclusion a semicolon in a query string would report as prose no rewrite can fix.

A banned word is bounded on a word character or a hyphen either side. A plain word boundary sits after a hyphen, so a banned word ending a hyphenated compound reported from inside one, and a compound is a single word to the reader who wrote it.

A banned spelling keeps the plain word boundary, hyphens included. The two bans target different things: a word ban targets the word, so reading a compound as one word is correct, while a spelling ban targets the orthography inside it, which sits in `behaviour-driven` as plainly as it sits alone.

Two ban shapes stay unmeasured and the report says so on every run. A phrase ban carries a placeholder standing in for the rest of the sentence, so no literal match reaches it, and every rule under `## Voice` is a judgment. A report listing hits without naming those would read as a verdict on the whole standard.

### Bullets, paragraphs, and depth

Bullet weight and depth are the checks that moved off `aitk context audit`, unchanged in what they measure. A top-level bullet reports past roughly 400 characters with continuation lines folded in and nested items left out. A run of lines no heading breaks reports past roughly 40 rendered lines, measured at 80 columns, skipping fenced blocks and exempting a flat peer list averaging under 130 characters a bullet and a run that is entirely table rows.

Every weight and depth measure counts the text a reader is shown. A link reduces to its anchor text and an autolink drops whole, since no reader is shown either destination. A backticked path stays counted, which is where these measures part from the ban scan above: that one blanks a code span so a standard quoting its own banned character does not report itself, and discounting the same span here would under-report a paragraph carrying several. One file holds both span sets and each answers its own question.

A code span is walked around rather than through, so a path quoting link or angle-bracket syntax keeps the width the page gives it. Masking inside one takes back the decision to count it, and the placeholders this toolkit writes are where that shows.

The paragraph check measures both halves of one rule. `markdown.md` caps a paragraph at four sentences, and a sentence cap on its own is satisfied by writing fewer and longer ones: 88 paragraphs in this corpus sit inside four sentences and past the weight checkpoint, and the heaviest of those runs 1121 characters. The standard therefore states a weight beside the sentence cap, and the verb reads it as its own checkpoint.

The paragraph weight sits at 600 and the bullet weight at 400. The two shapes measure one population, sharing a median near 170 characters with no gap behind either candidate, so the paragraph number was borrowed from the bullet rule when both checks shipped. They are separate checkpoints in the standard and separate patterns in the parser, and the sample below moved one and left the other untouched.

#### The sample behind the paragraph number

The checkpoint shipped at 400 as a borrowed number and was decided against a read of the prose it reports. Thirty-six findings were sampled, six from each of six weight bands, drawn at even spacing through each band ordered by path and line, and each was classed as prose a reader wants split or prose the checkpoint should not have reported.

| Band      | Wants the split | Reads as written |
| --------- | --------------- | ---------------- |
| 400 - 425 | 1               | 5                |
| 425 - 450 | 2               | 4                |
| 450 - 500 | 2               | 4                |
| 500 - 600 | 2               | 4                |
| 600 - 750 | 6               | 0                |
| Past 750  | 6               | 0                |

Precision is what moved the number rather than the finding count. Below 600 the checkpoint was right about seven of twenty-four sampled paragraphs, and past 600 it was right about all twelve. A checkpoint is a prompt to look, and a prompt wrong three times in four teaches a reader to stop looking. The distribution offers no seam to place the number against, with a median of 487 and a seventy-fifth percentile of 563, so the read is the whole of the evidence.

Nothing inside the 500 to 600 band separated the two classes by length, which is the reason the number did not land there. The two paragraphs wanting a split ran 543 and 590 characters against four reading well at 515, 532, 555, and 569.

The sample is thirty-six paragraphs against a reported population in the hundreds, and one reader classed all of them. Treat a band's rate as the order of magnitude it is rather than as a measured precision, and re-sample before moving the number again.

A bullet, a heading, a table row, a blockquote, a blank line, and a fence each end a paragraph, so a heavy bullet is reported by the bullet check alone and never counted twice.

## Exit codes

Exit codes are `0` for a completed run and `1` for a refusal. Every finding reports and none gates.

A banned character is a fact rather than a judgment, which is the test that would ordinarily make it gate. What holds it back is that gating on day one against a corpus never checked mechanically fails loudly on work nobody has had a chance to fix. The order is to land the verb reporting, measure the corpus once, fix what it finds, and turn the gate on as its own change. Bullet, paragraph, and depth weight are judgments and stay advisory under any later gate.

Measured across 444 files with the paragraph checkpoint at 600: 8 word hits, no character or spelling hits, 119 heavy bullets, 221 heavy paragraphs across 86 files, and 41 files carrying a run past the depth checkpoint. Of the paragraphs, 88 fire on weight alone. This is the baseline the corpus sweep tracks its work against. The ban count is what a gate would have to hold at zero, and it is the only one of the five a gate should ever read.

A count written into prose goes stale against the corpus it describes, and nothing compares the two. The paragraph figure recorded when the masking fix shipped was already wrong by twelve one release later, which is why the standard states the rule and this page carries the numbers.

A standard sits inside the corpus this verb measures, so rewriting a rule can breach the rule beside it. A rewrite of the paragraph weight bullet landed at 539 characters against the bullet checkpoint stated two lines below it, in the authoring copy and the consumed one alike. Neither the drift stage nor the test suite reads that, so run the verb over a standard after editing one.

Masking took 7 of the weight-only paragraphs the checkpoint reported at 400 and 4 of the 44 files under their checkpoints, and no bullet at all. The first corpus triage put those at 31 paragraphs and 2 bullets, and neither reproduces: a code span is walked around, so a backticked path holding an angle-bracket placeholder keeps the width the page gives it, and both bullets the triage counted were that shape.

## What it does not cover

The verb reads the two attribute standards and nothing else. The five standards declaring `appliesTo: ["*"]` also include `publish.md`, `slug.md`, and `versioning.md`, none of which this implements.

`publish.md` describes a scan applying the same punctuation bans to finished text on its way out. No code implemented that scan before this command, so nothing is duplicated, and a later surface should call this verb rather than build a second one.

The list-density rule at `standards/markdown.md` is out of scope on purpose, since it carries no number and what a density figure should measure is still open.
