---
title: Gating stages
description: The stages that gate a push on a measure, covering the sandbox coverage ceiling, plugin manifest validation, and the seed independence token walk
---

# Gating stages

Five stages read a measure and fail a push on it rather than regenerating anything. Each states what it does when its input is missing, since a stage that skips quietly reports the pass it exists to withhold.

## Sandbox coverage

`aitk sandbox coverage` reports which scenarios declare expectations, and until this stage existed the number moved only when someone thought to run it. The Sandbox coverage stage reads the same report and gates on it, so a scenario added with no expectation fails a push rather than sitting undeclared.

The gate is `SANDBOX_UNDECLARED_CEILING` in `scripts/core/verify.sh`, an absolute count of scenarios declaring nothing, pinned at what a clean run reported when the stage landed. A floor under the declared count was the obvious shape and it passes the case the stage exists for, since adding an unarmed scenario leaves the declared count where it was. A ratio moves when a scenario is legitimately deleted. The ceiling does neither: deleting an unarmed scenario lowers it, and deleting an armed one leaves it alone.

Raising the number is a deliberate edit, which is the point. A branch shipping an unarmed scenario has to say in the diff which one and why, rather than watching a percentage drift down over several merges with no single commit responsible.

A coverage command that exits non-zero fails the stage under CI and warns on a contributor's machine. The scenario tree ships in the checkout, so a runner that cannot read it has a broken command rather than an absent tree, and taking the skip there would report the pass the stage exists to withhold. That is the split Manifest validation below already draws for an absent `claude` binary, and a warning inside a green run is read by nobody.

## Manifest validation

The Plugin manifests stage runs `claude plugin validate --strict` over every plugin and marketplace manifest the repository carries. It always runs, because a manifest edit is not the only thing that invalidates one and the whole stage costs about a third of a second.

It discovers its inputs instead of naming them. Two `git ls-files` listings, tracked and untracked, match `*.claude-plugin/plugin.json` and `*.claude-plugin/marketplace.json`, so a marketplace manifest added later is covered the day it lands with no edit to the script. Both listings honor `.gitignore`, which is what keeps linked worktrees and dependency copies from being validated as if they were ours.

The stage is guarded on `claude` resolving on `PATH` and reports a skip when it does not. CI installs the JavaScript runtime and two shell tools and nothing else, so an unguarded stage would fail the build on a machine that never had the plugin CLI. The guard makes the stage an author-side gate that CI does not currently reach.

`--strict` promotes warnings to failures, which is what makes the stage catch a manifest missing metadata rather than only one that fails to parse. The cost is that a Claude Code release introducing a new warning fails `bun run check` for everyone until the manifest answers it.

## Skill paths

The Skill paths stage runs `scripts/core/check-skill-paths.sh` over the shipped skill tree and fails on a path that resolves only in this repository. A shipped skill runs from a plugin cache in someone else's project, where this tree's top-level folders reach nothing, so a citation reading correctly here is a dead pointer everywhere the skill actually runs.

The walk reads inside fenced code blocks, which is what makes an illustrative example count. A TOML block demonstrating the label map in `claude/skills/git-pr/references/labels.md` used this repository's own `docs/` and `wiki/` rows and failed the stage. That is a true positive rather than the fenced-example class the Seed independence stage below accepts, since an example is the part of a reference a reader copies, so a target handed one built from this layout learns a folder set it does not have. An example in shipped content invents its paths.

The failure message assumes a match inside a `references/` folder is a generated copy and directs the fix to `standards/bundled/`. A hand-authored reference under a single skill breaks that assumption, so the recovery it prints names a source file that does not exist and the fix belongs in the reference itself.

## Hero provenance

The Hero stage regenerates `assets/hero.html` and asserts no drift on it, then runs `assert_hero_stamp` over the image beside it. The drift assert cannot reach the PNG, because a chromium render moves its bytes with the browser version and a machine on a different chromium would fail on that rather than on a stale count. That leaves the artifact a README visitor actually looks at asserted by the second half of the stage alone.

`aitk capture` writes `assets/hero.stamp` from inside the render, recording a `source-sha256` over the markup it read and an `image-sha256` over the bytes it wrote. The stage hashes both files where they sit on disk and compares each against its field. What it proves is provenance: this image came from this markup, whatever either file's history says.

Both halves clear on a staged regeneration rather than on a committed one. `assert_no_drift` reads `git diff --exit-code` against the working tree and `git ls-files --others`, so `git add` of the three files satisfies it while nothing is committed, and `file_sha256` reads the path rather than a committed blob. A branch that regenerates the markup, runs the capture, and stages the triple therefore passes `bun run check` before its commit exists, which is what lets a ship chain verify ahead of the step that commits. Measured 2026-08-14.

Two digests rather than one, because either file can move alone. The markup side catches an edit committed with no capture. The image side catches a PNG replaced, truncated, or committed by itself under markup that never changed, which a markup-only digest passes and which the timing read caught by accident. Recording only the markup traded one hole for another rather than closing both.

Comparing the commit that last touched each file was the previous read and it measures timing. Two branches editing different counts merge clean while the binary conflicts, and a conflict resolved by taking either side leaves both files moved by the same commit with the image showing one branch's numbers. The digests catch that case and both cases above.

Writing the stamp inside the render rather than in a wrapper is what makes it worth reading. A caller cannot capture and skip the stamp, so a PNG without a current one is either uncaptured or hand-placed, and the stage names which of the three files is missing rather than reporting a mismatch it cannot compute. All three absent passes, which is correct for a tree carrying none of them.

Each digest covers a whole file rather than the five counts inside it. A template edit changes what the image shows without moving any count, and hashing bytes keeps the stage ignorant of what the markup renders, which is what lets it stay correct as the frame grows fields.

The counts are regenerated from the standards and skills trees, so any branch adding a standard or a skill moves `assets/hero.html` whether or not it meant to touch the frame. Clearing the stage then costs a capture and all three files in the commit, which puts that branch in collision with any track holding `assets/` however its plan drew the file set. Read the collision off this stage rather than off the plan.

`file_sha256` refuses on a machine carrying neither `sha256sum` nor `shasum`, and it refuses on stderr. Every caller reads it through a command substitution that captures stdout into the digest, so a message written there is swallowed and the stage reports a mismatch against a blank value, which names the image as wrong when the checker is what could not run.

## Seed independence

The Seed independence stage runs `scripts/core/check-seed-independence.sh`, which walks the `.md` files under every seed root and fails on the literal token `aitk`. Seed prose installs into a scaffolded project and is read there as instruction about that project, so a line naming this repository's CLI hands a target a verb it may not be able to run and tells the reader the file is about somewhere else.

Banning a token is blunt, and the alternative is a judgment no stage can make. The only false-positive class is a fenced example naming the toolkit on purpose, which no seed carries, and a rule admitting fenced mentions would parse markdown to answer a question the corpus has never asked.

The match is a bare substring rather than a word boundary, and `grep -w` does not narrow it. A slash and a dot are both non-word characters, so `grep -w aitk` still matches `.claude/aitk.json` with a boundary sitting either side. The bare substring is deliberate rather than unrefined, and the stage prefers a false positive to a missed citation because it gates.

### What the walk covers

The walk is scoped by extension rather than by path. Three seed hooks, `tasks-index.sh`, `memory-index.sh`, and `standards-audit.sh`, call the CLI deliberately and each reports by name when the binary is absent, so they keep the dependency and the extension scope leaves them outside the walk with no exemption list to maintain against them.

`standards-audit.sh` joined that set when the ban sets moved into the CLI, since the standard it used to parse no longer carries them. It is the first of the three whose absent binary leaves a check without a runner rather than an index stale, so it reports that nothing was checked rather than passing, and it answers an empty record the same way, the audit having refused outside a git repository.

Discovery runs through `collect_seed_roots` in `scripts/lib/tooling.sh`, shared with the Seed standards stage, so a stack seeding `.claude/` later is covered with no edit to either caller.

Three outcomes separate a clean walk from one that measured nothing, matching `check-plugin-boundary.sh` on the last two. A missing `tooling/` exits 1, since the walk covers nothing. Roots that resolve and carry no markdown between them exits 1 for the same reason, because a pass there says the seeds cite no CLI on the strength of having read no prose. No seed root carrying `.claude/` exits 0 and says so, because the Seed standards stage already reads that one condition as a skip.

`internal/rules/claude/596-claude-md.md` carries the matching authoring rule, so a session editing the seed meets it at the edit rather than at the push. Its glob stays on the two `CLAUDE.md` paths rather than widening to every seed markdown, since the three bullets beside it govern the root-and-seed pair and mean nothing over `.claude/REQUIREMENTS.md`. The stage is what covers the rest of the seed tree.
