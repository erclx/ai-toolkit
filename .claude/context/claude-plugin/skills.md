---
title: Skills
description: The plugin skill catalog, the shell-out pattern, and the workflow versus domain-knowledge strategy
---

# Skills

## Plugin skills

Plugin skills live in `claude/skills/` and are auto-discovered from the plugin root, whether that root is a marketplace install or a `--plugin-dir` pointed at a checkout. No registration needed, folder presence is enough. Each skill is a kebab-case folder containing `SKILL.md`.

A skill folder may also carry `REQUIREMENT.md` beside `SKILL.md`, stating the gaps that skill exists to close so a proposed change has something to be argued against. It is authoring context for whoever maintains the skill. Claude Code loads `SKILL.md` as the entry and never reads the sibling, and `src/sync/check.ts` leaves `claude/skills/` out of the synced sources because skills load live from the plugin directory rather than being copied, so the file reaches no target session and costs no tokens there. `governance/rules/claude/570-skill.md` fires on both filenames and carries the consult-first bullet. Twenty-five skills carry one, covering the whole `git-*` family and the five-skill ship chain, which is what settled the unit as the skill rather than the family. `aitk claude skills list --json` reports presence per entry as `requirement`, so a caller reads coverage from the catalog rather than from the filesystem.

The admission test was replaced and the coverage spread is the reason. None of the eight internal skills carry one while the path-scoped rule globs that tree, so the gate binds nothing there. `standards/skill.md` had said the file was worth writing when a skill's scope was arguable rather than obvious, which correctly exempts most of the corpus and makes a coverage push an argument with the criterion it was meant to satisfy. The standard now names the second purpose the file already served, compressed orientation over a body that is procedural by design, and admits a skill when a reader cannot recover what it is for from the body alone.

Skills that perform a one-time structural move of an existing project into a newer toolkit layout use the `migration-*` prefix (`migration-claude-md`, `migration-context`, `migration-standards`). Add new one-shot relocations to this family. Recurring reconciliation tools like `claude-seed-sync` are not migrations and stay outside it.

### Requirement coverage

Coverage is selective by design, so an uncovered skill needs a stated reason rather than silence. The verdicts below are what make an exemption checkable, since a skill nobody read and a skill the criterion turned down look identical from outside.

Which skills carry the file is a fact `aitk claude skills list --json` reports as `requirement` per entry, so nothing below repeats it. What a listing cannot give is why, and that is what this section holds. A reason is stated per skill where the call was close and collectively where one test decided a whole set, so an exemption is always checkable and is not always its own bullet.

The `setup-*` and `migration-*` families were read as one batch because a shared prefix contests scope by construction. Each verdict names the boundary the prefix contests and which file settles it.

- `setup-init` carries one. It orchestrates a chain whose pieces four siblings each perform, so which of them the chain runs is contested by construction and only the requirement settles it against all four.
- `setup-gov` carries one. It installs one domain of a chain `setup-init` runs whole, and the rule it refuses to author belongs to `create-rule`, so two boundaries meet in one skill.
- `migration-context` carries one. It proposes into the same `.claude/context/` folder `migration-claude-md` writes, so the order the two run in is a contract neither body owns alone and the requirement is where it lives.
- `setup-indexes` carries none. Its scope block, its `.claude/snippets/` exclusion, and its opt-in maintenance note each ship with the reason behind them.
- `setup-plugins` carries none. Machine scope against project scope is its edge, stated in the description and again in the body with the reason.
- `setup-verify` carries none. Its `## Out of scope` section names three exclusions with a reason each, and hands the first to `project-commands`.
- `migration-claude-md` carries none. Its description names `migration-context` as the owner of `docs/` files, and its closing rule bans execution outright.
- `migration-standards` carries none. It reads the root folders neither sibling touches, and its toolkit-owned against author-owned split ships with the reason it exists.

Length did not discriminate. The longest body in the batch was turned down and the second shortest admitted.

The remaining twenty-five were read in one pass rather than batched, since two samples at three of eight had already shown the criterion separates. Four were admitted. Their reasons are below, and the twenty-one rejections are stated collectively at the end of this section rather than one bullet each.

- `bash-script` carries one. Its body asserts a visual house style whose value is that every generated script shares it, which is a property no single script establishes for itself and no body written from inside one can state.
- `ci-workflow` carries one. Where pipeline structure ends and job contents begin is the only boundary it has, and the requirement is what fixes that line for a body whose rules are otherwise all structure.
- `docs-sync` carries one. It runs immediately after `claude-docs` in the ship chain and resolves the same baseline against the same tree, and neither body states that the split is by audience rather than by subject.
- `claude-seed-sync` carries one. It is the section-granular alternative to `aitk standards sync`, which is the grounds `toolkit-cli` and `toolkit-operator` both route to it on, and its own body never says so.

The twenty-one rejections share one reason and it is checkable per file. Nineteen of them open with a line stating what the skill is for or what fails without it, carry an explicit `## Boundaries` section, or both, so the two limbs of the test are answered before the body reaches its first step. Open any of the nineteen and the line is the first paragraph under the H1. Two carry neither and were turned down on narrower grounds:

- `claude-ui-test` is the genuine close call. It writes into the same `.claude/review/` namespace as `claude-ux-audit` over the same file types, which reads as contested until the entry conditions are compared. Verify a change against audit an existing surface is a real partition and both descriptions state it.
- `session-resume` states its purpose in the description rather than the body, and its three do-nots each carry the reason behind them, which answers the second limb without a boundary block.

The rate broke from the prior two samples: four of twenty-five against three of eight twice. The pass was not stopped early, and the nineteen are why. That content is what the `v16.0` audit and the two unreachable-step sweeps added while working the same corpus, so the tail arrived already carrying what a requirement would have supplied. The families the earlier batches sampled were selected because a shared prefix contests scope, and the tail is the residue that has no family and no prefix to contest.

### Catalog

- `bash-script`: Generate interactive bash scripts with a visual timeline UI and error handling
- `ci-workflow`: Generate GitHub Actions CI workflow files with parallel, gated jobs
- `cli-script`: Generate non-interactive automation and CI bash scripts in a lean functional style
- `claude-design-extract`: Draft `.claude/DESIGN.md`, sourcing tokens from existing UI surfaces or proposing them on day one
- `claude-design-propose`: Pointer at `claude-design-extract`, removed in `0.19.0`
- `claude-diagram`: Write per-kind Mermaid entries into `.claude/diagrams/`, then verify each render
- `claude-docs`: Update .claude/ planning docs and mark outcomes the diff shipped
- `claude-feature`: Plan a feature by reading Claude setup and scanning source files
- `claude-groundwork`: Open, resume, and close a numbered groundwork folder under `.claude/.tmp/groundwork/<slug>/`
- `claude-memory-capture`: Extract durable patterns from the session into `.claude/memory/`
- `claude-memory-review`: Review `.claude/memory/` and propose per-entry promote, consolidate, handoff, or delete
- `claude-orchestrate`: Assert the orchestrator role, refill the ready queue, and dispatch the build loop
- `claude-pr-review`: Review an open PR from an independent session, posting a first pass and a further pass on each delta until nothing is open
- `claude-address-review`: Pull PR findings and CI status, fix each, refresh stale docs, push a follow-up, and reply
- `claude-review`: Review all changes since main for bugs, edge cases, and logic flaws
- `claude-roadmap`: Draft or update `.claude/ROADMAP.md` by sequencing MVP scope into ordered versions
- `claude-screencast`: Draft a stack-agnostic screencast script with pre-seeded beats and defaults
- `claude-seed-sync`: Audit installed seed docs and standards against toolkit sources, write per-part proposals
- `claude-slides-draft`: Draft a `.claude/SLIDES.md` source and render it to PowerPoint via `aitk slides render`
- `claude-standards-audit`: Audit changed markdown files against every standard declaring jurisdiction over their paths, reporting only
- `claude-tasks`: Create a task file on the board and archive a shipped one out of the folder
- `migration-standards`: Propose `git mv` of root standards/ and snippets/ into .claude/
- `claude-ui-test`: Generate and run Playwright e2e tests, with manual checklist for visual-only items
- `claude-ux-audit`: Audit existing UI surfaces for missing states, edge cases, and inconsistencies
- `claude-worktree`: Enter a worktree at `.claude/worktrees/<name>/` with name derived from plan or branch
- `claude-autoship`: Chain implement → verify → review → ship after a plan is approved
- `migration-claude-md`: Classify `CLAUDE.md` sections and propose moves to path-scoped rules or context entries
- `migration-context`: Classify `docs/` content and propose `git mv` to `.claude/context/`
- `create-rule`: Scaffold a project-local governance rule into .claude/rules/
- `create-skill`: Create a new skill file in .claude/skills/
- `create-snippet`: Pointer at `create-standard`, removed in `0.19.0`
- `create-standard`: Create a new standard file following the meta-standard, or a new snippet file
- `docs-sync`: Rewrite stale README.md and docs/\*.md sections since main
- `git-branch`: Rename current branch to match conventional format
- `git-commit`: Generate a conventional commit message from staged changes
- `git-followup`: Stage, commit, push, and sync the open PR, replying when it carries review comments
- `git-pr`: Generate a PR description and open or update a pull request
- `git-issue`: Format a session bug or task and file it on the current repo via `gh issue create`
- `git-split`: Split a mixed-commit branch into focused branches and open PRs
- `git-stage`: Batch-commit staged files grouped by concern
- `git-worktree`: List and clean up linked worktrees after shipping
- `toolkit-cli`: Reference for what aitk sync and install commands overwrite, merge, or leave untouched
- `toolkit-operator`: Front door that orients on toolkit docs and live catalogs, then runs or routes any operation
- `setup-gov`: Detect project stack from files and install matching governance rules
- `setup-indexes`: Bootstrap the index.md system in a target project, drafting frontmatter per folder
- `setup-init`: Detect project type and run one-shot `aitk init` with resolved flags
- `setup-plugins`: Install curated community and official plugins user-scoped via the `claude plugin` CLI
- `git-ship`: Run the full post-feature workflow in one sequence
- `session-resume`: Resume from tracked work and relevant context at session start
- `systematic-debugging`: Enforce root-cause investigation before fixes when a test fails or a bug surfaces
- `toolkit-feedback`: Format a session-context feedback block and write it to the toolkit repo via `aitk feedback`
- `toolkit-triage`: Triage open GitHub feedback issues, classify each, and route to a direct fix or `claude-feature`
- `setup-verify`: Run `package.json` scripts after scaffold to catch config and wiring mistakes
- `project-commands`: Run a command documented in `.claude/context/development.md` and stop at the launch
- `youtube-transcripts`: Fetch a YouTube transcript with metadata frontmatter via `aitk transcripts`

### Invocation and the task board

Invoke with `/skill-name` or let Claude auto-trigger by matching against the skill description. Skills marked with `disable-model-invocation: true` (`claude-autoship`, `claude-orchestrate`, `create-skill`, `git-ship`, `toolkit-operator`) require explicit invocation and will not auto-trigger. Git skills (`git-commit`, `git-pr`, `git-branch`, `git-stage`) override built-in commit and PR behavior. See `.claude/standards/skill.md` for authoring conventions.

Two skills write to the task board and the split is by operation rather than by file. `claude-tasks` brings a task file into existence and moves a shipped one to `.claude/.tmp/task-archive/`. `claude-docs` edits the contents of a file that already exists, marking outcomes `[x]` from the diff and sweeping the plans those tasks cite. Neither crosses into the other, because two skills relocating the same file drift into relocating it differently.

Creation is the only moment the task-origin invariant is enforceable, so that is where `claude-tasks` enforces it. A task names a plan, a groundwork folder, or an issue, and the skill refuses to write one that names none. The reverse direction is a report rather than a prompt, since a groundwork track can be opened long after its task would have been written, and an offer to create a task for each open track would be noise on most runs.

Archiving a task deliberately does not archive its plan. `claude-docs` owns the plans sweep and already holds the last-live-citation rule, so `claude-tasks` moves nothing.

That split forces an ordering, and `claude-tasks` guards it rather than documenting it. The plans sweep finds its work by scanning `.claude/tasks/*.md`, so it can only reach a task still in the folder. Archiving the task first puts it beyond that scan for good, stranding the plan in `.claude/plans/` with no live task citing it and an archived task pointing at a path nothing will retarget. So the archive verb stops when the `Plan:` line still points inside `.claude/plans/` and sends the caller to `claude-docs` first.

Every stop the verb emits has to name a next step that actually moves. The sweep is gated twice, on the citing task's outcomes being all `[x]` and on no other task sharing the plan, and a stop that routes past either gate returns the caller to the same guard unchanged. So the outcome check runs first and refuses to admit an open outcome, and the plan check counts citations only to decide which of two messages to print. A shared plan is the misfile the tasks standard names, resolved by hand rather than by a sweep.

A plan that ships is archived rather than removed. `claude-docs` moves it from `.claude/plans/` to `.claude/.tmp/plans-archive/` in its scratch sweep, overwriting on a repeated slug, then retargets the task file's `Plan:` line at the new location. Retargeting is what makes the archive worth having, since an archive nothing points at is barely better than a deletion. A task already pointing into the archive is skipped silently, which keeps a second pass idempotent instead of warning on work it did itself.

The `Plan:` line carries a markdown link relative to `.claude/tasks/`, so both parsers read the target out of the parentheses and both resolve it against that folder before routing on it. Resolving is what lets `../plans/x.md` and the older bare `.claude/plans/x.md` land on the same file, and skipping it would drop every link-form task through to the sweep's final warn-and-skip branch, archiving nothing. The retarget writes a link back for the same reason it reads one: that branch is the only writer producing a `Plan:` line nobody authored, so emitting a bare path would convert the board to the old form one closing task at a time.

The sweep archives only when the closing task is the last live citation of that plan. One plan can serve several tasks, and moving it on the first to close strands every other pointer at a path that no longer resolves. `.claude/plans/` is gitignored, so no history recovers the retarget and the shared plan stays put until the last citation closes. The count compares the resolved target rather than the raw string, because a board holding one task written `../plans/x.md` and another written `.claude/plans/x.md` cites one plan and a raw comparison reads two, counts zero, and archives the file out from under a live task. Comparing basenames instead trades that for the mirror error, since a live plan and an archived one share a filename whenever a closed task still points into `.claude/.tmp/plans-archive/`, so the count invents a citation and the plan is never archived.

That sweep scans the whole board rather than the task files the session touched, and Step 8 states the scope in the sentence carrying the instruction rather than as a correction below it. A scope stated as a correction loses to the instruction above it. A step opening with "sweep only scratch that was actually consumed this session" and asserting the opposite for plans four lines later gets read as session-scoped, so a run sweeps its own plan and passes over every task that closed earlier with a plan nothing would move. That is the general lesson and the reason the fix moved words rather than adding a rule.

The sandbox arm for this is `board-sweep`, kept separate from `drift`. `drift` asserts a plan archived for the task the prompt names, and `board-sweep` asserts one archived for a task the prompt never mentions. Folding them would leave a single failure ambiguous between the sweep not running and the sweep not reaching past the session.

The arm carries a third task whose outcomes stay open and whose plan must survive the run. Widening a scan and dropping the gate that bounds it fail in opposite directions but look identical in a fixture where every task closes, so the arm needs a case the sweep is required to pass over. Its assertions cover the plan's location and the task's untouched `Plan:` line, since a run that retargeted the pointer anyway would leave the task aimed at an archive path holding no file.

### Archiving on merge

Which task closes is decided from the diff, not the session. `claude-docs` resolves a merge base against `origin/main`, unions the committed diff with the working tree and untracked files, then matches unchecked outcomes on the board against what shipped. Completion is a fact about the repository, so a session that shipped a queued task without ever discussing it still leaves the board correct. Requirements, architecture, and design stay session-sourced, because those are judgments a diff cannot carry. The same baseline feeds the wireframe sweep and the context refresh, which previously read `git diff main` and saw nothing at all when run on `main` itself.

Nothing chained the archive until the `post-merge` git hook landed. Every earlier step fires from `claude-autoship` or `git-ship`, both of which finish while the pull request is still open, and a task archived there closes for work that may be abandoned. So the hook is the only event that lands late enough, and the board being gitignored rules out reading it from anywhere but the operator's own machine.

That hook now archives rather than announcing, and the escalation turned on closing one gap rather than on the detection proving itself. Both reasons the announce-only version gave for declining to act were re-measured. The first, that `index.md` regenerates from a `PostToolUse` hook a shell-side `mv` never fires, was void: `aitk indexes regen` is a CLI verb, so the command regenerates the index as part of the move. The second, that a gitignored board leaves no diff to review with nobody watching, holds only for a blind sweep of every all-`[x]` task and stops holding once the hook can name which task a merge closed.

Naming it is what nothing recorded. A branch name cannot carry the link, because every merge on `main` is a squash with a single parent and the branch commits never land, so an ancestry test fails on every shipped task. The number in the subject is the only offline signal. `git-pr` writes `Pull request: #NNN` onto the task from the number its final command printed, which is the one step that always runs when a pull request opens, and the hook reads it back out of `ORIG_HEAD..HEAD`. Reading the tip alone would strand every task but the last on a pull that fast-forwards over several merges.

That number has to name an open pull request. `gh pr view` resolves by head branch and ignores state, so a branch name reused after an earlier pull request merged returned the closed one, and the run rewrote a merged pull request's title and body while reporting its URL as the one it opened. The detection reads `gh pr list --head` scoped to `--state open` and to the repository's default base now, since one head can carry open pull requests against two bases and reading the first result would pick between them by list order. The run resolves once and reuses what that command printed rather than looking the number up again for the task write. The sandbox arm measured the second lookup rather than assuming it: `gh pr view` prefers the open pull request when a head carries both, so the number it wrote was right, and the plan's claim that it recorded the merged one was wrong. It was removed anyway, because that precedence is an undocumented detail of the tool and the record `aitk tasks archive` closes against should not rest on one. `git-followup` needed nothing, since its guard already stops unless the state is `OPEN`. The cause sits in `git-branch`, which has no collision check against a name that already carried a pull request, and that stays on the board because scoping the lookup makes a reused name survivable.

The gates all live in `aitk tasks archive` rather than in the shell. A hook that pre-filtered would duplicate them in a language where the outcome test already needed an errexit comment, and the skill calling the same command is what stops the attended and unattended paths archiving differently. Each gate refuses with a non-zero exit rather than reporting, since a caller with nobody watching cannot act on a warning. A task whose outcomes are not all closed, whose plan is still live, or which shares its pull request number with another task all refuse and print why. `claude-tasks` keeps the one check the command cannot make, which is confirming the work reached `main` when a person archives by name rather than by merge.

`post-rewrite` carries the same check for anyone pulling with rebase. `git pull` under `pull.rebase=true` runs `git rebase`, which fires that event and never `post-merge`, so without it the trigger is a silent no-op on that machine. It delegates to `post-merge` on the `rebase` argument alone, since the same event fires on `commit --amend` and an amend changes nothing on the board. Silence is the wrong failure mode for a hook that exists to stop a shipped task being forgotten, and the base stack ships to targets whose pull style this repository does not control.

### The diff baseline

A `git init` project on `main` with no remote resolves no usable baseline, which is the ordinary shape of a scaffolded target project rather than an edge case. That costs only the committed half of the diff, since the working tree and untracked files still scope correctly. The marking step recovers the committed half by reading `git log -p -1`, which supplies content where a bare file list would not. The wireframe sweep and the context refresh run on the working tree and untracked files, and skip only when that set is empty. Neither ever substitutes the whole tree for a missing baseline, because both write, and a set that wide would stub a wireframe per uncovered surface and rewrite every context entry. The asymmetry with the marking step is deliberate and worth keeping: on a scaffolded project the last commit is the scaffold commit, so the `git log -p -1` recovery is the whole tree by another route, which a step that only reads can tolerate and a step that writes cannot. Widening what a step reads is safe. Widening what a step writes is not.

That baseline is the worked case behind a rule split across two skills. One step in `claude-docs` resolved the diff baseline and three consumed it, and the fallback for an unresolvable baseline was written against the marking step, which only reads. Under that same fallback the two sweeps that write would have stubbed a wireframe for every uncovered surface and rewritten every context entry.

So `claude-feature` obliges a plan that establishes a resource with more than one consumer to list them and mark each read or write, and `claude-pr-review` carries the matching lens beside Integration and Contract. Both skills ship to target projects, where a consumer is a call site, a module, or a component rather than a skill step, so the clause names the unit generically. The review half is what catches the miss, since an author who never noticed the resource was shared will not notice the authoring clause either. `claude-review` stays out of it, because an author reviewing their own change cannot catch a consumer they never enumerated.

Root `CLAUDE.md` and the `CLAUDE.md` seed each own the policy statement, and the skill owns only the mechanism, so the skill states what it does without re-deriving why. The seed keeps its own copy because a scaffolded project cannot point at the toolkit's file.

That baseline then reached four more skills, which had never had it. `claude-review`, `docs-sync`, `claude-standards-audit`, and `git-pr` each resolved a base against bare local `main`, so on `main` every committed change dropped out and the skill reported a clean result rather than admitting it could not see the work. `git-pr` spelled it `git diff main..HEAD`, a two-dot range that compares tips and resolves no merge base, so a grep for the bare form never matched it and an advanced local `main` showed up as reversed changes in the description. Its `git log main..HEAD` carried the matching defect on the commit side, where a local `main` trailing `origin/main` leaves commits in the range that the diff already excludes, so the description lists work whose changes appear nowhere in it. Both halves read `<base>` now, which is what keeps the commits and the changes describing one branch. Four of the eleven corrected sites were guards, which is the half that decides whether a fix lands at all: correcting the working read and leaving the guard ships a skill that still stops before it reaches the corrected code.

Porting the block also corrected the test for an unusable baseline. `claude-docs` calls the base unusable when it came from local `main` and equals HEAD, which keys on where the ref came from and misses the case where `origin/main` resolves a merge base that also equals HEAD. That is the ordinary shape of a feature branch before its first commit, so the narrow test would have gone blind on the sessions these skills run in. `claude-docs` never pays for it, because it unions the committed, working, and untracked sets and the committed half going empty costs it nothing. Any skill reading the committed half alone needs the wider test, which is that the base equals HEAD whichever ref resolved it. Correcting the wording in `claude-docs` itself is a follow-up rather than part of the port, since nothing there reads it wrongly today.

`claude-autoship` was held back from that port on purpose and became the fifth skill to take the baseline. Its classifier decides whether a review runs at all, so widening what it sees turns a branch that looked prose-only into a mixed one and changes behavior rather than only correctness. It shipped with the bug filed against that classifier instead of inside a five-file diff, since a stale baseline is one of the ways the file list comes back empty and the vacuous test is what then waves it through.

Its unusable test is narrower than the four siblings', which is the wider rule applied rather than an exception to it. A skill reading the committed half alone needs the base-equals-HEAD arm, and the classifier diffs the base against the working tree, so the uncommitted work stays in the set when that arm would fire. Autoship reaches Step 5 before `git-stage` has committed anything, so the base equals HEAD on every ordinary run and porting the arm verbatim would stop the chain every time. The skill body says so at the point of the omission, because the next reader porting the block will otherwise correct it back.

The empty list is what stops the chain instead. Routing it into review rather than stopping would re-create the silent skip by a longer path, since a review of no files produces no findings and Step 6 reads that as a clean pass. The prose-only skip survives untouched, because the defect was a broken read making every branch look prose-only rather than the skip itself.

A plan whose output is entirely gitignored still reaches the stop rather than a fix, which is a separate defect that surfaces six steps later at `git-stage`. The stop names that case apart from a plan yet to produce output, since the two want opposite responses and a single message covering both sends the operator to the wrong check. Advising a re-run once the output is tracked is the wrong fix for scratch that is gitignored by design, and followed literally it commits scratch to close a stopped run.

### The roadmap gate

`claude-orchestrate` asserted an active version from a roadmap this repository never had. `.claude/ROADMAP.md` is specified by `standards/bundled/roadmap.md`, written by `claude-roadmap`, and read by `claude-orchestrate` and `claude-pr-review`, and the file has never existed here. Every read path skips a missing file by instruction, so nothing failed loudly and the `Active: vX.Y` output line was unsourced on every run since the skill shipped.

Drafting the roadmap was the obvious fix and the standard forbids it. All eight MVP features in `.claude/REQUIREMENTS.md` have shipped, and the Lifecycle section of `standards/bundled/roadmap.md` says the scope is exhausted once the last version ships, with later work arriving as discrete items rather than extending the roadmap. A table of the current maintenance labels would satisfy the format and break the lifecycle rule in the same file.

So the claim was stripped rather than sourced. The skill reads `priority.md` for order, keeps `index.md` for what is queued, and treats the roadmap as optional, reporting what it says with a date from `git log` instead of naming a version as fact. The date is what keeps the report honest when the file is old, since trading an unsourced claim for a confidently stale one repeats the defect by another route. Sequencing read from a committed roadmap returns when a requirements pass defines a next scope, which the distribution work shipped without.

The writer kept drafting over that same exhausted scope for another cycle. `claude-orchestrate` gained the gate and `claude-roadmap` did not, so invoking the skill directly still produced the document the standard forbids. Its only guard tested that `.claude/REQUIREMENTS.md` exists and names MVP features, which a fully delivered scope satisfies exactly as a fresh one does. The gate sits in the writer now, where a refusal reaches every caller rather than the one that happened to carry it.

What the gate reads is a section's presence rather than a shipped flag. `standards/requirements.md` gained a Lifecycle section stating that later scope arrives as a new section and that a roadmap sequences the MVP list alone, so a file carrying a section the standard names nowhere is one whose MVP list has already shipped. Nothing was added to mark a feature shipped, because the same section forbids annotating MVP entries with status and a flag would have been the thing it bans.

`## Distribution` stays outside the trigger set. The standard tells a project shipping to outside consumers to include that section from the start, so a greenfield project carries it before a single feature ships and a gate reading it would stop the loop at step one while asserting a scope was sequenced that never was. The cost is that a project whose only later scope is that section passes the gate, which this repository is, since the distribution work landed here without the requirements pass that would have named a section freely. Both remaining gaps under-fire rather than stop wrongly, which is the direction a guard reading a convention should fail in.

### The review two-pass model

`claude-pr-review` reads the same path and was left untouched. Its read informs a review comment and asserts nothing, so it carries no defect to fix, and the body sits inside a queued rewrite's file set where an edit here would buy a rebase for no behavior change.

That rewrite landed as a second pass the skill had never described. `claude-pr-review` posts twice over a pull request's life, a first pass and a close-out, and `claude-orchestrate` step 7 assumed the second one while the skill body defined only the first. The body path carries the head commit now, `body-<number>-<short-sha>.md`, because keying on the pull request number alone stops two sessions reviewing different pull requests from colliding and says nothing about one session posting twice. Callers invented five spellings for the second file across roughly twenty-five scratch files, and the sessions that had already written the defect down overwrote their first-pass body anyway. A name the caller has to choose is a name the caller gets wrong, so the fix is that the second segment is derived.

Deriving it also decides what a close-out reads. `gh pr view --json reviews` returns `commit.oid` per review, so the last comment the skill posted names the commit the prior pass covered, and the close-out reads that range to the head rather than the whole change. The same field settles the rebase case without a second mechanism: after a force-push the prior commit no longer reaches the head, `git merge-base --is-ancestor` exits non-zero, and the skill pays for a full pass and states that in the body. Scoping by the prior review's timestamp instead would have needed its own rebase test, since a commit's author date can predate the push that put it on the branch.

The heading is the half a reader sees without opening anything, so it reports state rather than pass number. `## Review` covers every pass carrying a finding and `## Review closed` is reserved for one carrying none, so the state comes off the most recent comment rather than off a label on a kind of pass. A close-out does not close the pull request, which is why the rule reads the latest heading rather than promising the closed one is last. Coupling it to the pass number instead was measured wrong on two reviews in five, since twenty-one of fifty-three close-outs reported an open finding under a heading asserting closure. `claude-address-review` nests `## Review response` under the first of those, so a thread reads as opened, answered, still open, closed.

Sharing a prefix across that family is why the detection matches the first line for equality rather than testing a prefix. A prefix test also accepts `## Review response`, and it happened to be safe only because `claude-address-review` posts through `gh pr comment`, which lands in `.comments` and never in `.reviews`. Nothing recorded that dependency, so the close-out would have started scoping to the worker's reply the day that skill switched to posting a review. An equality test costs the same and owes nothing to a sibling's choice of command.

### The CLI shell-out pattern

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

### Shared procedures

Two procedures run inside more than one skill and are defined once in `standards/`, cited from each body rather than restated in it. Each has a standard of its own, `publish.md` for the scan and `slug.md` for the transform. Neither sits inside a document-type standard, since `prose.md` does not govern a scan and `skill.md` does not govern a slug transform.

The scan carries two checks under one citation, characters and phase labels, with the rules themselves held by `prose.md` and `versioning.md` beside it. A skill citing the scan gets both without naming either file, which is what keeps a new check from costing an edit in every consuming body. The label check scopes by destination, so `claude-diagram` cites the same standard and takes the character half alone.

Both are stated generally, and neither names what enforces it here. An installed standard belongs to the project that installed it, so a standard citing this repository's audit hook, scratch paths, or output filenames goes wrong in a target that has none of them, with nothing reporting it. In this repository the scan covers text the hook never reaches, meaning `.claude/.tmp/`, anything leaving through `gh`, and anything inside a fence, and that belongs here rather than in the file that ships. Each citing skill names its own gap for the same reason, since the gap is a fact about the skill.

They live in `standards/` rather than `standards/bundled/` because the fan-out serves format references a skill consults while holding still, and these are procedures a skill executes mid-run. A citation resolves through the same two paths as any standard, so a target's own copy still wins. The fan-out was left untouched, so neither mechanism replaced the other.

The split between the two surfaces is what keeps the citation honest. The standard owns the procedure and the body owns the trigger, since both the moment a scan runs and the text it runs against vary per skill. The empty-branch case splits the same way, carrying three legitimate answers across the catalogue: fall back to `latest`, stop, or fall through to another source. A body that cites without stating its own case reads as if the default applied to it.

Nothing detects a body that restates a procedure instead of citing it. `assert_no_drift` covers generated copies and a hand-written restatement is not generated, so the guarantee is only that a single definition exists to correct.

### Redundancy audit

Five toolkit skills were compared against community counterparts. All five are kept and one took a borrowed section.

- `aitk:systematic-debugging` vs `obra/superpowers/systematic-debugging`. Same methodology. Ours is 71 lines to their 296, capturing the four phases, circuit breaker, and red flags in a prose-tight form that matches toolkit conventions. No borrow.
- `aitk:claude-review` vs Anthropic's `code-review` plugin. Different scopes. Ours runs on a local branch diff and reads four project docs. Theirs runs on a PR URL with multi-agent fan-out and posts inline comments via GitHub MCP. Added a high-signal filter section borrowed from Anthropic's framing to sharpen severity judgment.
- `aitk:claude-ux-audit` vs `impeccable`'s `/audit` and `/critique`. Different lenses. Ours enumerates UI surfaces to find missing states, edge cases, and inconsistencies. `/audit` scores technical quality across five dimensions and `/critique` scores design with Nielsen heuristics. They compose, so run `claude-ux-audit` first to find gaps, then the `impeccable` commands to polish what exists. No skill body change, because third-party skill references belong in this catalog rather than in a `SKILL.md` body.
- `aitk:claude-feature` vs the `obra/superpowers` planning skills `brainstorming`, `writing-plans`, and `executing-plans`. Different slots. Ours reads the full `.claude/` doc set and produces a structured plan at a coarser grain than the task-atomized `writing-plans`. Plan mode and Ultraplan are positioned separately in Built-in vs toolkit features below. No borrow, since the approval gate between plan and implement already covers the clarification case `brainstorming` handles upfront.
- `aitk:claude-groundwork` vs `obra/superpowers/brainstorming`. Closest external analogue, different output. `brainstorming` is an upfront clarification conversation feeding straight into a plan, so its product is a better-specified plan. Groundwork produces a durable numbered folder of measurements and rejected options that can legitimately conclude in doing nothing, and it runs before a plan is warranted rather than while one is being written. No borrow.

`wiki/claude-skills.md` covers the Claude Code skill feature itself, and `docs/visual-design-workflow.md` is the worked example of per-workflow skill recommendations.
