# Architecture

Authoring guidance: `.claude/standards/architecture.md`.

## Overview

The toolkit is a CLI plus a Claude Code plugin, built so an agent can drive every surface a human can. Content is authored once at a project-root folder, consumed here through a generated copy under `.claude/`, and reaches a target project either by an `aitk` install command or by loading live from the plugin root.

Six domains carry the weight: governance rules, standards, snippets, tooling stacks, plugin skills, and the CLI that installs them. Each domain's structure and gotchas live in `.claude/context/<domain>.md`. This file holds what crosses domains and nothing else.

## Key technical decisions

### Two delivery paths rather than one

The toolkit reaches a target two ways. `aitk` commands copy governance rules, standards, snippets, and tooling configs into the project, and the marketplace plugin loads skills live from `claude/`. A single channel was the obvious alternative, and neither channel can do the other's job.

Copied content is what a project edits and owns, so it has to land as real files under version control. Skills are toolkit-owned process that goes stale the moment it is copied, so it loads from the plugin root instead.

What the split costs is a citation that crosses it. A skill body naming an installed path resolves only for a project that ran the matching install, and nothing reports the gap, because an unresolved path produces no error until a session opens it. A file only one skill reads therefore travels inside that skill, which is what moved the three orchestrator runbooks from `snippets/` into `claude/skills/claude-orchestrate/references/` and retired the preset naming them. Publishing on both surfaces was the alternative and it makes two sources for one text, so the catalog keeps what several surfaces reach and a skill carries what only it reads.

### A standard already travels four routes, so the corpus stays out of the fan-out

`standards/` reaches a project four ways where the tree appears to show one. `aitk standards install` writes the flat root into a target, `claude/standards` is a symlink an install dereferences so every plugin cache holds the whole corpus, `standards/bundled/` fans out into each consuming skill's `references/`, and the published package carries the corpus in its `files` array, which the CLI reads as its own last-resort root.

The second route already delivers the self-containment a proposal would build. Someone who installs the plugin and runs no CLI command has every standard on disk, and 38 of the 60 plugin skills already name it as the fallback behind the installed path. The fourth route delivers the same thing to a machine reader, since `src/standards/read.ts` searches the package corpus behind both project roots, so a command reading a standard answers in a project that installed none. A project copy wins wherever one exists, because an installed standard is a seed a project edits and a package copy overriding it would discard that edit with nothing said.

Moving the flat corpus into the fan-out was the alternative, and what declines it is a measurement rather than a preference. The fan-out writes one copy per consumer and stands at eleven copies from six sources, so the most-cited standard, named by eighteen skill bodies across the two catalogs, would land a copy in each. That scales the duplication the fan-out exists to prevent, and it breaks every pointer rule and all three machine consumers of the installed tree at once.

A machine-parsed standard is permanently exempt from any design inlining a standard into the rule that cites it, because a rule restating the list a parser reads is two sources for one list. The set is empty: `prose.md` and `markdown.md` were the two members and neither is parsed any more, since the three ban sets and the six structural checkpoints now ship as data in `src/markdown/`. Stating the rule rather than the pair is what leaves it standing for a parser that arrives later. Measured at `60fc97bf` on 2026-08-19.

Moving the sets is what emptied it, and the reasoning it rests on admits the move rather than forbidding it. The bar is on inlining a list into the rule that cites it, and it rests on there being two sources for one list, so relocating the list to a single source the machine owns satisfies the bar. The standards still state every ban and every checkpoint for a reader, which is the ordinary arrangement everywhere else in the corpus.

What the move costs is that the prose and the shipped numbers can now drift with nothing comparing them, and that a project can no longer tune a set by editing a file. The spelling set in particular stops being derived from the standard's own suffix examples, so an example added there no longer extends the check.

Both costs are accepted on the same measurement. The sets are a prior an author already knows rather than a filter that has caught anything: 21 terms across 483 markdown files reported a clean exit, and each of the 70 occurrences of a banned word sat inside the ban list itself or inside an example demonstrating it. Enumeration cannot close the gap they aim at either, since `just`, `allows`, and `very` carry honest uses no literal match separates, so the set is closed rather than extensible.

### The toolkit consumes its own output

`standards/` and `snippets/` author at the repository root and install into a target under `.claude/`. This repository commits its own consumed copy at `.claude/standards/` and `.claude/snippets/`, regenerated by `bun run check` and asserted for drift. Rules, skills, and seeds then cite `.claude/standards/X.md`, and that path resolves identically here and in every target.

Reading the authoring root directly was simpler and would have left every citation needing two spellings. This mirrors the `governance/rules/` to `.claude/rules/` split.

### Location enforces the plugin boundary

Toolkit-internal content lives under `internal/`, a tree nothing inside `claude/` reaches. The alternative was a filter at each CLI entry point, which is what the repository ran until it failed. `claude/standards` and `claude/snippets` are symlinks, and an installer dereferences them and copies whatever sits behind them with no code left in the path to filter.

Five internal files reached every plugin cache that way, and the count was growing on its own. `scripts/core/check-plugin-boundary.sh` now walks the shipped tree with symlinks followed and fails on any file resolving under `internal/`, so the boundary is measured against what an install actually copies.

### Three tiers of context rather than one file

Context splits three ways: `CLAUDE.md` and this file load eagerly, `.claude/rules/` load on glob match, and `.claude/context/<domain>.md` is read on demand. One large `CLAUDE.md` was the starting point and grows without bound. Nested `CLAUDE.md` files below the cwd were the other candidate, and they load cheaply but announce nothing, so a session never learns they exist. The `index.md` catalog is what the third tier buys, since it lists every entry up front and a session picks what it needs before touching the domain.

### A two-part test decides which tier a fact belongs in

A fact goes to `.claude/rules/` when it fires on a specific path being edited and violating it ships silently, and to a context entry or a skill body otherwise. Recording it in the entry's `## Gotchas` was the alternative, and that is exactly where the manifest-to-reference symmetry already sat unread while `#823` edited the manifest and shipped a stale reference.

Eager loading does not substitute either, since the fenced-diff protocol for this file lived in `CLAUDE.md` and was therefore in context for every session, and a worker on `#828` still edited without it, because a rule delivered at session start competes with the whole file while a glob-matched rule arrives attached to the action. The test rejects most of what it is run over, which is the point, because a rule per gotcha rebuilds the unbounded `CLAUDE.md` the tiers exist to prevent.

### Skills call the CLI and never reimplement it

A plugin skill reads a catalog through `aitk <domain> list --json`, matches it against project context, then executes the CLI under `AITK_NON_INTERACTIVE=1`. No skill hardcodes a rule, stack, or snippet name. Restating CLI logic in a skill body was the alternative, and it puts one behavior in two places that ship on different cadences. Every domain therefore owes a `list` verb with `--json`, which is a standing constraint on the CLI rather than on the skills.

### TypeScript with a bash exec boundary

`src/` parses arguments and owns every migrated domain, and `scripts/` holds what has not moved. Domains migrate one verb at a time rather than in a single rewrite, which is what let each dispatcher be deleted before all of its verbs had moved.

Bash keeps only what it is good at. `read_frontmatter_field` stayed because three scripts, two of them list scripts, call it once per field inside a loop, where routing through the CLI would cost a process per read. Coarse operations called once per invocation shell into `aitk` instead.

### Bun as the runtime with no build step

`bin` points at `src/cli.ts` and its `#!/usr/bin/env bun` shebang runs the source directly, so the package ships TypeScript with `tsconfig.json` beside it and nothing compiles. Node with a build step was the alternative, and it costs a publish pipeline plus a `dist/` that can drift from the source a contributor reads. The trade is that the CLI does not run under Node at all, since `Bun.Glob`, `Bun.TOML`, and `Bun.YAML` stand in for globbing and parser dependencies across `src/tooling/`, `src/indexes/`, and `src/snippets/`. A target project installing the CLI needs Bun on the machine rather than only a package manager.

### Hooks enforce what prose only states

A rule written in a standard fires only when a session reads it. The Claude Code hooks in `.claude/hooks/`, the husky hooks, and the drift stages in `bun run check` fire either way. The scratch-guard hook, the task-board index regen, and the consumed-copy drift assertion each replace an instruction that was already written down and already ignored. The cost is that an enforcement point is code with its own failure modes, so each one has to say what it does when its inputs are missing rather than reporting a pass.

### Content that leaves the repository gates harder than content that stays

The same finding fails a push against `tooling/*/seeds/` and only reports against `.claude/context/`. What moves it is the corpus rather than the measure: a seed is authored once and installed into every scaffolded project, so a defect there propagates, while a context entry is edited by the people who own it and a threshold failing their push teaches them to route around the stage.

Widening the `paths` globs on the claude rules was the alternative and it is a nudge, since a rule loads only when a session opens the file, and the failure being closed is a seed nobody has touched in months. Gating a measure that carries a known false-positive class is what forces the escape hatch, so `stub: true` exempts a seed from the section check and both install paths strip it before a target sees it.

### A diagram folder per kind rather than one file

`.claude/diagrams/` holds an entry per kind under a fixed filename, chosen over a single `DIAGRAMS.md`. The kinds drift at rates spanning roughly an order of magnitude, so a deploy change rewrites one entry and leaves the others untouched. Fixed filenames are what let a session refreshing a kind find the file it is meant to overwrite instead of writing a second entry beside it under a name of its own. A kind carrying a second question takes a suffixed name and repeats its category, which is how the folder reaches nine entries across five kinds.

### Review travels on the pull request

`claude-pr-review` posts findings as a comment on the pull request rather than returning them to the session that produced them. A finding posted there survives either session ending, which is what an orchestrator and worker pair need when neither outlives the review. `claude-review` still runs locally against the branch diff before a push, so the two compose rather than compete: the local pass catches what it can before the branch leaves the machine, and the pull request holds the durable record.

### Evals measure spec quality rather than efficacy

`scripts/eval/` asks whether a session that has never seen a standard can author a conforming artifact from that standard alone. It says nothing about whether the artifact is useful, which is a separate question with a separate design.

No baseline arm and a sample of one are correct for the question asked, because failure is self-evident: a session that reads the standard and still writes the wrong shape has proved the standard failed to communicate its own central rule. The fixture extracts to `mktemp -d` outside this repository, since a fixture under the root inherits this project's `CLAUDE.md` through the ancestor chain and the session under test would arrive already knowing what the test measures.

### A durable record is named for what it is, not for how long it lives

`groundwork/`, `plans-archive/`, and `task-archive/` sit directly under `.claude/`, leaving `.tmp/` holding only what can be deleted without loss. All three are cited by task files months after they are written, so a folder announcing itself as temporary was the wrong container for the one thing in it nobody may delete. Gitignored is what these share with scratch, and gitignored means per-machine rather than disposable. `memory-archive/` stayed behind on the same test: nothing cites a retired memory, so it is an undo buffer for a bulk pass rather than a record a later session opens.

Prefixing the other five surfaces with a dot to collapse the ignore file into one pattern was measured and declined: 486 occurrences across roughly 150 committed files, 43 of which ship to targets, against 80 across 26 for the move that shipped. It is a breaking rename for every installed target, and it hides the board a person opens daily. The ignore file therefore grows by three entries rather than shrinking, which is the accepted cost. `.tmp` is the only one of the six where hidden is the correct default.

### The durable records back up through a second git directory, not a branch here

Eight gitignored folders under `.claude/` carry the durable records the decision above puts beyond deletion, on one disk and nowhere else. Their size is a per-machine reading rather than a repository fact, since every one of them is gitignored and no commit carries a path under any of them: the authoring machine held roughly a thousand files and 6.9M on 2026-08-06, and a second machine running the same workflow would read its own figure.

`aitk records push` carries them to a private repository through a second git directory at `.claude/.records.git` with `.claude/` as its work tree, so every path stays where it is. A separate checkout was the alternative and it moves the 144 tracked files that spell one of these paths, which is the whole cost the second git directory exists to avoid.

An orphan branch on this repository was the cheaper alternative and it is the one this repository cannot take, since it is public and the payload is the memory pen, the review reports, and the groundwork trails. What the split costs is a one-time setup per machine, which both verbs refuse until it exists, and the remote gate that compares the records origin against every remote of this project. Measured at `1d0602f3` on 2026-08-06.

### A write to shared scratch routes on what it does to the file

Shared session scratch lives at the main worktree root, and a linked worktree is where every worker runs. `Edit` and `Write` refuse a main-root path there and offer the worktree copy instead, so a body naming only the destination reported success and lost the file, which is how two pull requests merged without recording their number on the task they closed.

Creating a whole file therefore goes out as a plain single `Bash` command carrying a heredoc, and changing a line inside a file that already exists goes through an `aitk` verb resolving the root in-process. Instructing the shell for both was the obvious single rule and it ships the stream editor this repository already bans, because an unescaped `&` rewrites the line it anchored to and a non-match exits zero.

What the split costs is that two structured edits became code with tests rather than a sentence in a skill body, which is `aitk tasks pull-request` and `aitk tasks outcome`. Relocating the four folders was the other candidate and it addresses nothing, since the refusal is tool-scoped rather than filesystem-scoped, and it is a breaking rename for every installed target. A structured edit no verb covers reads the file and writes it back whole, which holds until a second caller wants the same edit and the third verb pays for itself.

### A held skill body is checked against history rather than against itself

A session loads a skill body once and keeps it, and re-invoking the skill replays the held copy rather than re-reading the file, so a session outliving a merge that touched a body it loaded goes on applying what it loaded. A compaction carries the held copy forward with the summary, which makes the exposure the age of the oldest load rather than the age of the session. `aitk claude skills drift <ref>` answers it by naming which shipped bodies moved between a ref and `HEAD`, and the orchestrator handoff runbook runs it, that being the one moment a long session already stops and reads.

Comparing the bytes the session holds was the obvious design and cannot be built, since a session has no way to read its own loaded body back. What the substitute costs is exactness: the verb reports a file moving rather than a held copy differing, so a ref older than the oldest load over-reports. That direction is the safe one, because confirming a name costs a single read of the body while the failure being answered is silence. Instructing a session to re-invoke the skill was the cheap remedy and it fixes nothing, which is what rules out a one-line answer here.

### A standard governs an artifact's shape and the skill driving it governs the procedure

`standards/teach.md` fixes the layout, the ordinal naming, the frontmatter, and the mission, learning-record, and glossary formats of a learning workspace. The pedagogy that decides what to teach next sits in `claude/skills/claude-teach/references/`, and no standard carries it. The split is the one `standards/intake.md` already states about itself, applied to a surface built after the rule was written rather than before.

An attribute standard beside `prose.md` was the alternative, and it is declined on the second-reader test: one skill reads the pedagogy, and a standard nothing else cites has no owner to correct it. Folding the pedagogy into `standards/teach.md` was the other candidate, and `591-standard-authoring` rules it out directly, since a standard governs one document type or one attribute rather than both. What the split buys is a shape half a validator walks and a judgment half it does not, which is what makes the sixth record kind possible. What it costs is that a second surface wanting the pedagogy has to lift it with nothing reporting the lift is owed.

The workspace is also the first record folder named `<nn>-<topic>` rather than by a bare slug, so a listing sorts by when each opened. That is free here because the surface is greenfield, and it is not free over the 36 folders that already exist, being 27 groundwork tracks and 9 intake dumps, named in 66 citations across the records tree and 14 across the tracked corpus. Adopting it here settles nothing about those and gives the convention a shipped precedent. Measured at `d957d8a4` on 2026-08-19.

## Risks / open questions

- Skills and the CLI ship at two speeds. A skill merged to `main` reaches a `--plugin-dir` session immediately, while the CLI reaches a user only once a release cuts a tag and the publish job lands it on the registry. A skill calling a verb or flag that has not been published yet fails in a target, and nothing detects it.
- `migration-standards` and `toolkit-operator` each test for a field they read and answer an absent key as unread rather than as empty, a pattern the remaining skills could take rather than a check the repository runs
  - The second was written after a sandbox run against a stale binary reported a clean target, then answered from a filesystem walk of its own, so the skew reaches a reader as a confident wrong answer rather than a failure
- A marketplace install is a cached copy, which is the same skew in the other direction. Someone who added the marketplace and never updated runs old skills against a current CLI. Neither direction is detected.
- The skill-body drift verb answers only when a session runs it, and the single instruction to run it sits in the orchestrator handoff runbook. That is the shape the review poll and the queue refill sweep already have, each holding only while whoever holds it applies it, and the verb reaches less far than either, since a project consuming the plugin from a cache has no history behind the skills tree and gets a refusal rather than an answer.
- Every session pays for this file from the merge onward. No standard sets a length rule for it, so the working limit is a self-imposed 150 lines borrowed from the context-entry checkpoint, and nothing enforces it.
- Verification anchors on this file now have a writer and a sweeper, and the sweeper reaches only what a diff can point at. `claude-docs` anchors a decision it amends and reports an anchored decision whose cited path the branch touched. Nothing exercises either half yet, because every decision here predates the forward-scoped rule and the first anchor lands whenever the next session amends one.
- Two classes stay unflagged: a claim counting over a tree the branch never opened, and one citing nothing narrower than a single path segment, which is 13 of the 26 folder citations this file carries. The second is deliberate, since a prefix match on `src/` or `.claude/` fires on nearly every branch.
- Rationale for six of these decisions also sits in `.claude/context/` entries. The duplication is deliberate while four of those entries are claimed by live tasks. The split to converge on is the decision and its rejected alternative here, with the mechanism detail staying in the entry.
- A `scripts/eval/` run costs roughly a dollar per arm and is started by a person rather than by a command surface. The harness has confirmed twice and discriminated zero times, so treat a pass as weak evidence until one arm fails.
- Context entries are never created automatically. `claude-docs` refreshes an entry that already exists and adds none, so a new domain stays uncatalogued until someone writes the first entry by hand.
- A native Windows checkout without symlink support materializes `claude/standards` and `claude/snippets` as plain files holding a path. The plugin then ships no standards and no stage notices, since every catalog command reads the real directories at the repository root.
