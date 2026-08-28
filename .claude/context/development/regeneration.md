---
title: Regeneration stages
description: The regenerate-then-assert stages, covering the consumed copies of standards, snippets, internal content, and rules, the tooling path contract, and the hero image with its single-writer rule
---

# Regeneration stages

Three stages regenerate a tracked artifact and then assert it did not move. Regenerating and then asserting is what turns an edit to a source surface into a failure that names the stale copy, rather than a copy nothing reads as wrong. The Indexes and Skill references stages share the shape, and their gotchas sit in `.claude/context/development/verification.md`.

## Consumed copies

The Consumed copies stage runs `scripts/core/regen-claude-copies.sh` and then asserts no drift across `.claude/rules`. `standards/` and `snippets/` mirrored here too until each copy stopped answering anywhere but this checkout, which is what closing their install channels left them doing. `internal/` mirrored on a different argument and retired on its own: nothing ever installed it, and both readers of the one standard under it sit at the root beside the source.

The assert reads the unstaged diff, so the first `bun run check` after an edit under `governance/rules/` reports its own regeneration as drift and exits red. Stage the rewritten copy and run again. The failure message asks for a commit while staging is what clears the stage, which is the distinction a ship chain needs, since it regenerates before the step that groups its commits. `.claude/context/development/verification.md` records the same shape for the Indexes and Skill references stages.

Staging to clear the stage changes what the next skill in that chain measures. `claude-review` scopes to the staged set whenever one is non-empty, so a run that staged three regenerated rules reviews those three files and reports a clean branch for the source sitting untracked beside them. Reset the index before the review step and let the chain restage at its own commit step. Nothing reports the narrowed scope, since a review of three files is indistinguishable from a branch that changed three files.

`.claude/rules/` is not a whole-directory mirror, because the toolkit authors 70 rules under `governance/rules/` and consumes 55 into `.claude/rules/`, and installing the framework and ui rules here would fire a React rule on a fixture this repository writes. It resolves through `aitk gov regen` instead, which reads the stack named in `internal/governance.toml` and installs it with the same machinery `aitk gov install` uses for a target.

The producer clears `.claude/rules/` before installing, so a rule dropped from the record disappears rather than lingering as an unsourced file. That is also why `internal/rules/` exists: a rule governing toolkit authoring alone needs a source somewhere outside `governance/rules/`, which ships to every target. `internal/rules/` named the internal mirror's one exclusion before this branch retired that mirror entirely, so those rules land at one path now for a simpler reason: nothing under `internal/` mirrors anywhere.

## Tooling paths

The Tooling paths stage runs `scripts/core/regen-tooling-paths.sh` and then asserts no drift on `claude/skills/toolkit-cli/SKILL.md`. The script rewrites the block between the `generated:tooling-paths` markers with every file each installable stack ships under `configs/`, which is the list a session reads before deciding whether `aitk tooling sync` is safe to run against a project.

Stack names come from `aitk tooling list --json` rather than from a walk of `tooling/`, so a stack `isStackExcluded` rejects stays out of a contract describing what the verb does. The block is the only part of the body the script owns, and a missing start marker fails the stage rather than appending a second block.

The whole file is asserted rather than the block alone, since a drift check over a fragment needs a parser and the file has one writer for that region and one author for the rest. What that costs is a stage that goes red when the surrounding prose is edited and left unstaged, which is the Consumed copies shape above and clears the same way.

## Sample content on disk

Sample content committed at its real filename gets rewritten by every repo-wide write pass that claims that filename. Moving the docs scenario's heredocs to disk put an `index.md` and a `package.json` on disk, and `aitk indexes regen` rebuilds any `index.md` from sibling frontmatter, so `bun run check` rewrote a fixture whose body deliberately disagreed with its sibling and then failed its own drift gate, while prettier reformatted the JSON and the leading blank line an append fixture depends on. Store such content under a `.fixture` suffix stripped on copy, which beats ignore-file entries and beats pruning a shared walker because it changes nothing for that walker's consumers. cspell still reads suffixed files, so spell coverage survives the move.

## Hero

The Hero stage runs `scripts/core/regen-hero.sh`, which fills `assets/hero.html.tmpl` from five catalogs and writes `assets/hero.html`, then asserts no drift on that file. The shape applies to a documentation image so no count on the README frame is maintained by hand.

The assert covers the HTML and not the PNG beside it. A capture is a chromium render whose bytes move with the browser version, so asserting the image would fail on a machine whose browser differs rather than on a stale count. A second assert closes the gap that leaves without rendering anything: `aitk capture` writes a digest of the markup it read and one of the image it wrote into `assets/hero.stamp`, and the stage hashes both committed files and compares each.

`aitk capture` is a toolkit-only verb, absent from an installed `aitk`, which refuses with that message rather than rendering. A session clearing this stage in this repository therefore runs it through the source entry point, as `bun src/cli.ts capture assets/hero.html`, and the globally installed binary is the wrong route however current it is.

Reading the commit that last touched each file measures timing rather than agreement, so a pair moved by one commit passes whatever the image holds. `.claude/context/development/gates.md` carries what the digest proves and the merge case that needs it. The cost is unchanged: a capture cannot ship as a follow-up commit, so regenerate, capture, and commit all three files in one step.

The assert compares against the index, the way the Consumed copies stage above does, so running `aitk capture` is not what clears the stage. All three files have to be staged before the next `bun run check`, and until they are the stage repeats the same message it printed before the capture ran. Reading that repeat as the capture having failed is the trap, since the render succeeded and only the staging is outstanding.

The frame carries no version number. `package.json` is bumped on `main` by the release tooling, and a pull request builds against the merge commit, so an embedded version drifts on every open branch the moment a release lands and the stage then fails for work that touched nothing. Counts have the same shape and are kept, because a catalog change is what the stage exists to catch and the branch that changes a catalog is the one that goes red.

`assets/hero.html` is in `.prettierignore` because the stage and the formatter would otherwise both own it and serialize it differently. The Format stage runs first and rewrites the file, the Hero stage rewrites it back, and the drift assert then reports against whichever version was committed last. The pre-push hook reformats and asks for the result to be committed as `style(<scope>):`, which is exactly the path that would commit the formatter's version and deadlock the stage. One writer per generated file is the rule the entry beside it already applies to the release tooling.
