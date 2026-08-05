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

Two ban shapes stay unmeasured and the report says so on every run. A phrase ban carries a placeholder standing in for the rest of the sentence, so no literal match reaches it, and every rule under `## Voice` is a judgment. A report listing hits without naming those would read as a verdict on the whole standard.

### Bullets, paragraphs, and depth

Bullet weight and depth are the checks that moved off `aitk context audit`, unchanged in what they measure. A top-level bullet reports past roughly 400 characters with continuation lines folded in and nested items left out. A run of lines no heading breaks reports past roughly 40 rendered lines, measured at 80 columns, skipping fenced blocks and exempting a flat peer list averaging under 130 characters a bullet and a run that is entirely table rows.

The paragraph check is new and measures both halves of one rule. `markdown.md` caps a paragraph at four sentences and nothing caps their length, so the rule as written is satisfied by writing fewer and longer ones. Measured across 2906 paragraphs, 344 sit inside four sentences and past 400 characters, and the heaviest runs 1159 characters in two, so a sentence count alone ships a check every one of them passes. Weight reuses the bullet checkpoint rather than introducing a second number, because the two populations share a median near 170 characters with no gap behind either candidate.

A bullet, a heading, a table row, a blockquote, a blank line, and a fence each end a paragraph, so a heavy bullet is reported by the bullet check alone and never counted twice.

## Exit codes

Exit codes are `0` for a completed run and `1` for a refusal. Every finding reports and none gates.

A banned character is a fact rather than a judgment, which is the test that would ordinarily make it gate. What holds it back is that gating on day one against a corpus never checked mechanically fails loudly on work nobody has had a chance to fix. The order is to land the verb reporting, measure the corpus once, fix what it finds, and turn the gate on as its own change. Bullet, paragraph, and depth weight are judgments and stay advisory under any later gate.

Measured across 443 files on the day this shipped: 9 word hits, no character or spelling hits, 109 heavy bullets, 610 heavy paragraphs, and 42 files carrying a run past the depth checkpoint. The ban count is what a gate would have to hold at zero, and it is the only one of the five a gate should ever read.

## What it does not cover

The verb reads the two attribute standards and nothing else. The five standards declaring `appliesTo: ["*"]` also include `publish.md`, `slug.md`, and `versioning.md`, none of which this implements.

`publish.md` describes a scan applying the same punctuation bans to finished text on its way out. No code implemented that scan before this command, so nothing is duplicated, and a later surface should call this verb rather than build a second one.

The list-density rule at `standards/markdown.md` is out of scope on purpose, since it carries no number and what a density figure should measure is still open.
