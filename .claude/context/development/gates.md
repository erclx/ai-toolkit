---
title: Gating stages
description: The stages that gate a push on a measure, covering the sandbox coverage ceiling, plugin manifest validation, and the seed independence token walk, plus the one measure-reading stage that reports instead
---

# Gating stages

Six stages read a measure and fail a push on it rather than regenerating anything. Each states what it does when its input is missing, since a stage that skips quietly reports the pass it exists to withhold.

A seventh reads a measure and reports it. `## Audit set` at the end of this entry covers it, and it sits here rather than in `.claude/context/development/verification.md` because what it reads is a measure like the six above rather than a gotcha about a stage.

## Sandbox coverage

`aitk sandbox coverage` reports which scenarios declare expectations, and until this stage existed the number moved only when someone thought to run it. The Sandbox coverage stage reads the same report and gates on it, so a scenario added with no expectation fails a push rather than sitting undeclared.

The gate is `SANDBOX_UNDECLARED_CEILING` in `scripts/core/verify.sh`, an absolute count of scenarios declaring nothing, pinned at what a clean run reported when the stage landed. A floor under the declared count was the obvious shape and it passes the case the stage exists for, since adding an unarmed scenario leaves the declared count where it was. A ratio moves when a scenario is legitimately deleted. The ceiling does neither: deleting an unarmed scenario lowers it, and deleting an armed one leaves it alone.

Raising the number is a deliberate edit, which is the point. A branch shipping an unarmed scenario has to say in the diff which one and why, rather than watching a percentage drift down over several merges with no single commit responsible.

A coverage command that exits non-zero fails the stage under CI and warns on a contributor's machine. The scenario tree ships in the checkout, so a runner that cannot read it has a broken command rather than an absent tree, and taking the skip there would report the pass the stage exists to withhold. That is the split Manifest validation below already draws for an absent `claude` binary, and a warning inside a green run is read by nobody.

## Manifest validation

The Plugin manifests stage runs `claude plugin validate --strict` over every plugin and marketplace manifest the repository carries. It always runs, because a manifest edit is not the only thing that invalidates one and the whole stage costs about a third of a second.

It discovers its inputs instead of naming them. Two `git ls-files` listings, tracked and untracked, match `*.claude-plugin/plugin.json` and `*.claude-plugin/marketplace.json`, so a marketplace manifest added later is covered the day it lands with no edit to the script. Both listings honor `.gitignore`, which is what keeps linked worktrees and dependency copies from being validated as if they were ours.

The guard tests twice, first that `claude` resolves on `PATH` and then that `claude --version` succeeds, because a global install can land the wrapper and none of the platform-native package behind it, which leaves a name that resolves and a binary that dies on the first real call. A contributor's machine takes a skip on either failure, since an absent or half-installed CLI there is someone mid-setup rather than a broken gate. CI installs the plugin CLI as a workflow step, so both failures refuse there, and the refusal for a binary that cannot run names the pinned version rather than the install step that already succeeded.

`--strict` promotes warnings to failures, which is what makes the stage catch a manifest missing metadata rather than only one that fails to parse. The cost is that a Claude Code release introducing a new warning fails `bun run check` for everyone until the manifest answers it.

## Skill paths

The Skill paths stage runs `scripts/core/check-skill-paths.sh` over the shipped skill tree and fails on a path that resolves only in this repository. A shipped skill runs from a plugin cache in someone else's project, where this tree's top-level folders reach nothing, so a citation reading correctly here is a dead pointer everywhere the skill actually runs.

The walk reads inside fenced code blocks, which is what makes an illustrative example count. A TOML block demonstrating the label map in `claude/skills/git-pr/references/labels.md` used this repository's own `docs/` and `wiki/` rows and failed the stage. That is a true positive rather than the fenced-example class the Seed independence stage below accepts, since an example is the part of a reference a reader copies, so a target handed one built from this layout learns a folder set it does not have. An example in shipped content invents its paths.

The banned pattern is a bare `wiki/` with no exemption for a body that has a reason to name it. A shipped skill routing a page into a project's wiki has to describe both spellings, and only `.claude/wiki/` survives the match, so the root spelling is stated as a folder named `wiki` rather than as a path. That is the phrasing the promotion routing in `claude-teach` carries.

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

The match is a bare substring rather than a word boundary, and `grep -w` does not narrow it. A slash is a non-word character, so `grep -w aitk` still matches `.claude/aitk/config.json` with a boundary sitting either side. The bare substring is deliberate rather than unrefined, and the stage prefers a false positive to a missed citation because it gates.

### What the walk covers

The walk is scoped by extension rather than by path. Three seed hooks, `tasks-index.sh`, `memory-index.sh`, and `standards-audit.sh`, call the CLI deliberately and each reports by name when the binary is absent, so they keep the dependency and the extension scope leaves them outside the walk with no exemption list to maintain against them.

`standards-audit.sh` joined that set when the ban sets moved into the CLI, since the standard it used to parse no longer carries them. It is the first of the three whose absent binary leaves a check without a runner rather than an index stale, so it reports that nothing was checked rather than passing, and it answers an empty record the same way, the audit having refused outside a git repository.

Discovery runs through `collect_seed_roots` in `scripts/lib/tooling.sh`, shared with the Seed standards stage, so a stack seeding `.claude/` later is covered with no edit to either caller.

Three outcomes separate a clean walk from one that measured nothing, matching `check-plugin-boundary.sh` on the last two. A missing `tooling/` exits 1, since the walk covers nothing. Roots that resolve and carry no markdown between them exits 1 for the same reason, because a pass there says the seeds cite no CLI on the strength of having read no prose. No seed root carrying `.claude/` exits 0 and says so, because the Seed standards stage already reads that one condition as a skip.

`internal/rules/claude/596-claude-md.md` carries the matching authoring rule, so a session editing the seed meets it at the edit rather than at the push. Its glob stays on the two `CLAUDE.md` paths rather than widening to every seed markdown, since the three bullets beside it govern the root-and-seed pair and mean nothing over `.claude/REQUIREMENTS.md`. The stage is what covers the rest of the seed tree.

## Standard success criteria

The Standard success criteria stage runs `bun src/cli.ts standards audit --arrivals-only`, which fails a push when a standard new to the branch carries no `## Success criterion` section. It is scoped to arrival rather than to the corpus, since `standards/standard.md` forbids writing the section into an existing standard outside the change that exercises it, and a gate over the corpus would fail every push until someone closed all 26 known gaps at once, which is the sweep that rule exists to prevent.

`--arrivals-only` prints nothing when every arriving standard carries the section, matching the Skill requirements stage's own silent-pass shape one domain over. The bare `aitk standards audit` a session runs by hand instead reports the whole corpus, so the same verb serves the gate and the reader without a second command to keep in sync.

## Audit set

The Audit set stage runs `aitk audits run --json` and reports. It is the one stage here that reads a measure and fails nothing, which is deliberate: the three findings the audits treat as facts already fail the push at their own stages above, and those name a specific remedy an aggregate line cannot. What this stage adds is the judgment half of every audit and the growth against `.claude/audits/baseline.json`.

Growth reports for the reason the ceiling above gates. The standards behind the largest counts set no hard cap, so a rising number is a fact about the corpus and a judgment about whether it matters, and a push failing on a judgment teaches a reader to route around the stage.

The baseline goes stale on `main` itself, so the branch report is not the reading a session wants. A branch inherits whatever growth `main` already carries and the stage attributes all of it to the run in front of the reader. Separating the two means running `bun src/cli.ts audits run` in the main worktree and diffing the two reports, which is the invocation the stage uses at `scripts/core/verify.sh:510`. Reach for the source rather than the binary, since a hand-run `aitk audits run` reads whatever version is installed and `0.106.0` carries no `audits` command at all. Measured 2026-08-20 against baseline `bd2be81a` on `feat/intake-origin-report`, which reported five grown measures before its own fix landed and four of them read identically on `main`.

It reads a flat `summary` object of scalars rather than parsing the nested record, through `json_summary_field`. That helper was `sandbox_summary_field` until this stage arrived and needed the same read, so both callers now share one grep-based reader in `scripts/core/verify.sh`.

### An absent corpus is not a stage failure

Six of the twenty audits read gitignored folders. No fresh clone and no CI run carries one, so a shape counting those as unmeasured printed the same warning on every run a contributor did not make on their own machine. A per-machine corpus refusing because its folder is missing therefore reports as absent, which the stage states and never warns on.

The stage still warns when an audit genuinely did not report, and the aggregate exits 3 there. A tracked tree that cannot be found is a broken checkout rather than an ordinary absence, so the allowance does not reach it.

### What the duplicate walk costs

Three of the twelve verbs run at their own gating stages earlier in the same script, so this stage walks those trees a second time. Measured at 0.8 seconds of wall clock against 4.4 seconds of processor for all twelve together, which is under every other stage here, because the verbs share no state and run concurrently.

Running only the verbs the earlier stages skip was the cheaper shape and it gives up what the aggregate is for. One verdict over the whole set is the product, and a stage measuring a subset reports a health nobody took.

## Gotchas

### A regen-then-assert stage clears one round at a time

The indexes, consumed-copy, and hero gates in `scripts/core/verify.sh` regenerate and then assert with `git diff --exit-code` against the index, so a correct regen fails the run until the rewritten files are staged. The gates are sequential and each halts the run, so clearing the indexes stage only reveals the consumed-copy stage behind it, and a change touching several regenerated surfaces at once costs a stage-and-rerun round per surface rather than one. Expecting a single staging to clear the run is what makes the second failure read as a real mismatch. `bun run check:install` reads one step further out, since `scripts/core/install-check.sh` runs `git clone` against the project root and therefore tests the last commit and never the index or working tree, so commit before citing it.

`assert_no_drift` pairs the diff with `git ls-files --others --exclude-standard`, so a regen emitting a never-committed file fails rather than passing.

### The forced staging narrows the next review

`claude-review` Step 2 uses `git diff --staged` as its scope whenever that is non-empty, so a review fired after a check reads only the regeneration. On one branch the staged set was three regenerated files while the branch carried fifteen, including every `src/` file the run existed to review. Both behaviors are documented and correct on their own, so nothing reports the gap, and it compounds when the base equals HEAD, which is every autoship run before its first commit. Check whether the staged set matches the branch before invoking a review, and say which scope was read.

### A fence is exempt from the prose gate and not from the spell gate

The prose-standards hook treats a fenced code block as exempt and `bun run check:spell` does not, so an invented short identifier inside a mermaid fence passes every prose gate and fails the check that blocks the commit. A four-letter sequence-diagram participant alias abbreviating the word session produced four cspell failures in one diagram entry after it had cleared the prose rules, and `standards/diagrams.md` names the fence exemption for the prose hook while saying nothing about the spell stage, so the exemption reads wider than it is. Spell participant aliases and node ids as whole words. The punctuation bans apply inside labels with nothing checking them.

### A write grant has to agree with the formatter

Any tool granted write access to a format-checked file has to agree with the formatter, and a release configuration's `extra-files` mechanism is that kind of grant. `release-please` bumps the version in `claude/.claude-plugin/plugin.json` and re-serializes the whole file, expanding `keywords` to one string per line, while prettier collapses any array fitting the print width, so the first release pull request the automation produced landed a file failing `bun run check` and would have done so at every future release. Run the tool and the formatter over the same content and diff the two before wiring the grant. A real file with a fixed name takes a formatter ignore entry, unlike sample content, which takes a suffix.
