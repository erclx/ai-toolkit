---
title: Regeneration stages
description: The regenerate-then-assert stages, covering the consumed copies of standards, snippets, internal content, and rules, and the hero image with its single-writer rule
---

# Regeneration stages

Two stages regenerate a tracked artifact and then assert it did not move. Regenerating and then asserting is what turns an edit to a source surface into a failure that names the stale copy, rather than a copy nothing reads as wrong. The Indexes and Skill references stages share the shape, and their gotchas sit in `.claude/context/development/verification.md`.

## Consumed copies

The Consumed copies stage runs `scripts/core/regen-claude-copies.sh` and then asserts no drift across `.claude/standards`, `.claude/snippets`, `.claude/internal`, and `.claude/rules`.

The assert reads the unstaged diff, so the first `bun run check` after an edit to any of the four authoring surfaces reports its own regeneration as drift and exits red. Stage the rewritten copy and run again. The failure message asks for a commit while staging is what clears the stage, which is the distinction a ship chain needs, since it regenerates before the step that groups its commits. `.claude/context/development/verification.md` records the same shape for the Indexes and Skill references stages.

Three of the four are whole-directory mirrors. `.claude/rules/` is not, because the toolkit authors 38 rules and consumes 22 of them, and installing the framework and ui rules here would fire a React rule on a fixture this repository writes. It resolves through `aitk gov regen` instead, which reads the stack named in `internal/governance.toml` and installs it with the same machinery `aitk gov install` uses for a target.

The producer clears `.claude/rules/` before installing, so a rule dropped from the record disappears rather than lingering as an unsourced file. That is also why `internal/rules/` exists: a rule governing toolkit authoring alone needs a source somewhere outside `governance/rules/`, which ships to every target. The internal mirror excludes `internal/rules/` so those rules land at one path rather than two.

## Hero

The Hero stage runs `scripts/core/regen-hero.sh`, which fills `assets/hero.html.tmpl` from five catalogs and writes `assets/hero.html`, then asserts no drift on that file. The shape applies to a documentation image so no count on the README frame is maintained by hand.

The assert covers the HTML and not the PNG beside it. A capture is a chromium render whose bytes move with the browser version, so asserting the image would fail on a machine whose browser differs rather than on a stale count. A second assert closes the gap that leaves without rendering anything: the two files move together or the image is stale, so their last-touching commit has to be the same commit.

Comparing the branch's changed-file list instead would pass any branch that touched both somewhere, including one that regenerated the HTML alone in a later commit. The cost is that a capture cannot ship as a follow-up commit, so regenerate, capture, and commit both files in one step.

The frame carries no version number. `package.json` is bumped on `main` by the release tooling, and a pull request builds against the merge commit, so an embedded version drifts on every open branch the moment a release lands and the stage then fails for work that touched nothing. Counts have the same shape and are kept, because a catalog change is what the stage exists to catch and the branch that changes a catalog is the one that goes red.

`assets/hero.html` is in `.prettierignore` because the stage and the formatter would otherwise both own it and serialize it differently. The Format stage runs first and rewrites the file, the Hero stage rewrites it back, and the drift assert then reports against whichever version was committed last. The pre-push hook reformats and asks for the result to be committed as `style(<scope>):`, which is exactly the path that would commit the formatter's version and deadlock the stage. One writer per generated file is the rule the entry beside it already applies to the release tooling.
