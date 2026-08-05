---
title: Markdown audit
description: Running the audit over any markdown path, where its bans and checkpoints are read from, what each check reports, and why the ban half gates while the structural half reports
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

Exit codes are `0` for a completed run with no gating finding, `1` for a refusal, and `2` for a ban hit. A banned character, word, or spelling fails the run. Bullet, paragraph, and depth weight are judgments a reader settles, so all three report under every code.

`2` rather than `1` for the gate keeps a measurement that succeeded and found something distinct from the audit declining to measure at all. A caller reading one as the other sends a reader hunting a defect that does not exist, which is the distinction `aitk context audit` and the `verify.sh` seed stage already draw between the same two codes.

A banned character is a fact rather than a judgment, which is the test that admits it to a gate. What held it back was that gating on day one against a corpus never checked mechanically fails loudly on work nobody has had a chance to fix. The order was to land the verb reporting, measure the corpus once, fix what it finds, and turn the gate on as its own change, and the gate is the last of the four.

Measured at `4b7b13a2` across 444 files with the paragraph checkpoint at 600: 8 word hits, no character or spelling hits, 119 heavy bullets, 221 heavy paragraphs across 86 files, and 41 files carrying a run past the depth checkpoint. Of the paragraphs, 88 fire on weight alone. This is the baseline the corpus sweep tracked its work against. The ban count is what the gate holds at zero, and it is the only one of the five a gate should ever read.

The ban half of that baseline reached zero, which was the precondition the gate waited on, and it was re-measured against the same corpus at the moment the gate landed. The other four moved with the corpus rather than with any decision, so read them from a run rather than from this paragraph.

### What a hit asks of an author

Rewrite the sentence rather than swapping the banned token for a near-synonym. The rule is about the sense the token carries, so a swap that keeps the sense clears the report without clearing the violation.

A code span clears the report too, since the ban scan walks around one, and it is the answer only where the token is genuinely an identifier under discussion. `## Code and identifiers` in `markdown.md` reserves the span for commands, API names, file paths, and identifiers, so backticking a quoted utterance spends one rule to satisfy another and leaves the corpus no cleaner.

A hit the closed set cannot separate from correct prose is the case with no third option. `prose.md` bans vague qualifiers and lists the tokens those qualifiers happen to spell, so the temporal `just` reports as the vague one. The rule as written reaches neither, and rewriting the sentence is what the toolkit settled on over building an exemption path, for the reasons below.

### Where the rules are enforced

Four surfaces read the ban sets and two of them go through this verb. `.claude/hooks/standards-audit.sh` runs it against a single file after each markdown edit, and the `Markdown bans` stage in `scripts/core/verify.sh` runs it across the whole corpus before a push. The hook parsed its own copy of the word bans in awk until the gate landed, which left a British spelling passing at edit time and failing the push with nothing in between explaining the difference.

The other two read the standards directly and neither is a consolidation left half done. `claude/skills/claude-standards-audit/SKILL.md` greps the banned tokens agent-side, which is a session reading prose rather than a process it can shell out to, and it ships to every target. The seed copy of the hook keeps its awk, because a scaffolded project may carry no `aitk` and `scripts/core/check-seed-independence.sh` exists to catch seed content depending on the toolkit CLI. Both are the likelier place for the next drift, since nothing compares either against the verb.

The hook prefers a checkout's own `src/cli.ts` over a globally installed binary, so it and the push stage read one build. A published binary lags a branch by whatever has not been released, which would put a ban kind added on the branch into the push and not into the edit. It reads its findings out of the `--json` record rather than off the exit code, so an older binary still reports where the fallback applies. A machine with neither runner gets no enforcement at edit time rather than a blocked edit, and the push stage still holds.

The stage measures the whole corpus rather than the changed files. A `Do not use` bullet added to a standard bans a token retroactively, and no file in the push that adds the bullet was edited.

### Why a recorded count goes stale

A count written into prose goes stale against the corpus it describes, and nothing compares the two. The paragraph figure recorded when the masking fix shipped was already wrong by twelve one release later, which is why the standard states the rule and this page carries the numbers.

A standard sits inside the corpus this verb measures, so rewriting a rule can breach the rule beside it. A rewrite of the paragraph weight bullet landed at 539 characters against the bullet checkpoint stated two lines below it, in the authoring copy and the consumed one alike. Neither the drift stage nor the test suite reads that, so run the verb over a standard after editing one.

Masking took 7 of the weight-only paragraphs the checkpoint reported at 400 and 4 of the 44 files under their checkpoints, and no bullet at all. The first corpus triage put those at 31 paragraphs and 2 bullets, and neither reproduces: a code span is walked around, so a backticked path holding an angle-bracket placeholder keeps the width the page gives it, and both bullets the triage counted were that shape.

### How the ban count reached zero

Eight word hits stood between the baseline and a gate, and only three carried the sense `prose.md` bans. `leverage` sat in the requirements worldview, `allows` in the claude stack reference, and one `just` was the vague qualifier in a skill body. Those three lost the qualifier rather than the word.

The other five were correct prose the closed set cannot separate from a violation. Four were the temporal `just`, meaning a moment ago, in phrases like the implementation `just` completed and the field the user `just` edited. The fifth quoted an anti-pattern a skill exists to forbid. `prose.md` bans vague qualifiers and lists the tokens those qualifiers happen to spell, so the rule as written reaches none of the five while the scan reaches all of them.

### Why they were rewritten rather than exempted

Rewriting all five is what settled them, over building an exemption path. An exemption has three consumers, `src/markdown/scan.ts` for the patterns, `src/markdown/bans.ts` for the sets, and `.claude/hooks/standards-audit.sh`, which held its own copy of the word bans in awk at that point. A mechanism landing in the verb and not the hook leaves an exempted line still failing on edit, which is the surface an author actually meets. Five sentences lost a small amount of naturalness and the count now means what it says.

A code span was the first answer for the quoted anti-pattern and it was the wrong one. The ban scan walks around a code span, so backticking a quotation clears the report, and `## Code and identifiers` reserves the span for commands, API names, file paths, and identifiers, which a quoted utterance is none of. Spending one rule to satisfy another leaves the corpus no cleaner than dropping the qualifier does.

The collision is structural rather than a property of five legacy sentences. Writing the task and the plan behind this change each reproduced it, because a fresh file discussing the ban quotes the tokens it discusses. A later author writing about vague qualifiers meets the same thing, and the answer is to name the token in a code span where it is genuinely an identifier being discussed, and to rewrite the sentence where it is not.

## What it does not cover

The verb reads the two attribute standards and nothing else. The five standards declaring `appliesTo: ["*"]` also include `publish.md`, `slug.md`, and `versioning.md`, none of which this implements.

`publish.md` describes a scan applying the same punctuation bans to finished text on its way out. No code implemented that scan before this command, so nothing is duplicated, and a later surface should call this verb rather than build a second one.

The list-density rule at `standards/markdown.md` is out of scope on purpose, since it carries no number and what a density figure should measure is still open.
