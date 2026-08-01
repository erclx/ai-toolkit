---
title: Claude plugin
description: Plugin skills shipped to target projects, the aitk claude CLI, and overlap with built-in Claude Code features
---

# Claude plugin

## Overview

Owns everything the toolkit ships outward under the Claude domain: the plugin skills in `claude/skills/`, the plugin manifest, and the `aitk claude` CLI that seeds `.claude/` and `CLAUDE.md` into a target project. Internal skills that never leave this repo live in `.claude/context/claude-internal.md`.

## Layout

- `claude/` is the plugin root, the directory a marketplace entry sources
- `claude/skills/` owns the plugin skills, auto-discovered from the plugin root
- `claude/skills/<skill>/REQUIREMENT.md`: optional sibling of `SKILL.md` holding the skill's gap statement, inert at load time
- `claude/.claude-plugin/` owns `plugin.json`, the plugin manifest. Its `name` field is `aitk`, which is what namespaces every invocation as `/aitk:<skill>`, and its `version` is written by the release automation rather than by hand
- `.claude-plugin/` at the repository root owns `marketplace.json`, the catalog an installer adds
- `claude/standards` and `claude/snippets` are symlinks to the root authoring sources, present so the files ship with an install

## Plugin skills

Plugin skills live in `claude/skills/` and are auto-discovered from the plugin root, whether that root is a marketplace install or a `--plugin-dir` pointed at a checkout. No registration needed, folder presence is enough. Each skill is a kebab-case folder containing `SKILL.md`.

A skill folder may also carry `REQUIREMENT.md` beside `SKILL.md`, stating the gaps that skill exists to close so a proposed change has something to be argued against. It is authoring context for whoever maintains the skill. Claude Code loads `SKILL.md` as the entry and never reads the sibling, and `src/sync/check.ts` leaves `claude/skills/` out of the synced sources because skills load live from the plugin directory rather than being copied, so the file reaches no target session and costs no tokens there. `governance/rules/claude/570-skill.md` fires on both filenames and carries the consult-first bullet. Thirteen skills have one as of the second `v16.0` sitting, which covered the whole `git-*` family and confirmed the unit is the skill rather than the family.

Skills that perform a one-time structural move of an existing project into a newer toolkit layout use the `migration-*` prefix (`migration-claude-md`, `migration-context`, `migration-standards`). Add new one-shot relocations to this family. Recurring reconciliation tools like `claude-seed-sync` are not migrations and stay outside it.

| Skill                    | Description                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `bash-script`            | Generate interactive bash scripts with a visual timeline UI and error handling                   |
| `ci-workflow`            | Generate GitHub Actions CI workflow files with parallel, gated jobs                              |
| `cli-script`             | Generate non-interactive automation and CI bash scripts in a lean functional style               |
| `claude-design-extract`  | Draft `.claude/DESIGN.md` from existing prose and shell UI surfaces                              |
| `claude-design-propose`  | Draft `.claude/DESIGN.md` on day one from REQUIREMENTS.md and a personality paragraph            |
| `claude-diagram`         | Draft `.claude/DIAGRAMS.md` with mermaid from architecture and code, then verify the render      |
| `claude-docs`            | Update .claude/ planning docs and mark outcomes the diff shipped                                 |
| `claude-feature`         | Plan a feature by reading Claude setup and scanning source files                                 |
| `claude-groundwork`      | Open, resume, and close a numbered groundwork folder under `.claude/.tmp/groundwork/<slug>/`     |
| `claude-memory-capture`  | Extract durable patterns from the session into `.claude/memory/`                                 |
| `claude-memory-review`   | Review `.claude/memory/` and propose per-entry promote, consolidate, handoff, or delete          |
| `claude-orchestrate`     | Assert the orchestrator role, refill the ready queue, and dispatch the build loop                |
| `claude-pr-review`       | Review an open PR from an independent session and post findings as a PR comment                  |
| `claude-address-review`  | Pull PR findings and CI status, fix each, refresh stale docs, push a follow-up, and reply        |
| `claude-review`          | Review all changes since main for bugs, edge cases, and logic flaws                              |
| `claude-roadmap`         | Draft or update `.claude/ROADMAP.md` by sequencing MVP scope into ordered versions               |
| `claude-screencast`      | Draft a stack-agnostic screencast script with pre-seeded beats and defaults                      |
| `claude-seed-sync`       | Audit installed seed docs and standards against toolkit sources, write per-part proposals        |
| `claude-slides-draft`    | Draft a `.claude/SLIDES.md` source and render it to PowerPoint via `aitk slides render`          |
| `claude-standards-audit` | Audit changed markdown files against applicable authoring standards, reporting only              |
| `claude-tasks`           | Create a task file on the board and archive a shipped one out of the folder                      |
| `migration-standards`    | Propose `git mv` of root standards/ and snippets/ into .claude/                                  |
| `claude-ui-test`         | Generate and run Playwright e2e tests, with manual checklist for visual-only items               |
| `claude-ux-audit`        | Audit existing UI surfaces for missing states, edge cases, and inconsistencies                   |
| `claude-worktree`        | Enter a worktree at `.claude/worktrees/<name>/` with name derived from plan or branch            |
| `claude-autoship`        | Chain implement → verify → review → ship after a plan is approved                                |
| `migration-claude-md`    | Classify `CLAUDE.md` sections and propose moves to path-scoped rules or context entries          |
| `migration-context`      | Classify `docs/` content and propose `git mv` to `.claude/context/`                              |
| `create-rule`            | Scaffold a project-local governance rule into .claude/rules/                                     |
| `create-skill`           | Create a new skill file in .claude/skills/                                                       |
| `create-snippet`         | Create a new snippet file in snippets/                                                           |
| `create-standard`        | Create a new standard file in standards/ following the meta-standard                             |
| `docs-sync`              | Rewrite stale README.md and docs/\*.md sections since main                                       |
| `git-branch`             | Rename current branch to match conventional format                                               |
| `git-commit`             | Generate a conventional commit message from staged changes                                       |
| `git-followup`           | Stage, commit, push, and sync the open PR, replying when it carries review comments              |
| `git-pr`                 | Generate a PR description and open or update a pull request                                      |
| `git-issue`              | Format a session bug or task and file it on the current repo via `gh issue create`               |
| `git-split`              | Split a mixed-commit branch into focused branches and open PRs                                   |
| `git-stage`              | Batch-commit staged files grouped by concern                                                     |
| `git-worktree`           | List and clean up linked worktrees after shipping                                                |
| `toolkit-cli`            | Reference for what aitk sync and install commands overwrite, merge, or leave untouched           |
| `toolkit-operator`       | Front door that orients on toolkit docs and live catalogs, then runs or routes any operation     |
| `setup-gov`              | Detect project stack from files and install matching governance rules                            |
| `setup-indexes`          | Bootstrap the index.md system in a target project, drafting frontmatter per folder               |
| `setup-init`             | Detect project type and run one-shot `aitk init` with resolved flags                             |
| `setup-plugins`          | Install curated community and official plugins user-scoped via the `claude plugin` CLI           |
| `git-ship`               | Run the full post-feature workflow in one sequence                                               |
| `session-resume`         | Resume from tracked work and relevant context at session start                                   |
| `systematic-debugging`   | Enforce root-cause investigation before fixes when a test fails or a bug surfaces                |
| `toolkit-feedback`       | Format a session-context feedback block and write it to the toolkit repo via `aitk feedback`     |
| `toolkit-triage`         | Triage open GitHub feedback issues, classify each, and route to a direct fix or `claude-feature` |
| `setup-verify`           | Run `package.json` scripts after scaffold to catch config and wiring mistakes                    |
| `project-commands`       | Run a command documented in `.claude/context/development.md` and stop at the launch              |
| `youtube-transcripts`    | Fetch a YouTube transcript with metadata frontmatter via `aitk transcripts`                      |

Invoke with `/skill-name` or let Claude auto-trigger by matching against the skill description. Skills marked with `disable-model-invocation: true` (`claude-autoship`, `claude-orchestrate`, `create-skill`, `git-ship`, `toolkit-operator`) require explicit invocation and will not auto-trigger. Git skills (`git-commit`, `git-pr`, `git-branch`, `git-stage`) override built-in commit and PR behavior. See `.claude/standards/skill.md` for authoring conventions.

Two skills write to the task board and the split is by operation rather than by file. `claude-tasks` brings a task file into existence and moves a shipped one to `.claude/.tmp/task-archive/`. `claude-docs` edits the contents of a file that already exists, marking outcomes `[x]` from the diff and sweeping the plans those tasks cite. Neither crosses into the other, because two skills relocating the same file drift into relocating it differently.

Creation is the only moment the task-origin invariant is enforceable, so that is where `claude-tasks` enforces it. A task names a plan, a groundwork folder, or an issue, and the skill refuses to write one that names none. The reverse direction is a report rather than a prompt, since a groundwork track can be opened long after its task would have been written, and an offer to create a task for each open track would be noise on most runs.

Archiving a task deliberately does not archive its plan. `claude-docs` owns the plans sweep and already holds the last-live-citation rule, so `claude-tasks` moves nothing.

That split forces an ordering, and `claude-tasks` guards it rather than documenting it. The plans sweep finds its work by scanning `.claude/tasks/*.md`, so it can only reach a task still in the folder. Archiving the task first puts it beyond that scan for good, stranding the plan in `.claude/plans/` with no live task citing it and an archived task pointing at a path nothing will retarget. So the archive verb stops when the `Plan:` line still points inside `.claude/plans/` and sends the caller to `claude-docs` first.

Every stop the verb emits has to name a next step that actually moves. The sweep is gated twice, on the citing task's outcomes being all `[x]` and on no other task sharing the plan, and a stop that routes past either gate returns the caller to the same guard unchanged. So the outcome check runs first and refuses to admit an open outcome, and the plan check counts citations only to decide which of two messages to print. A shared plan is the misfile the tasks standard names, resolved by hand rather than by a sweep.

A plan that ships is archived rather than removed. `claude-docs` moves it from `.claude/plans/` to `.claude/.tmp/plans-archive/` in its scratch sweep, overwriting on a repeated slug, then retargets the task file's `Plan:` line at the new location. Retargeting is what makes the archive worth having, since an archive nothing points at is barely better than a deletion. A task already pointing into the archive is skipped silently, which keeps a second pass idempotent instead of warning on work it did itself.

The `Plan:` line carries a markdown link relative to `.claude/tasks/`, so both parsers read the target out of the parentheses and both resolve it against that folder before routing on it. Resolving is what lets `../plans/x.md` and the older bare `.claude/plans/x.md` land on the same file, and skipping it would drop every link-form task through to the sweep's final warn-and-skip branch, archiving nothing. The retarget writes a link back for the same reason it reads one: that branch is the only writer producing a `Plan:` line nobody authored, so emitting a bare path would convert the board to the old form one closing task at a time.

The sweep archives only when the closing task is the last live citation of that plan. One plan can serve several tasks, and moving it on the first to close strands every other pointer at a path that no longer resolves. `.claude/plans/` is gitignored, so no history recovers the retarget and the shared plan stays put until the last citation closes. The count compares the resolved target rather than the raw string, because a board holding one task written `../plans/x.md` and another written `.claude/plans/x.md` cites one plan and a raw comparison reads two, counts zero, and archives the file out from under a live task. Comparing basenames instead trades that for the mirror error, since a live plan and an archived one share a filename whenever a closed task still points into `.claude/.tmp/plans-archive/`, so the count invents a citation and the plan is never archived.

That sweep scans the whole board rather than the task files the session touched, and Step 8 now states the scope in the sentence carrying the instruction. It read the other way for three releases: the step opened with "sweep only scratch that was actually consumed this session" and asserted the opposite for plans four lines later. Runs on `#632`, `#633`, and `#634` each took the opening sentence as operative, swept their own plan, and passed over two tasks that had closed earlier with plans nothing would move. A scope stated as a correction to the instruction above it loses to the instruction, which is the general lesson and the reason the fix moved words rather than adding a rule.

The sandbox arm for this is `board-sweep`, kept separate from `drift`. `drift` asserts a plan archived for the task the prompt names, and `board-sweep` asserts one archived for a task the prompt never mentions. Folding them would leave a single failure ambiguous between the sweep not running and the sweep not reaching past the session.

The arm carries a third task whose outcomes stay open and whose plan must survive the run. Widening a scan and dropping the gate that bounds it fail in opposite directions but look identical in a fixture where every task closes, so the arm needs a case the sweep is required to pass over. Its assertions cover the plan's location and the task's untouched `Plan:` line, since a run that retargeted the pointer anyway would leave the task aimed at an archive path holding no file.

Which task closes is decided from the diff, not the session. `claude-docs` resolves a merge base against `origin/main`, unions the committed diff with the working tree and untracked files, then matches unchecked outcomes on the board against what shipped. Completion is a fact about the repository, so a session that shipped a queued task without ever discussing it still leaves the board correct. Requirements, architecture, and design stay session-sourced, because those are judgments a diff cannot carry. The same baseline feeds the wireframe sweep and the context refresh, which previously read `git diff main` and saw nothing at all when run on `main` itself.

Nothing chained the archive until the `post-merge` git hook landed. Every earlier step fires from `claude-autoship` or `git-ship`, both of which finish while the pull request is still open, and a task archived there closes for work that may be abandoned. So the hook is the only event that lands late enough, and the board being gitignored rules out reading it from anywhere but the operator's own machine.

That hook now archives rather than announcing, and the escalation turned on closing one gap rather than on the detection proving itself. Both reasons the announce-only version gave for declining to act were re-measured. The first, that `index.md` regenerates from a `PostToolUse` hook a shell-side `mv` never fires, was void: `aitk indexes regen` is a CLI verb, so the command regenerates the index as part of the move. The second, that a gitignored board leaves no diff to review with nobody watching, holds only for a blind sweep of every all-`[x]` task and stops holding once the hook can name which task a merge closed.

Naming it is what nothing recorded. A branch name cannot carry the link, because every merge on `main` is a squash with a single parent and the branch commits never land, so an ancestry test fails on every shipped task. The number in the subject is the only offline signal. `git-pr` writes `Pull request: #NNN` onto the task at the moment it resolves the number, which is the one step that always runs when a pull request opens, and the hook reads it back out of `ORIG_HEAD..HEAD`. Reading the tip alone would strand every task but the last on a pull that fast-forwards over several merges.

The gates all live in `aitk tasks archive` rather than in the shell. A hook that pre-filtered would duplicate them in a language where the outcome test already needed an errexit comment, and the skill calling the same command is what stops the attended and unattended paths archiving differently. Each gate refuses with a non-zero exit rather than reporting, since a caller with nobody watching cannot act on a warning. A task whose outcomes are not all closed, whose plan is still live, or which shares its pull request number with another task all refuse and print why. `claude-tasks` keeps the one check the command cannot make, which is confirming the work reached `main` when a person archives by name rather than by merge.

`post-rewrite` carries the same check for anyone pulling with rebase. `git pull` under `pull.rebase=true` runs `git rebase`, which fires that event and never `post-merge`, so without it the trigger is a silent no-op on that machine. It delegates to `post-merge` on the `rebase` argument alone, since the same event fires on `commit --amend` and an amend changes nothing on the board. Silence is the wrong failure mode for a hook that exists to stop a shipped task being forgotten, and the base stack ships to targets whose pull style this repository does not control.

A `git init` project on `main` with no remote resolves no usable baseline, which is the ordinary shape of a scaffolded target project rather than an edge case. That costs only the committed half of the diff, since the working tree and untracked files still scope correctly. The marking step recovers the committed half by reading `git log -p -1`, which supplies content where a bare file list would not. The wireframe sweep and the context refresh run on the working tree and untracked files, and skip only when that set is empty. Neither ever substitutes the whole tree for a missing baseline, because both write, and a set that wide would stub a wireframe per uncovered surface and rewrite every context entry. The asymmetry with the marking step is deliberate and worth keeping: on a scaffolded project the last commit is the scaffold commit, so the `git log -p -1` recovery is the whole tree by another route, which a step that only reads can tolerate and a step that writes cannot. Widening what a step reads is safe. Widening what a step writes is not.

That baseline, shipped in #626, is the worked case behind a rule now split across two skills. One step in `claude-docs` resolved the diff baseline and three consumed it, and the fallback for an unresolvable baseline was written against the marking step, which only reads. Under that same fallback the two sweeps that write would have stubbed a wireframe for every uncovered surface and rewritten every context entry.

So `claude-feature` obliges a plan that establishes a resource with more than one consumer to list them and mark each read or write, and `claude-pr-review` carries the matching lens beside Integration and Contract. Both skills ship to target projects, where a consumer is a call site, a module, or a component rather than a skill step, so the clause names the unit generically. The review half is what catches the miss, since an author who never noticed the resource was shared will not notice the authoring clause either. `claude-review` stays out of it, because an author reviewing their own change cannot catch a consumer they never enumerated.

Root `CLAUDE.md` and the `CLAUDE.md` seed each own the policy statement, and the skill owns only the mechanism, so the skill states what it does without re-deriving why. The seed keeps its own copy because a scaffolded project cannot point at the toolkit's file.

That baseline then reached four more skills, which had never had it. `claude-review`, `docs-sync`, `claude-standards-audit`, and `git-pr` each resolved a base against bare local `main`, so on `main` every committed change dropped out and the skill reported a clean result rather than admitting it could not see the work. `git-pr` spelled it `git diff main..HEAD`, a two-dot range that compares tips and resolves no merge base, so a grep for the bare form never matched it and an advanced local `main` showed up as reversed changes in the description. Its `git log main..HEAD` carried the matching defect on the commit side, where a local `main` trailing `origin/main` leaves commits in the range that the diff already excludes, so the description lists work whose changes appear nowhere in it. Both halves read `<base>` now, which is what keeps the commits and the changes describing one branch. Four of the eleven corrected sites were guards, which is the half that decides whether a fix lands at all: correcting the working read and leaving the guard ships a skill that still stops before it reaches the corrected code.

Porting the block also corrected the test for an unusable baseline. `claude-docs` calls the base unusable when it came from local `main` and equals HEAD, which keys on where the ref came from and misses the case where `origin/main` resolves a merge base that also equals HEAD. That is the ordinary shape of a feature branch before its first commit, so the narrow test would have gone blind on the sessions these skills run in. `claude-docs` never pays for it, because it unions the committed, working, and untracked sets and the committed half going empty costs it nothing. Any skill reading the committed half alone needs the wider test, which is that the base equals HEAD whichever ref resolved it. Correcting the wording in `claude-docs` itself is a follow-up rather than part of the port, since nothing there reads it wrongly today.

`claude-autoship` was held back from that port on purpose and became the fifth skill to take the baseline. Its classifier decides whether a review runs at all, so widening what it sees turns a branch that looked prose-only into a mixed one and changes behavior rather than only correctness. It shipped with the bug filed against that classifier instead of inside a five-file diff, since a stale baseline is one of the ways the file list comes back empty and the vacuous test is what then waves it through.

Its unusable test is narrower than the four siblings', which is the wider rule applied rather than an exception to it. A skill reading the committed half alone needs the base-equals-HEAD arm, and the classifier diffs the base against the working tree, so the uncommitted work stays in the set when that arm would fire. Autoship reaches Step 5 before `git-stage` has committed anything, so the base equals HEAD on every ordinary run and porting the arm verbatim would stop the chain every time. The skill body says so at the point of the omission, because the next reader porting the block will otherwise correct it back.

The empty list is what stops the chain instead. Routing it into review rather than stopping would re-create the silent skip by a longer path, since a review of no files produces no findings and Step 6 reads that as a clean pass. The prose-only skip survives untouched, because the defect was a broken read making every branch look prose-only rather than the skip itself.

A plan whose output is entirely gitignored still reaches the stop rather than a fix, which is a separate defect that surfaces six steps later at `git-stage`. The stop names that case apart from a plan yet to produce output, since the two want opposite responses and a single message covering both sends the operator to the wrong check. Advising a re-run once the output is tracked is the wrong fix for scratch that is gitignored by design, and followed literally it commits scratch to close a stopped run.

`claude-orchestrate` asserted an active version from a roadmap this repository never had. `.claude/ROADMAP.md` is specified by `standards/bundled/roadmap.md`, written by `claude-roadmap`, and read by `claude-orchestrate` and `claude-pr-review`, and the file has never existed here. Every read path skips a missing file by instruction, so nothing failed loudly and the `Active: vX.Y` output line was unsourced on every run since the skill shipped.

Drafting the roadmap was the obvious fix and the standard forbids it. All eight MVP features in `.claude/REQUIREMENTS.md` have shipped and `v0.3.1` is tagged, and the Lifecycle section of `standards/bundled/roadmap.md` says the scope is exhausted once the last version ships, with later work arriving as discrete items rather than extending the roadmap. A table of the current maintenance labels would satisfy the format and break the lifecycle rule in the same file.

So the claim was stripped rather than sourced. The skill reads `priority.md` for order, keeps `index.md` for what is queued, and treats the roadmap as optional, reporting what it says with a date from `git log` instead of naming a version as fact. The date is what keeps the report honest when the file is old, since trading an unsourced claim for a confidently stale one repeats the defect by another route. Sequencing read from a committed roadmap returns when a requirements pass defines a next scope, which the distribution work shipped without.

`claude-pr-review` reads the same path and was left untouched. Its read informs a review comment and asserts nothing, so it carries no defect to fix, and the body sits inside a queued rewrite's file set where an edit here would buy a rebase for no behavior change.

Plugin skills that shell out to the CLI follow a consistent pattern: read the toolkit catalog via `aitk <domain> list --json`, match against project context, then execute the CLI with `AITK_NON_INTERACTIVE=1` so it skips prompts. Claude Code's tool permission dialog is the single confirmation gate. Skills never reimplement CLI logic or hardcode rule, stack, or snippet names. `setup-gov` is the reference.

`claude-worktree` repairs `core.bare` at two points rather than one. Claude Code's entry tool writes the flag into the parent repository's shared config and its exit tool never restores it, which leaves every later command in the main worktree failing for want of a work tree while the files sit untouched on disk. The linked worktree keeps working, so the session that caused the damage is the one least likely to see it. Repairing only after entry would still admit a repository broken by an earlier session, so the skill reads the flag in Step 1 beside the main-root resolution and repairs before entering, then repeats the repair in Step 5. Both writes are guarded on the flag actually being set, since the entry tool does not set it every time and an unconditional repair would rewrite the config on runs where nothing broke.

`scripts/core/verify.sh` carries the same repair as a second line of defense, sourced from `scripts/lib/worktree.sh` and run ahead of every stage because the flag breaks the git reads that scope the run. Nothing forces worktree entry through the skill, and one occurrence hit an operator whose session never entered a worktree at all. A git hook cannot serve here, because the corrupted command aborts before any hook runs. Both call sites confirm the repository's common dir is named `.git` before writing, which separates the defect from a genuinely bare repository that keeps its objects at the root and would be broken by the repair. The skill states the upstream issue inline rather than pointing at `wiki/claude-worktrees.md`, since a shipped skill runs where no `wiki/` path resolves and `check-skill-paths.sh` fails the build on one.

`setup-plugins` bundles `references/plugin-catalog.md`, which holds install data alone. `wiki/community-skills.md` is its narrative companion and Skill strategy below argues the install-versus-author decision, and neither is reachable from the shipped file by design. A `references/` file is read by a session running in a target project, where no `wiki/` path resolves, so the two pointers the catalog used to carry were already dead for the only consumer that reads it. They are recorded here instead, on a surface that never ships, for the maintainer editing the catalog. `community-skills.md` stays in `wiki/` rather than moving to `docs/` because its subject is the community plugin authors, which is the test that decides what `wiki/` holds.

## Skill strategy

Skills split into two categories by function. The toolkit owns the first and installs the second, and mixing them is the most common source of skill bloat and maintenance drag.

Workflow skills wrap how this toolkit operates: groundwork, planning, review, shipping, debugging, git, and governance install. They are thin, opinionated, and specific to the author's process. Domain-knowledge skills encode expertise curated over many hours, such as frontend design anti-patterns, security audit patterns, and industry-specific UI rules. The wider ecosystem supplies those as `frontend-design`, `impeccable`, `ui-ux-pro-max`, `taste-skill`, and `trailofbits/skills`. Curation is the whole value of the second kind, so forking one means inheriting the cost of maintaining that curation against an upstream that keeps moving.

| Location                         | Purpose                                                | Scope  |
| -------------------------------- | ------------------------------------------------------ | ------ |
| `claude/skills/`                 | Workflow skills, installable into target projects      | Shared |
| `.claude/skills/`                | Toolkit-internal authoring skills, the `aitk-*` family | Local  |
| Target project `.claude/skills/` | Per-project customization not worth upstreaming        | Local  |
| `~/.claude/skills/`              | Global user skills active across every session         | User   |
| Plugin marketplace               | Community and official plugins installed via `/plugin` | User   |

Which location is right follows from who benefits. A commit style specific to one project stays in that project's `.claude/skills/`. A commit skill the author uses everywhere goes in `claude/skills/`. A frontend design anti-pattern skill maintained by a third party stays a plugin install. Forking has not been necessary in practice, and when one looks tempting a thin toolkit wrapper composing the upstream skill has met the need instead.

The rules this argument produces fire when a skill is being written, so they live in `.claude/skills/aitk-claude/SKILL.md` rather than here.

### Redundancy audit

Five toolkit skills were compared against community counterparts. All five are kept and one took a borrowed section.

- `aitk:systematic-debugging` vs `obra/superpowers/systematic-debugging`. Same methodology. Ours is 71 lines to their 296, capturing the four phases, circuit breaker, and red flags in a prose-tight form that matches toolkit conventions. No borrow.
- `aitk:claude-review` vs Anthropic's `code-review` plugin. Different scopes. Ours runs on a local branch diff and reads four project docs. Theirs runs on a PR URL with multi-agent fan-out and posts inline comments via GitHub MCP. Added a high-signal filter section borrowed from Anthropic's framing to sharpen severity judgment.
- `aitk:claude-ux-audit` vs `impeccable`'s `/audit` and `/critique`. Different lenses. Ours enumerates UI surfaces to find missing states, edge cases, and inconsistencies. `/audit` scores technical quality across five dimensions and `/critique` scores design with Nielsen heuristics. They compose, so run `claude-ux-audit` first to find gaps, then the `impeccable` commands to polish what exists. No skill body change, because third-party skill references belong in this catalog rather than in a `SKILL.md` body.
- `aitk:claude-feature` vs the `obra/superpowers` planning skills `brainstorming`, `writing-plans`, and `executing-plans`. Different slots. Ours reads the full `.claude/` doc set and produces a structured plan at a coarser grain than the task-atomized `writing-plans`. Plan mode and Ultraplan are positioned separately in Built-in vs toolkit features below. No borrow, since the approval gate between plan and implement already covers the clarification case `brainstorming` handles upfront.
- `aitk:claude-groundwork` vs `obra/superpowers/brainstorming`. Closest external analogue, different output. `brainstorming` is an upfront clarification conversation feeding straight into a plan, so its product is a better-specified plan. Groundwork produces a durable numbered folder of measurements and rejected options that can legitimately conclude in doing nothing, and it runs before a plan is warranted rather than while one is being written. No borrow.

`wiki/claude-skills.md` covers the Claude Code skill feature itself, and `docs/visual-design-workflow.md` is the worked example of per-workflow skill recommendations.

## Distribution

`.claude-plugin/marketplace.json` at the repository root holds one entry whose `source` is `./claude`. The marketplace root is the directory holding `.claude-plugin/`, and an entry's source resolves against that root rather than against the manifest file. Adding the marketplace and installing the one plugin is the whole install path. The `--plugin-dir` alias survives as the development path, where a local edit overrides the installed copy for that session.

Sourcing the repository root instead is the trap this shape exists to avoid, and it was measured rather than reasoned about. Skills are discovered only at `<plugin-root>/skills/` and this repository keeps them a level down, so a root-sourced entry exposes zero skills. It also costs 312M, because Claude Code runs a dependency install on any plugin carrying a package manifest and copies `.claude/` and the internal skills into the cache. The closest comparable project sources its root, which works only because its skills sit there.

`claude/standards` and `claude/snippets` are symlinks to the root authoring sources. A symlink inside a plugin that resolves elsewhere within the marketplace is dereferenced at install and its content copied, so the files arrive as real directories in the cache. The measured install is 964K with 55 skills, against 760K for the same shape without the symlinks.

The entry carries no version on purpose. `plugin.json` overrides the enclosing entry for both name and version, so a version on the entry would drift on every release with nothing reporting it, and the release config writes only the plugin manifest.

The check pipeline does not follow the two symlinks. The index walker's glob, the spell checker, and the formatter were each tested against a symlinked directory in isolation, so `standards/` is not double-walked and the links produce no drift failures.

## Distribution gotchas

Validation proves the manifest parses and nothing about whether it works. `claude plugin validate --strict` passes a manifest whose `source` points at a directory that does not exist, so it would have accepted the zero-skill root-sourced shape. An install is the only check that proves a shape, which is why `bun run check` covering this file does not retire the manual install.

Delivering a standard and reaching it are separate problems. The shipped skills cite `.claude/standards/X.md`, which resolves against the target project, so in a project with no standards installed a skill once resolved the citation to the project root, found nothing, and never looked in its own plugin root. The cache copies were inert until a skill was told to fall back to them. Each citing body now names `${CLAUDE_SKILL_DIR}/../../standards/X.md` as the fallback, which lands on the dereferenced symlink beside `skills/`. The project copy is still tried first, so a target that installed standards and edited them keeps its override.

The fallback conditions on the file, never on the `.claude/standards/` directory. `aitk standards sync` updates only filenames it already finds and never adds one, so a project that installed before a standard existed keeps the directory and never receives that file. A directory test passes there while the file is missing, which is the partial install the fallback exists to cover rather than an edge case. `git-commit` citing `versioning.md` is the concrete shape.

Only `${CLAUDE_SKILL_DIR}` survives to the model. Measured across three probe skills in a project with no `.claude/`, the body arrived with that variable already expanded to an absolute path, while `${CLAUDE_PLUGIN_ROOT}` reached the model as a literal string and a bare `../../` arrived unresolved. The latter two happened to work because the model inferred a base, which is the inference `standards/skill.md` bans a bare relative path to avoid. A guard on a standard's presence has to test both paths, since one testing only `.claude/standards/` refuses to run in a plugin-only project that has the file. `create-skill` and `claude-standards-audit` each carried such a guard.

A symlink is an entry point that cannot filter. `standards/aitk/` and `snippets/aitk/` were excluded at every CLI verb and still reached every plugin cache, because an installer dereferences the two symlinks and copies whatever is behind them with no code in the path. The count reached five before the fix and grew on its own, since `snippets/aitk/` was where internal snippets were authored. Internal content now lives at `internal/`, which nothing under `claude/` reaches, and the filters that guarded the old category are deleted. `scripts/core/check-plugin-boundary.sh` walks the plugin tree with symlinks followed and fails on any file resolving under `internal/`, so what the filters asserted is now measured against what an install actually copies.

A native Windows checkout without symlink support materializes both links as plain text files holding the paths `../standards` and `../snippets`. The plugin then ships two junk files and no standards, and no stage notices, because every catalog command reads the real directories at the repository root. `.claude/context/sandbox.md` treats Windows as a supported development environment, so this is a limitation to state rather than a case the pipeline can catch.

A marketplace name is one global slot per user. Adding a second marketplace under the same name replaces the first, and a local-path marketplace pointing at a worktree breaks when that worktree is removed.

## Release

`plugin.json` carries `author`, `homepage`, `repository`, `license`, and `keywords` alongside the three fields it started with. None of them change how the plugin loads. They exist because `claude plugin validate --strict` treats missing attribution as a failure, and because a manifest reaching an installer is the first thing a stranger reads about the project.

Its `version` is written by `release-please` through the `extra-files` wiring in `release-please-config.json`, never by hand. The manifest overrides the enclosing marketplace entry for both name and version, so a shape declared at one version installs at another when the two disagree, and `claude plugin tag` refuses to tag in that state. Parity that depends on someone remembering breaks on the first release nobody is watching, which is why the tool owns the field rather than a convention. The mechanics of the release itself live in `ci.md`.

Owning the field means owning the file's serialization. `release-please` rewrites the whole manifest on each bump and expands `keywords` to one string per line, while prettier collapses any array that fits the print width, so the two disagree at every release rather than once. `.prettierignore` excludes `**/.claude-plugin/*.json` to settle it, which leaves the release tool as the only formatter of the manifests it writes. The `**/` prefix is load-bearing, since a pattern carrying an interior slash anchors to the ignore file's directory and `.claude-plugin/*.json` would match nothing under `claude/`. `claude plugin validate --strict` still gates the schema, though that stage is author-side only, so CI checks neither the format nor the schema of these files.

The class pattern overreaches by one file, so a `!.claude-plugin/marketplace.json` negation follows it. The exclusion earns its place for a file a release tool rewrites, and the marketplace entry is hand-authored, carries no version, and is written by nothing. Without the negation it would sit outside the formatter and outside CI at once, since the validation stage runs author-side only. The negation has to come after the pattern it undoes, because the last matching line wins.

Version parity stays a two-file problem now that the marketplace entry exists. `package.json` and `plugin.json` are wired through `release-please`, and the entry carries no version to disagree with them. The validation stage in `bun run check` discovers manifests rather than naming them, so it picked up `marketplace.json` the day it landed.

## CLI

| Command                  | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `aitk claude init`       | Seed `.claude/` workflow docs and `CLAUDE.md` into a project |
| `aitk claude seeds list` | List seed doc sources, plain text or `--json` for skills     |
| `aitk claude sync`       | Reconcile `.gitignore` against the claude manifest           |
| `aitk claude setup`      | Install user-level Claude config, `~/.claude/` by default    |

### init

Seeds `.claude/` with project docs (`REQUIREMENTS.md`, `ARCHITECTURE.md`, `DESIGN.md`, `context/`, `tasks/`, `wireframes/`, `settings.json`) and hook scripts under `.claude/hooks/`. Also seeds `CLAUDE.md` at the project root and merges `.gitignore` entries. Skips files already present. Run once per project. Coding and doc-authoring standards arrive separately via `aitk gov install`, which writes path-scoped rules to `.claude/rules/`. The seed `CLAUDE.md` duplicates part of that routing on purpose. Its `## Markdown` section points at `prose.md`, `context.md`, and `wireframes.md`, which `500-prose.md`, `510-context.md`, and `520-wireframes.md` also cover once a stack is installed. A seed audit proposed cutting the inline copies as redundant and the cut was reverted on review: `init.ts:151` skips governance entirely without `--stack` while `init.ts:166` installs standards regardless, so a bare `aitk init` would have left `.claude/standards/prose.md` on disk with nothing pointing at it. The duplication is the cost of a default install that works. It ends when `--stack` defaults to `base`, tracked on the board.

The `.claude/wireframes/` folder ships with an `index.md` discovery anchor. Add a file per surface as the UI grows, following `.claude/standards/wireframes.md`. Read `index.md` first, then load only the surface files the current task touches. Per-surface files keep the lazy-load model honest as the project grows.

The `.claude/context/` folder ships only its `index.md` discovery anchor. The entries themselves come from elsewhere: `tooling/base/seeds/` installs `development.md` and `ci.md` as user-owned files, and `aitk init` runs base tooling before the Claude domain, so those land first and the Claude seed pass skips what is already present. Do not add a context entry to the Claude seeds without checking `tooling/base/seeds/.claude/context/` for the same path, since two seed sources writing one destination resolve by whichever domain runs first.

The seed `settings.json` ships four hook scripts across three blocks. A PostToolUse hook pairs with `.claude/hooks/standards-audit.sh`, which greps markdown files for the em-dashes, semicolons, and closed-set banned words named in `.claude/standards/prose.md`, excludes fenced code blocks, and emits `additionalContext` so the agent self-corrects on the next turn. Scratch dirs `.claude/.tmp/`, `.claude/memory/`, `.claude/review/`, and `.claude/plans/` are skipped. The wordlist is parsed out of the standard at runtime rather than hardcoded, so the hook cannot drift from `prose.md` the way a second copy would. Extraction takes the single-word backticked terms from every bullet opening `- Do not use`, which admits the buzzword and vague-qualifier sets and skips the multi-word and punctuation bans phrased the same way. A ban worded differently arms nothing, so the filler bullet opening `Open a sentence with its subject and action` stays outside the hook until the extraction widens to reach it. Matching is case-insensitive on word boundaries and drops inline code spans first, so `just build` in a command and a `--very-verbose` flag do not read as prose. Every banned word on a line is collected into one report line. A PreToolUse hook on `Grep` and `Glob` pairs with `.claude/hooks/index-reminder.sh`, which walks up from the search path to the nearest `index.md` and reminds the agent to read it first, once per folder per session. It fires only where an index exists, so it self-scales to a project's index density. A PreToolUse hook on `Write` and `Edit` pairs with `.claude/hooks/scratch-guard.sh`, which fires when a temp-path write lands outside `.claude/.tmp/` and reminds the agent to write scratch there, once per session. It exempts anything under `CLAUDE_PROJECT_DIR` before matching the temp patterns, because the bare `*/tmp/*` match has no notion of a project root and fired on every source write in a project whose own path carried a `tmp` segment. That trade gives up warning on a write to `<project>/tmp/`, which is a real violation, in exchange for silencing a false positive that fired constantly. It enforces the scratch rule deterministically instead of relying on CLAUDE.md prose the harness scratchpad instruction competes with. The same PostToolUse block also carries `.claude/hooks/tasks-index.sh`, which regenerates `.claude/tasks/index.md` after a task file changes. It is the only trigger that reaches that folder, because the board is gitignored and the whole-repo index walk filters candidates through `git check-ignore`. It derives the walk-up boundary from the file path rather than the session, since the board resolves at the main worktree root and a linked worktree would otherwise reject the path, passes `--no-stage` so a hook never touches the git index, and reports both a frontmatter failure and a missing `aitk` as `additionalContext`, because no gate stage can fail on a stale index in an ignored folder. Reporting is the point of the hook, so neither failure exits quietly, and the path guard keeps both messages scoped to a task-file edit.

User-level pieces (attribution, permission `allow` entries, and `.env` denies) live at `~/.claude/settings.json` and install once per machine via `aitk claude setup`. Project settings layer on top of user settings, so per-project files only need to carry what is genuinely project-specific.

### seeds

`aitk claude seeds list [--json|--names]` enumerates the seed docs that `aitk claude init` would copy into a project. Skills consume `--json` to compare a target project's installed copies against the toolkit's current seed source and propose targeted edits. The CLI only emits content. Reconciliation is the skill's job (see `claude-seed-sync`).

The listing reads `planSeeds`, the same function `init` applies, so the two cannot disagree about what a seed install contains. The bash it replaced re-globbed the seeds directory against its own hard-coded subdirectory list, which had drifted: `.claude/context/index.md` was installed by `init` and absent from every listing.

### sync

Reports whether each seeded project doc is present, then reconciles `.gitignore` against the `[gitignore]` section of `tooling/claude/manifest.toml`: appends any missing entries and prunes entries inside the `# Claude` section that the manifest no longer declares. Removed entries are logged as `-` lines. Never touches seeded project docs, so `.gitignore` is the only file it writes.

`aitk sync` invokes this command with `AITK_NON_INTERACTIVE=1` when `.claude/` exists in the target, so gitignore reconciliation lands in the combined sync PR alongside other domains. The changed-file tracking in `src/sync/target.ts` watches `.gitignore` for this reason. Seed audits are not automated. Run the `claude-seed-sync` skill for per-part reconciliation across the preamble and each `##` section. `aitk sync` prints a tip reminder at the tail.

### setup

Installs user-level Claude Code config from `tooling/claude/user/` into `~/.claude/`. Run once per machine after cloning the toolkit. Idempotent. Re-runs skip blocks that already match.

`aitk claude setup [dest]` accepts a destination and falls back to `$HOME/.claude`. This is the only toolkit verb that writes outside a target project, so the argument exists to make it testable and to keep the sandbox scenario off the operator's real config. It refuses the toolkit's own `.claude/`, which is tracked and would otherwise take a `statusLine` pointing into the toolkit checkout.

It edits `settings.json` in place, restoring the file's mode and its existing indent width. Only the four keys the toolkit owns move, so a hand-maintained settings file comes back with the rest of its content and formatting untouched.

Three things land:

- `statusline-command.sh` copied to `~/.claude/` and registered as `statusLine.command` in `~/.claude/settings.json`.
- `attribution.commit` and `attribution.pr` set to empty strings to suppress Claude attribution in commits and PRs.
- `permissions.allow` and `permissions.deny` merged from `tooling/claude/user/settings.template.json`. Defaults: `Bash(bun run *)` on allow, and `Read(**/.env)` plus `Read(**/.env.*)` on deny. Existing user entries are preserved through `unique`-merge.

The statusline renders as: `Opus 4.8 | xhigh | 80k / 1000k | 92%`. Fields are model name, effort level, tokens used vs context window size, and remaining percentage. The effort field is omitted when the model does not report one. The percentage is colored by headroom: green at 30% or above, yellow below 30%, and red with a `⚠` prefix below 15%.

## Built-in vs toolkit features

Claude Code includes built-in features that overlap with some toolkit skills. They serve different purposes and are complementary.

### Code review

| Aspect   | Claude Code Review (built-in)                   | `claude-review` skill                                                             |
| -------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| What     | Managed service that reviews PRs on GitHub      | Local skill that reviews diffs in terminal                                        |
| Trigger  | Auto on PR push, or `@claude review` on a PR    | `/claude-review` in a Claude Code session                                         |
| Context  | Reads the full repo on Anthropic infrastructure | Reads project docs (REQUIREMENTS, ARCHITECTURE) plus auto-loaded `.claude/rules/` |
| Output   | Inline PR comments with severity tags           | Terminal findings grouped by file                                                 |
| Best for | Post-push review on GitHub                      | Pre-push local review aware of project docs and governance                        |

Use both: run `claude-review` locally before pushing, then let Code Review catch anything on the PR.

### Planning

| Aspect     | Plan mode                                        | Ultraplan                                               | `claude-feature` skill                                                                                                                                              |
| ---------- | ------------------------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What       | Permission mode: Claude explores but cannot edit | Cloud-based plan drafting with browser review UI        | Skill that reads project docs and proposes files to touch                                                                                                           |
| Activation | `Shift+Tab` or `/plan`                           | `/ultraplan` or the word "ultraplan" in prompt          | `/claude-feature`                                                                                                                                                   |
| Output     | Free-form plan in terminal                       | Rich plan in browser with inline comments and reactions | Structured output: summary, files to touch, risks, and questions that each carry a suggested answer                                                                 |
| Context    | Whatever Claude reads during exploration         | Same, but on cloud infrastructure                       | Explicitly reads REQUIREMENTS, ARCHITECTURE, DESIGN, the task board, and the relevant `.claude/wireframes/<surface>.md`. Coding rules in `.claude/rules/` auto-load |

Plan mode is a permission mode that restricts Claude to read-only exploration. `claude-feature` is a structured prompt that forces a specific output format and reads specific project docs. They solve different problems and can be used together: enter plan mode, then invoke `claude-feature` for a scoped proposal grounded in your project docs.

`claude-groundwork` sits ahead of all three. It runs before a topic is ready to plan, and its output is a scratch folder that can conclude in doing nothing. Reach for it when the current state is unmeasured and more than one approach is live, then run `claude-feature` on the decision it produces.

A track may run its own experiments. Reading and computing were always in scope, so the permission that mattered is the fixture write, and it lands under `.claude/.tmp/groundwork-fixtures/<slug>/` rather than inside the track folder so mode detection never matches a fixture as a track. A billed headless run is bounded by a count of three rather than by a dollar figure, because a headless run reports its total cost only after it finishes, which makes a budget reportable and not enforceable while a count is checkable before spawning. The record lands in `08-spikes.md`, the one reserved number sitting after the closing files, because it holds evidence rather than a topic.

The fixture path splits by who reads it. A fixture this session provisions and reads itself is fine in-repo, and a fixture a headless run is pointed at has to sit outside the repository under `mktemp -d`. A session started anywhere beneath the project root inherits that project's `CLAUDE.md`, `.claude/rules/`, and `.claude/standards/` through the ancestor chain, so an in-repo arm measures the repository rather than the thing under test. `scripts/eval/run.sh` already extracts to `mktemp -d` for this reason and carries the reason in a comment, which is the isolation a track should copy along with the assertions.

### Running the app

| Aspect   | `run` (built-in)                                             | `project-commands` skill                                  |
| -------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| What     | Launches the app and drives it to confirm a change works     | Runs a command the project documents, then stops          |
| Sources  | Falls back through built-in patterns per project type        | Reads `.claude/context/development.md` and nothing else   |
| Ends at  | A verified app: logs read, browser driven, screenshots taken | The launch: the port or exit status, and nothing after it |
| Best for | Confirming a change behaves in the real app                  | Starting something to use, or running a check             |

The built-in delegates to a project skill when it finds one, so the two compose rather than compete. The split is the stop condition. `run` continues past a passing health check by design, because its job is confirming a change. That is the wrong shape for "start the server so I can use it", which is the request `project-commands` answers.

The no-fallback rule is what keeps the boundary sharp. A skill that guesses at a command source when the entry is missing becomes a second launcher, and the two would then disagree about what a project runs.

Both skills close their questions with a lean, and the two leans differ in strength on purpose. A plan's `- Suggested:` is decision-ready, so a blank `- Answer:` means accept it at execution time. A groundwork `- Leaning:` is weaker: it records where the evidence currently points on a question still open by definition, and pairs with an `- Overturned by:` line naming what would change it. Collapsing the two would turn a groundwork track into premature planning, the failure the container exists to prevent. A measurement question carries no lean at all, since a guess at a number is worse than an admission.
