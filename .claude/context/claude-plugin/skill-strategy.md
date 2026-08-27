---
title: Skill strategy
description: Where a plugin skill lives, the catalog command, the workflow against domain-knowledge split, and the redundancy audit
---

# Skill strategy

Plugin skills live in `claude/skills/` and are auto-discovered from the plugin root, whether that root is a marketplace install or a `--plugin-dir` pointed at a checkout. No registration needed, folder presence is enough. Each skill is a kebab-case folder containing `SKILL.md`.

Skills that perform a one-time structural move of an existing project into a newer toolkit layout use the `migration-*` prefix (`migration-claude-md`, `migration-context`, `migration-superseded`). Add new one-shot relocations to this family. Recurring reconciliation tools like `claude-seed-sync` are not migrations and stay outside it.

The family lost a member rather than drifting one: `migration-standards` relocated a root `snippets/` folder into `.claude/snippets/`, and once the snippets install channel closed alongside the standards one, that destination stopped being legitimate for either domain, leaving the skill no move left to propose. The retirement runs by hand across every target still holding a root `standards/` or `snippets/` tree, dropping the installed copy and repointing citations at `aitk standards <name>` or the plugin's live snippets symlink. A backlog task files that gap rather than closing it here. `setup-init` still names its remaining siblings under `Out of scope` and still invokes `setup-verify` as chain step 4, so the setup-chain admission holds unchanged.

## The catalog

`aitk claude skills list` is the catalog. It reports every folder under `claude/skills/`, `--names` emits those names one per line for a shell caller, and `aitk claude skills list --json` returns the set as objects carrying `name`, `description`, and `requirement`. A session looking for which skills exist runs the first, and one looking for what a skill claims to do runs the third.

These entries hold the reasons instead: why a skill exists, where its boundary against a sibling sits, and what a coverage verdict turned on. None of that is recoverable from a listing, and the roster is recoverable from nothing else.

A hand-written copy of the roster stood here and drifted the way `.claude/standards/context.md` predicts, describing two skills the plugin had already stopped shipping. That standard puts a catalog a `list` command already returns under what does not go in, and says to link the command so the entry cannot drift from it.

## The consumer map groups by phase, and its table is the corpus

`docs/ai-workflow.md` carries the when-to-use map, and the `## Skills` table under it is what a coverage claim is measured against. Groups run in the order a project meets them, from setup through building, checking, and shipping to the pull request and the toolkit-sync relationship. The last two hold what serves no single moment: one for artifacts generated on request, one for skills answering a question at any point.

Naming the map rather than the table leaves the claim open, since mentions elsewhere in the file reach further than the table does. Measured on 2026-08-14 against the shipped folder listing, the table named 19, every mention in the file reached 24, every consumer doc reached 35, and adding `docs/agents/` gave 37. An outcome saying every skill appears is four claims until one block is named, so the table is the block and coverage claimed anywhere else does not count toward it.

The groups derive from the scenarios above the map reconciled against the lifecycle `docs/target-projects.md` describes, rather than a third vocabulary beside those two. Each skill takes exactly one row, so a reader scanning a group reads a set rather than a sample, and a skill honestly serving two moments sits at the earlier one. The map carries no total, because the count moves whenever a skill lands.

Nothing checks that the table still covers the corpus. `aitk claude skills list --names` reports the set and the comparison is a person's to run, so a skill added after this pass reopens the gap with nothing reporting it. That check belongs beside the other catalog commands rather than inside a doc rewrite.

## Workflow skills and domain-knowledge skills

Skills split into two categories by function. The toolkit owns the first and installs the second, and mixing them is the most common source of skill bloat and maintenance drag.

Workflow skills wrap how this toolkit operates: groundwork, planning, review, shipping, debugging, git, and governance install. They are thin, opinionated, and specific to the author's process.

Domain-knowledge skills encode expertise curated over many hours, such as frontend design anti-patterns, security audit patterns, and industry-specific UI rules. The wider ecosystem supplies those as `frontend-design`, `impeccable`, `ui-ux-pro-max`, `taste-skill`, and `trailofbits/skills`. Curation is the whole value of the second kind, so forking one means inheriting the cost of maintaining that curation against an upstream that keeps moving.

| Location                         | Purpose                                                | Scope  |
| -------------------------------- | ------------------------------------------------------ | ------ |
| `claude/skills/`                 | Workflow skills, installable into target projects      | Shared |
| `.claude/skills/`                | Toolkit-internal authoring skills, the `aitk-*` family | Local  |
| Target project `.claude/skills/` | Per-project customization not worth upstreaming        | Local  |
| `~/.claude/skills/`              | Global user skills active across every session         | User   |
| Plugin marketplace               | Community and official plugins installed via `/plugin` | User   |

Which location is right follows from who benefits.

- A commit style specific to one project stays in that project's `.claude/skills/`
- A commit skill the author uses everywhere goes in `claude/skills/`
- A frontend design anti-pattern skill maintained by a third party stays a plugin install

Forking has not been necessary in practice, and when one looks tempting a thin toolkit wrapper composing the upstream skill has met the need instead.

The rules this argument produces fire when a skill is being written, so they live in `.claude/skills/aitk-claude/SKILL.md` rather than here.

## Three entry points, split by what a question costs

`claude-intake`, `claude-groundwork`, and `claude-feature` are the front doors, and one question routes between them. Can the item be answered by reading the repository today? Yes goes to intake at the cost of a session grepping, no goes to groundwork at the cost of runs and days, and already-decided goes to the planning skill. The test runs per item, since a dump of forty findings typically holds one that needs measuring and routing the whole dump on its worst item buys a folder nobody can close.

Intake is a skill rather than a mode inside either neighbor. A mode gives one skill two purposes and its `REQUIREMENT.md` two subjects, which is the collision the requirement file exists to prevent. A snippet was the other candidate and carries no read contract, so it cannot orient against the board or measure against the tree, and those two steps are what the one run that exists turned on. Groundwork's qualifying guard refuses a breadth pass outright, so the guard now names intake as the destination rather than sending a refused dump to the planning skill.

Answering what a pass filed is a second skill rather than a mode on the first, on the same argument that made intake its own front door. `claude-intake-answer` walks the unread slots in batches and lands each selection through `aitk intake answer`, and it carries `disable-model-invocation` so routing never reaches for it mid-flow. A pass that files a dump and answers it in one run decides items on silence, which is the contract inversion the folder exists to hold.

The write is a verb rather than a body instruction because every worker runs in a linked worktree, where the file-editing tools refuse a main-root path and the stream editors this repository bans are what a shell route would reach for. That is the same constraint behind the task record verbs. One call carries a whole cluster, since concurrent calls against one file race on the read and keep only the last answer.

Building the verb measured a format fact the standard had not stated. A pass that splits a finding after the fact labels the halves `3a` and `3b` rather than renumbering the file, and a parser accepting digits alone drops those items with nothing reporting the gap. Four items in one cluster of `toolkit-overview` sat in that shape, so the label is a string carrying an optional suffix and the standard now says so.

The pass that produced the skill also measured the ratio. Of 58 items carrying a verdict, exactly one qualified as groundwork, and the eight that resolved to already-settled are the output neither neighbor has anywhere to put. One convention was dropped rather than lifted: an empty operator slot in an intake folder means unread, where a plan file's blank answer means accept. A plan is read in one sitting and an intake folder is read over weeks, so silence there is far more likely to mean nobody reached the item.

## What a skill carries

A file a skill body cites has to arrive by the channel the skill itself travels on. Skills load live from the plugin root while standards, snippets, and governance rules are copied by an `aitk` command, so a body naming an installed path is a dependency crossing that boundary and resolves only for a project that ran the matching install. Nothing reports the break, because an unresolved path produces no error until a session opens it.

The three orchestrator runbooks settled the rule. They were snippets cited by `claude-orchestrate` as `@.claude/snippets/claude/<name>.md`, and they now sit in that skill's `references/` cited with `${CLAUDE_SKILL_DIR}`, which resolves from any working directory in any target. What this narrows to is a test on readership rather than on topic: a file one skill reads ships inside it, and a file several surfaces reach stays in the catalog that publishes it.

The test cuts both ways. `claude-groundwork` and `claude-intake` each carried their folder format in `references/folder-format.md`, and both folders are edited by sessions that never invoked the skill, so those two moved out to `standards/groundwork.md` and `standards/intake.md` with a rule routing each path.

The cost is the typed entry point, which is the part worth knowing before moving anything else. A person fires a snippet by typing its path and cannot type a reference, so a runbook whose moment the loop cannot detect has to be reachable some other way. An invocation word looks like the answer and is banned by `.claude/standards/skill.md`, which turns down a flag that selects an alternate flow because the model misreads it and runs the vanilla path, and a handoff that silently does not happen is lost at the next compaction.

What replaces it is a body that routes a plain request to the runbook serving it, leaving one flow with no flag in it. `claude-orchestrate` does this for both compaction sides, while the sweep needs nothing because the loop already reaches it.

Which surface holds an invariant follows the same test, run against the failure rather than against the topic. A path-scoped rule loads when a session opens a file matching its glob, so it reaches what goes wrong inside a folder and never reaches a write that escapes one.

`claude-intake` carries both kinds: its write scope is a floor about paths outside `.claude/intake/`, which no glob over that folder can see, while its item format and answer contract are exactly what a rule would catch in a session editing the folder with the skill unloaded.

Only the second kind is a rule's to hold, and `.claude/standards/rule.md` has a rule point at the standard owning a document-type convention rather than restate it, so the second kind waits on a standard that does not exist. Writing one beside the skill's bundled reference would make two sources for one text, which is the shape `.claude/ARCHITECTURE.md` turns down, and `claude-groundwork` carries the identical split, so the pair is one queued change rather than two.

Routing through the body moves the failure rather than removing it, and a skill carrying `disable-model-invocation` has to say so. The routing is only in play while the body is loaded, and a long session approaching a compaction is the likeliest place to have dropped it, which is the same moment the runbook exists for. A body that stops at the routing leaves the request landing as ordinary conversation with nothing reporting the miss, so it owes two recoveries: re-invoke the skill, and name the runbook paths so a reader can open one with the skill unloaded.

## Two surfaces on one rule, split by reach

The judgment-call rule in `CLAUDE.md` states two branches and each branch owns a surface. A call the session can weigh takes a pick carrying its tradeoff in one sentence, which `snippets/decision-help.md` shapes. A call whose answer turns on the operator's preference goes through the structured question surface, which the same file states generally and which reaches every session rather than only an invoked one, and `decision-escalate` layers batching over that statement so several open decisions arrive in one turn rather than one question each.

The two overlap in subject and never in reach, which is what keeps both on the shelf. A snippet is copied into a project by a CLI command and runs in a chat with no repository behind it, while a skill loads live from the plugin root, so a project that added the plugin and installed nothing reaches the skill alone. Reaching it without an install is the property the escalation branch needed, since a session hits that branch mid-run inside a repository.

`decision-escalate` carries `disable-model-invocation: true`, joining the five skills that already do, so nothing routes to it on a description match and the operator is what fires it. The body tests the surface rather than naming a vendor's tool or reading the project's instruction file, which keeps one body running where the structured tool exists and where it does not. Gating on the instruction file was tried and reaches no installed target, since the rule ships in the seed and a seed reaches a project scaffolded after it.

## The interface pair splits on the act rather than the subject

`claude-ux-audit` and `claude-ux-measure` share a subject and differ on what they do to it. The first reads source and reports judgments against stated intent, the second starts the thing and reports numbers against published thresholds. A search across the shipped skills, the standards, and the tooling configs for the vocabulary of browser auditing returned five matches on 2026-08-14, every one a false positive, so the second act had no surface at all and the question landed on whichever skill matched the word "UI".

Folding the measurement into the audit was the obvious alternative and its own guard rules it out. That skill stops when it finds no interface source to read, which is a condition a running interface does not satisfy, so the host would refuse the request before reaching it. Each body therefore declines the other by name, since a boundary stated on one side alone is never checked against the skill on the other.

Contrast stays with the static reader against the pull of the runtime one. Two color values compute it and the audit already reads the token table holding them, so moving it buys a browser start for an answer arithmetic gives. What that costs is a contrast failure from a color computed at runtime, which is invisible to a token-table reader and is accepted rather than overlooked.

The runner is detected rather than prescribed. The operator settled on 2026-08-14 that the harness differs per project, which removed the blocker this item first carried, being the need to name one project and lift its configuration. The surface owns the metrics and the thresholds, which are portable, and reads the project's choice of runner, which is not. Detecting nothing therefore reports what the measurement needs and stops, the same absent-key rule `toolkit-operator` already follows, since a stop there says the project has not chosen a runner rather than saying the skill is broken.

The front door reaches it through the audit offers, which now carry five rows. Four are `aitk` verbs and this one is a skill handoff, so the execute contract governing a CLI run does not reach it. Its second condition is a browser harness, which the front door does not test, because the skill detects that already and a second reader of the same fact answers stale.

## The teaching surface sorts by what the reader is doing

`claude-teach` runs a learning workspace on one subject across sessions, and it is the sixtieth skill. It sits beside the wiki rather than against it, because the two sort on independent axes: a workspace sorts by what the reader is doing, learning rather than looking up, and the wiki test sorts by who owns the subject. A workspace on how a system measures pronunciation accuracy and a workspace on how a feature is implemented here are the same surface with different subjects, which is why the wiki test needs no amendment.

The name is measured rather than chosen. No skill in the catalog is a single word, and every skill owning a record folder under `.claude/` takes that folder's name behind the `claude-` prefix, which `claude-groundwork`, `claude-intake`, `claude-tasks`, and `claude-diagram` all follow with no exception. A workspace at `.claude/teach/<nn>-<topic>/` therefore names its skill `claude-teach`. It carries `disable-model-invocation: true`, so opening a workspace is the learner's call rather than a description match.

The output splits by lifetime and the format follows the split. A lesson is worked through once, carries a quiz with immediate feedback, and is never committed, so it is markup. A reference page is looked up later and is the half a promotion pass would move into a gated corpus, so it is markdown and passes those gates the day it is written rather than at the moment someone tries to promote it. Authoring both as markup was the source's own choice and it puts the promotable half in a format no stage reads.

The durable half leaves through a promote step in the same skill, sorted by who owns the subject rather than by what the reader was doing. That is the wiki test unamended, so an outside subject goes to the wiki, an internal one to the matching context entry, and consumer-facing material to the public docs. The step proposes and waits, and it writes nothing to a destination: a confirmed page lands in `.claude/.tmp/teach-promotion/<slug>.md` and `claude-docs` folds it in from a branch, which is the handoff shape `claude-memory-capture` already runs. The file is a sibling of the routed-facts one rather than the same file, because that one is deleted by whichever pass folds it and a third writer on a destructive reader loses another producer's unread work.

Two things carry a cost worth naming. The step is the first caller of the wiki scaffolding verb, which a closed track recorded as creating a folder nothing read, and it refuses rather than scaffolds when a project has no wiki, so the verb stays the operator's call. The fold reaches the public docs corpus, which `docs-sync` otherwise owns, and the carve-out is narrow: `claude-docs` lands a page whose destination is already confirmed and reconciles nothing there against a diff.

The rendered layer is the half a session works through rather than consults, and two of its rules moved out of the body into code. Quiz option order is drawn by `aitk teach lesson` rather than instructed, because the source this design departs from reports answers defaulting to the first option while its stated mitigation addresses a formatting leak instead, so porting the instruction ports the defect. The same verb reports the numbered path the lesson takes, the shared stylesheet with whether it is on disk yet, and the mission's success lines, which is what turns those lines into exit criteria a session reports progress against rather than a list nothing reads.

The verb writes nothing, and the stylesheet is the reason. Every lesson after the first links what the first one wrote, so a verb that wrote the file on each lesson would discard what the last one added. Reporting `stylesheetExists` puts the write on the one lesson that needs it and leaves the rest linking.

What the split cannot close is that the body is still free to reorder what the verb reports. The sandbox arm for this layer asserts the ordinal, the link, and the stylesheet, and the ordering is a property over many runs that one arm cannot see, so it is recorded as manual rather than claimed.

## The writing surface is a skill because nothing reads a standard nobody opens

`write-human` carries voice, rhythm, sentence construction, and information density, and it is the sixty-first skill. Those rules sat in `standards/prose.md` beside the word bans, where the bans were read by a command and the voice half was read by whoever opened the file, which was nobody. The standard is retired: the bans, the spellings, and the frontmatter wording joined `markdown.md`, and this skill took the half no check settles.

The name follows the job rather than the medium. `prose` names what is being written and every other candidate named the defect, where the job is removing machine tells and putting a person back into the writing. It is model-invocable, unlike the eight bodies carrying `disable-model-invocation`, since each of those is a workflow a person starts and this is guidance a session should reach for mid-draft.

Delivery is what makes it different from what it replaces, and the rule is the load-bearing half rather than the body. `500-prose` fires on every markdown edit and carries an explicit instruction to load the skill, so the guidance arrives on a glob match. A skill reachable only by description match reproduces the defect it was built against.

Three references hold what a body cannot. `machine-tells.md` is a diagnostic catalog behind a stated trigger, so a short original draft pays no read for it. `density.md` splits what a compression pass may cut from what it may not, which is the layer a terse register has no answer for. `source-material.md` records what was adopted from outside and what was declined, including the ban on abstract metaphor nouns: `surface` alone appears 593 times in tracked markdown at `57ee7467`, so adopting that item rewrites the corpus or is ignored in silence.

What stays open is the same gap `claude-teach` records about option order. Cadence is a property of a passage over many sentences, nothing compares the output against these rules, and the sandbox arm therefore carries its rhythm claims as manual entries rather than asserting them.

## The restatement surface is asked for by name, which is what separates it from its two neighbors

`restate` takes a dense answer or a named markdown document and returns the plain version, and it is the sixty-second skill. The operator asked for it directly after a thread on writing quality ran abstract and a plain restatement of that thread read better than the thread had. Neither neighbor covers the request: `write-human` governs a passage being drafted or revised and arrives on a markdown edit, and `aitk markdown audit` reports sentence spread and repeated openings from package data. One writes and one measures, and a reader who stopped to decode an answer is served by neither.

The task filing this row argued from an asymmetry that has since closed, and the row survives on the request rather than on the argument. `standards/prose.md` was retired into the `write-human` skill with `500-prose` routing every markdown edit to it, so the voice rules do reach a reader now, and `src/markdown/structure.ts` carries a cadence measure against a stated range. Writing the body from the recorded finding would have argued for a check that already ships.

The name is the decision the row owns. `simplify` is the obvious pick and is a built-in whose subject is code cleanup, so taking it makes a description match ambiguous even though the slash form disambiguates. `plain-language` describes the output where the skill is named for the act. Model invocation stays on, unlike the eight bodies carrying `disable-model-invocation`, because the ask arrives in ordinary words far more often than as a command, and the description bars the one case the task forbade: the skill never fires on the model's own opinion of its own output.

The body writes no file. A restatement is read once to reach a decision, and rewriting a document into a file is a proposal against the source rather than a restatement of it. That keeps the arm's mechanical half small, since what it can assert is that the tree was left alone and the reply named the source path and the `Cut:` label. Whether the plain version kept the deciding half is the judgment the skill exists to make and nothing checks it, so every claim about the content sits under `manual` rather than being padded into the count.

## The proposal surface is a recombination, not a new design, and it is the sixty-third skill

`claude-markdown-propose` closes a gap three shipped surfaces sit beside without covering: nothing here drafted a markdown replacement, carried an answer slot, and waited. `claude-standards-audit` maps changed files to standards and reports, ending on its own description, `Do NOT fix violations. Reporting only.` `aitk markdown audit` measures bans and structural checkpoints from package data.

`claude-review` reports findings on a diff someone already wrote. All three report. None drafts, and none waits for an answer.

The skill is a promotion from two target-project files rather than a written-from-scratch body, argued in `.claude/intake/40-folders-canon-and-target-sync/08-promotion-candidates.md`. Its phases are `content-audit`'s five passes, generalized off the concern table down to what describes a governing document rather than a person: inflation, staleness, contradiction, and duplication survive the strip, and register drift does not, since this repository's docs carry no spoken-versus-written split for a word to drift across. Duplication is the one with a live shipped instance to point at, `8e5ea481`, which counts an instruction stated on more than one surface.

Its answer contract is `claude-intake`'s `You:` slot rather than a new one, chosen because it already ships toolkit-wide with the same empty-means-unread rule this surface needs. The plan file's blank-means-accept contract would read the wrong way on a folder read over days rather than one sitting.

The folder is `.claude/proposals/<slug>/`, one letter from `.claude/audits/`, which already exists and holds `baseline.json`, generated data rather than decision state. Singular and plural read as the same word at a glance, so the promoted folder takes a name that says what it holds instead of leaning on the distinction nobody reads correctly. `src/records/backup.ts` carries it in `BACKED_FOLDERS` on the same argument: a proposal carries an unanswered decision, and the folders in that list are the ones a disk loss would take rather than regenerate.

What the promotion strips is two thirds of the source body. Its `## Surfaces` fence named five `career/` paths and its `## Concerns` table graded three files as sources of truth by name, both of which the behavior rule on encoding a fix forbids carrying through. The promoted body takes the concern and the surface as invocation inputs instead of constants, which is what lets a second concern reuse the skill rather than fork it.

The format spec that would ordinarily be a standard, on the pattern `standards/teach.md` set for a workspace shape, stays inside the skill's own `references/format.md` instead. The source project split the same shape into `.claude/standards/project/audit.md`, cited by one skill and read by nobody else, and this repository's own citation rule already says a file only one skill reads ships inside it rather than into a corpus a second reader would have to find. Adding a standard here would be that split rebuilt for a readership of one.

A sandbox run against a two-file fixture, one claim correctable from a source in the tree and one requiring an invented replacement, measured three passes at 18, 41, and 12 turns before the arm's declared ceiling settled above the widest. The spread was real rather than sampling noise: one run spent its extra turns rewriting banned punctuation out of its own draft, which is a cost the fixture itself does not vary.

The variant count, three labelled bets on the invented change against one replacement on the corrected one, held across every run once the format reference stated `### N.` for a change and `#### A/B/C` for a variant explicitly. An early run had written changes at `##` and skipped a heading level to reach them.

## Whether a skill earns its place

The redundancy audit below runs outward, against community counterparts. Nothing ran inward, against the catalog's own two zero-cost tells, until this section: a folder wrapping something already reachable, and a folder nobody calls. `create-skill` now asks the first two before a folder exists, and `570-skill.md` carries the same check for whatever creates a `SKILL.md` some other way.

The third question, whether anything invokes the skill beyond the author typing its name, has no answer at creation time. It ships in the skill's own `REQUIREMENT.md` as a review criterion, read against the census below rather than gated on up front.

The test has a shipped precedent. `fae01783` (pull request `#516`, merged 2026-05-21) dropped `git-stash` for wrapping a single git command that needed no skill body, and `release-changelog` for being low-frequency and invoked by no other skill. Those two sentences were the test, applied once, and stated only in the commit body until this entry.

### The census

Two records answer usage, and both are per-machine readings rather than repository facts: a typed-prompt history of 20,105 entries spanning 2026-02-28 to 2026-08-21, and 496 of 747 tool-level transcripts carrying a skill call, spanning the narrower window 2026-07-27 to 2026-08-21. Both cover the whole machine, 95 project folders across eight repositories, splitting 410 toolkit, 163 target-project, and 173 harness on the transcript side and 2,664 against 1,968 on the typed side, so a skill's zero is not an artifact of measuring the wrong tree.

Folded together, ten of the sixty-one skills shipped as of the typed history's close on 2026-08-21 score zero and eight more sit at one or two. Read the denominator as dated rather than standing, since a skill landing after that close scores zero in both records without yet belonging to a stale count.

### The rename map

The first pass over the typed history undercounted, because seven skill folders carry a name their own transcripts never mention. Folding the old spellings in moved one skill from zero to eleven and lifted three more off the floor.

- `git-stash` and `release-changelog`: dropped rather than renamed, `fae01783` (`#516`), 2026-05-21
- `init-project` → `setup-init`, `gov-install` → `setup-gov`, `indexes-install` → `setup-indexes`, `verify-scaffold` → `setup-verify`: same commit as the drop above
- `operator` → `toolkit-operator`: `e94c6951` (`#528`), 2026-06-11
- `claude-context-migrate` → `migration-context`, `claude-standards-relocate` → `migration-standards`: `261b3da2` (`#546`), 2026-07-03

Every rename lands before the transcript window opens on 2026-07-27, so the tool-level record never carries an old spelling and the correction runs entirely off the typed history. `git log --diff-filter=R` over `claude/skills/` reports nine rename records against these seven. The other two are not a skill rename: `create-standard` and `create-snippet` swapped a shared `references/snippets.md` between them, which the rename detector reads the same way it reads a folder move. Take the count from the seven names, not from either number a raw `git log` or an untraced dump reports.

### The five bounds

- Sandbox and eval runs inflate anything with a test driving it. 173 of the 747 tool-level transcripts are harness rather than organic use.
- The tool-level record spans four weeks against the typed history's six months, so recent adoption reads lower there than it will once the window catches up.
- A skill body read by path, rather than invoked through the tool, writes no record in either corpus.
- A one-shot skill (`setup-*`, `migration-*`) can only ever score in the typed record, never the tool-level one, since every target it acts on was scaffolded before the transcript window opened.
- The census spans 95 project folders across eight repositories on one machine. It is a reading, not a repository fact, and does not reproduce on a second machine or a second pass.

### What the census cannot count

A zero or a near-zero above is not the same as nobody reaching the skill. Six score at or near zero here and are reached by something other than the operator typing its name: `create-rule` is cited by three sibling skill bodies, `setup-gov` and `claude-ux-measure` by two each, `migration-context` and `setup-verify` each carry a sandbox arm that exercises them with no typed invocation behind it, and `claude-teach` is named by a governance rule and by two docs. Read the numbers above as one input to a conversation about a skill's place. Read alone, they name a removal list nothing here endorses.

### The eight verdicts

This pass runs `create-skill`'s three questions against the eight skills item 2b of `.claude/intake/39-output-style-and-lean-tooling/05-skill-catalog.md` found cited by nothing but the consumer map: `ci-workflow`, `claude-slides-draft`, `create-standard`, `create-skill`, `create-snippet`, `git-issue`, `systematic-debugging`, and `toolkit-triage`.

Two of the eight fail the batch's own premise before a question ever applies. `claude-slides-draft` carries a sandbox arm, `scripts/sandbox/claude/slides-draft.sh`, exercising it under two scenarios the way `migration-context` and `setup-verify` do above, and the census that scored it zero never counted a sandbox run. `create-skill` is named by `570-skill.md`, a governance rule that fires on every `SKILL.md` or `REQUIREMENT.md` edit and tells the session to confirm its two creation-time questions were answered, the same shape as the `claude-teach` citation above it. Both move to the load-bearing group rather than the cited-by-nothing one.

### The six that hold the premise

Every citation found for the remaining six outside their own folder sits in a sibling's `REQUIREMENT.md` under `Out of scope`, or in a reference file under `Does not govern`, and neither loads at run time. `REQUIREMENT.md` is authoring context Claude Code never opens, and a `Does not govern` line states a boundary for the person authoring the sibling skill rather than routing a session toward this one. None of the six is reached by anything but its own name typed.

| Skill                  | Q1: something else reaches this moment                              | Q2: nontrivial procedure                                                                                                         | Q3: what the zero carries                                                                                                   |
| ---------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `ci-workflow`          | No                                                                  | Yes, emoji job naming, the two-minute granularity threshold, and bun-stack pinning are not derivable from first principles       | Zero across both records, one of the four skills the routing corpus never tested                                            |
| `create-standard`      | No. `aitk standards <name>` only reads a standard, never writes one | Yes, the meta-standard shape and the toolkit-root-versus-project-root write rule                                                 | Zero across both records, one of the four untested. A creation skill for a kind still authored                              |
| `create-snippet`       | No. No verb creates a snippet                                       | Yes, the dual-surface write path is the exact split `ARCHITECTURE.md`'s `SyncAdapter.projectSubdir` decision exists to get right | Zero across both records, one of the four untested. A creation skill for a kind still authored                              |
| `systematic-debugging` | No                                                                  | Yes, a four-phase methodology with a stated circuit breaker                                                                      | Zero across both records, no routing exemption, already kept once by the redundancy audit against its community counterpart |
| `toolkit-triage`       | No                                                                  | Yes, three-way issue classification with close-out linking back to the issue                                                     | Zero across both records, no routing exemption                                                                              |
| `git-issue`            | No                                                                  | Yes, `issue.md` formatting and the pre-publish scan before anything reaches GitHub                                               | Zero across both records, no routing exemption                                                                              |

All six keep. Removing needs the operator's own answer per `feature-skill-catalog-verdicts.md` question 2, and this pass ships verdicts rather than a removal. `systematic-debugging`, `toolkit-triage`, and `git-issue` carry the weakest question-3 evidence of the six, no sandbox arm and no seat in the four-skill set the routing corpus could not test, which is what a later removal pass should weigh first.

## Redundancy audit

Five toolkit skills were compared against community counterparts. All five are kept and one took a borrowed section.

- `aitk:systematic-debugging` vs `obra/superpowers/systematic-debugging`. Same methodology. Ours is 71 lines to their 296, capturing the four phases, circuit breaker, and red flags in a prose-tight form that matches toolkit conventions. No borrow.
- `aitk:claude-review` vs Anthropic's `code-review` plugin. Different scopes. Ours runs on a local branch diff and reads four project docs. Theirs runs on a PR URL with multi-agent fan-out and posts inline comments via GitHub MCP. Added a high-signal filter section borrowed from Anthropic's framing to sharpen severity judgment.
- `aitk:claude-ux-audit` vs `impeccable`'s `/audit` and `/critique`. Different lenses. Ours enumerates UI surfaces to find missing states, edge cases, and inconsistencies. `/audit` scores technical quality across five dimensions and `/critique` scores design with Nielsen heuristics.
  - They compose, so run `claude-ux-audit` first to find gaps, then the `impeccable` commands to polish what exists. No skill body change, because third-party skill references belong on this surface rather than in a `SKILL.md` body.
- `aitk:claude-feature` vs the `obra/superpowers` planning skills `brainstorming`, `writing-plans`, and `executing-plans`. Different slots. Ours reads the full `.claude/` doc set and produces a structured plan at a coarser grain than the task-atomized `writing-plans`.
  - Plan mode and Ultraplan are positioned separately in `.claude/context/claude-plugin/boundaries.md`. No borrow, since the approval gate between plan and implement already covers the clarification case `brainstorming` handles upfront.
- `aitk:claude-groundwork` vs `obra/superpowers/brainstorming`. Closest external analogue, different output. `brainstorming` is an upfront clarification conversation feeding straight into a plan, so its product is a better-specified plan.
  - Groundwork produces a durable numbered folder of measurements and rejected options that can legitimately conclude in doing nothing, and it runs before a plan is warranted rather than while one is being written. No borrow.

`wiki/claude/claude-skills.md` covers the Claude Code skill feature itself, and `docs/visual-design-workflow.md` is the worked example of per-workflow skill recommendations.
