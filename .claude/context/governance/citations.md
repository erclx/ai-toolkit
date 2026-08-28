---
title: Citations
description: Verdict for every rule and standard citing a skill or a sibling document, the two forms that resolve for a target, and the moot exception
---

# Citations

## Overview

Owns whether a citation inside `governance/rules/` or `standards/` resolves for the target holding it, and whether the citing body restates the content it points at rather than pointing at it cleanly. Excludes a `## Scope` "Does not govern:" entry, which names an owner rather than asking a reader to load or follow anything, and excludes rule-restates-sibling-rule duplication, which `aitk gov restated` covers mechanically.

## The two forms that resolve for a target

- `aitk standards <name>` resolves for any target. The verb reads `standards/` at the project root first, then the package corpus, so it needs no fallback behind it. Most citing rules and standards use this form.
- A plugin skill named with the `aitk:<skill>` prefix, paired with a line reporting rather than proceeding silently when the skill does not resolve, degrades honestly either way: it loads for a target holding the plugin and names the gap for one holding governance alone.
- A bare skill name carrying neither the prefix nor the fallback line is the defect the two repaired rows below share. It resolves for a plugin-holding target and fails silently for every other one.

## Verdicts

### Restated its target, now cut to a pointer

Each rule below duplicated bullets the cited standard already states. The rule-authoring standard's own scope line settles the call: a rule points at the standard that owns a convention and never restates it. Every rule listed cut its restated bullets, keeping only its `Authority` pointer plus any content the standard does not cover.

- `governance/rules/claude/520-wireframes.md` → `aitk standards wireframes`: cut the ASCII-fence, region-label, copy-verbatim, interaction-intent, and same-PR-update bullets.
- `governance/rules/claude/530-requirements.md` → `aitk standards requirements`: cut the goal-as-outcome, non-goal, MVP-lifecycle, later-scope, and `## Distribution` bullets.
- `governance/rules/claude/540-architecture.md` → `aitk standards architecture`: cut the decision-H3 and verification-anchor bullets.
- `governance/rules/claude/550-design.md` → `aitk standards design`: cut the token-as-intent, no-CSS, table-format, and omission bullets.
- `governance/rules/claude/555-tasks.md` → `aitk standards tasks`: cut the origin-line, outcome-sizing, heading, no-implementation-detail, and archiving bullets, each restated close to verbatim.
- `governance/rules/claude/559-memory.md` → `aitk standards memory`: cut the routing and pen bullets.
- `governance/rules/claude/560-diagrams.md` → `aitk standards diagrams`: cut the refresh-only-changed-entries bullet and kept the `DIAGRAMS.md` migration bullets, which the standard does not state.
- `governance/rules/claude/562-session.md` → `aitk standards session`: cut the own-file, worktree-root, compaction-only, and citation bullets, and kept the routing bullet pointing at `555-tasks.md`, which the standard does not carry.
- `governance/rules/claude/570-skill.md` → `aitk standards skill`: cut the `REQUIREMENT.md` gap-line bullet and kept the `create-skill` question bullet and the after-editing bullets, none of which the standard states.
- `governance/rules/claude/580-readme.md` → `aitk standards readme`: cut the audience-and-voice bullets, each restated close to verbatim.
- `governance/rules/claude/590-rule-authoring.md` → `aitk standards rule`: cut the numbering and body bullets, each restated close to verbatim.
- `governance/rules/claude/591-standard-authoring.md` → `aitk standards standard`: cut the scope-statement bullets, each restated close to verbatim.
- `governance/rules/claude/510-context.md` → `aitk standards context`: cut the supersede-in-place bullet. Moot for a target holding governance alone, per the row below, and cut anyway rather than left for whoever opens the file next.
- `governance/rules/claude/556-groundwork.md` → `aitk standards groundwork`: cut the folder-name and measuring-and-closing bullets. Moot for the same reason.
- `governance/rules/claude/557-intake.md` → `aitk standards intake`: cut the folder-name and answer-contract bullets. Moot for the same reason.
- `governance/rules/claude/561-teach.md` → `aitk standards teach`: cut the workspace-conventions bullets. Moot for the same reason.

### Resolved only for a plugin-holding target, now repaired

- `governance/rules/core/045-memory.md` names `claude-memory-capture` and `claude-docs` bare, with no fallback. Repaired to the `aitk:` prefix plus a report-if-missing line, and tightened its vague "which your toolkit resolves by name" standard pointer to `aitk standards memory`.
- `governance/rules/lang/120-bash.md` names `bash-script` and `cli-script` bare, with no fallback. Repaired the same way.
- `governance/rules/claude/561-teach.md` and `standards/teach.md` both name `claude-teach` bare. Each already carried the report-if-missing line (the rule's own, the standard's "say so and stop"), so the only gap was the missing prefix. Repaired to `aitk:claude-teach` in both.
- `governance/rules/claude/570-skill.md` names `create-skill` bare, twice, with the report-if-missing line already present. Repaired to `aitk:create-skill` in both places.
- `standards/markdown.md` names `write-human` bare in the sentence explaining why cadence and rhythm are excluded from this file's scope. Unlike the "Does not govern:" bullets the Gotchas section exempts, this sentence sits in ordinary prose describing where a markdown edit routes, so it reads as a citation rather than a boundary statement. Repaired to `aitk:write-human`.

Three prior instances of this defect, named in this task's own findings, are already fixed on `main` and needed no further repair here: `claude/592-claude-md.md` no longer cites `.claude/ARCHITECTURE.md`, and `claude/575-hooks.md` no longer cites a context entry. The third, `standards/teach.md` plus `claude/561-teach.md` already carrying the fallback line for the `claude-teach` glossary reference, turned out to be half-fixed rather than fixed: the fallback line was there, the `aitk:` prefix was not, which is the repair two rows above closes.

The context-entry half of that defect recurs on rules written after the repairs rather than being closed by them. `claude/576-settings.md` was drafted on 2026-08-28 closing on `.claude/context/development/hooks.md` as the record holding this repository's own answer for the settings it governs, which is the citation `claude/575-hooks.md` had already been repaired for and which sits in the same folder one number away. What pulls an author there is real: a rule stating a general fact wants to point at where the local decision lives, and for a rule that ships through `aitk gov sync` no such path exists on the reader's machine. A rule stating its facts and naming no path is what ships instead, and the local answer is reached from the entry rather than from the rule.

### Moot: the target cannot reach the governed surface

A rule scoped to a folder only a plugin skill creates is inert rather than broken for a target holding governance alone. The folder never exists there, so the file glob never matches and the citation never fires. No repair applies. The row exists so a later pass does not misread inertness as a defect.

- `governance/rules/claude/510-context.md`, scoped to `.claude/context/**`. Nothing but `claude-docs` and `claude-memory-capture` writes an entry there.
- `governance/rules/claude/556-groundwork.md`, scoped to `.claude/groundwork/**`. Nothing but `claude-groundwork` creates a track folder.
- `governance/rules/claude/557-intake.md`, scoped to `.claude/intake/**`. Nothing but `claude-intake` creates a dump folder.
- `governance/rules/claude/561-teach.md`, scoped to `.claude/teach/**`. Nothing but `claude-teach` creates a workspace.
- `governance/rules/core/025-indexes.md` names both `.claude/context/` and `.claude/wireframes/` as places to check an index before searching. Only the second is moot. A governance-only target can hand-author a wireframe entry against `standards/wireframes.md` with no plugin skill involved, so that half of the rule is a clean pointer.
- `governance/rules/snippets/505-at-references.md`, an always-on rule with no `paths:` glob, carries no skill or standard citation and states what to do when a snippet is referenced with `@`. It landed on `base.toml`'s stack after `#1168`, and the same install channel that dropped means a governance-only target holding no `.claude/snippets/` folder has no `@`-reference the rule ever fires on. The inertness reasons the same way as the other four rows even though the mechanism differs: theirs is a glob that never matches, this one is a rule that always loads but governs a reference that never appears.

Each of the four entries that restated their standard also carries a moot verdict here, which only matters for the plugin-holding target that can actually reach the folder. Cutting the restatement cost nothing beyond the mechanical pass the repaired list above already ran, so it went out with the rest rather than waiting for whoever next opens one of those four files. The verdict table above reflects that: each of the four is listed both as restated-and-cut and as moot, since the two verdicts answer different questions about the same file. The fifth row, `505-at-references.md`, carries no citation to restate and is listed here for the moot verdict alone.

### Clean pointer, no other note

- `governance/rules/claude/500-prose.md` → the `write-human` skill, named with the fallback line.
- `governance/rules/claude/501-markdown.md` → `aitk standards markdown`.
- `standards/skill.md` → several sibling standards by path, all within the flat `standards/` corpus every delivery route carries whole.
- `standards/tasks.md` → `standards/versioning.md` and `standards/plan.md`, same reasoning.

### Standards corpus, examined and excluded

`grep -rl "write-human\|claude-teach\|claude-groundwork\|claude-intake\|claude-docs\|claude-memory-capture\|standards/[a-z-]*\.md\|aitk standards\|aitk:" standards --include="*.md"` names 18 files carrying a candidate citation. Two, `skill.md` and `tasks.md`, carry a genuine citation and sit in the clean-pointer list above. `markdown.md` and `teach.md` sit in the repaired list above. The other 14, `diagrams.md`, `glossary.md`, `groundwork.md`, `intake.md`, `issue.md`, `memory.md`, `plan.md`, `pr.md`, `publish.md`, `readme.md`, `snippets.md`, `standard.md`, `versioning.md`, and `wireframes.md`, name `write-human` or `markdown.md` only inside a `## Scope` "Does not govern:" bullet, which the Gotchas exclusion below covers, and carry no citation this entry verdicts.

`diagrams.md` and `wireframes.md` each carry one further mention outside that bullet, in a sentence naming a "voice yield" a sibling standard grants the surface. `diagrams.md` says a section "claims the yield the `write-human` skill grants." `wireframes.md` says its Behavior and Copy prose "follows `markdown.md` and the `write-human` skill." Read as describing a cross-standard relationship rather than instructing the reader to load anything, the same reasoning the Gotchas exclusion applies to a "Does not govern:" bullet. `markdown.md`'s repaired sentence reads differently: it states where a markdown edit routes, which is closer to a directive than a boundary description, and that difference is why one got a verdict and the other two did not.

## Gotchas

- A "Does not govern:" line naming a skill or a sibling standard is a scope exclusion, not a citation. `standards/standard.md` requires exactly this shape for every excluded concern, so the many "the `write-human` skill" mentions across the standards corpus carry no verdict here.
- The mechanical duplication sweep behind `aitk gov restated` catches a rule restating a sibling rule or `CLAUDE.md`. It does not catch a rule restating the standard it cites, which is this entry's subject and stayed a manual read for that reason.
- A rule can carry both the restated-its-target and the moot verdict at once. Moot says the citation never fires for a target holding governance alone. Restated says the rule's own bullets duplicated its standard regardless. Neither excuses the other.
