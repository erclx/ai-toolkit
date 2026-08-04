---
title: Audits
description: The context audit, the skill audit, the comment census, and the board validator, the four commands that measure rather than install
---

# Audits

`aitk context audit`, `aitk claude skills audit`, `aitk comments scan`, and `aitk tasks validate` are the commands that read a tree and report on it instead of writing into one. None installs anything, and two checks across the four gate a push, so what each measures and what it refuses to fail on is the decision worth carrying here.

Both split their engine by reason to change rather than by size. `src/comments/` separates the counting pass (`scan.ts`), the history sampler (`trend.ts`), and the vocabulary loader (`vocabulary.ts`), because counting, sampling, and rule reading are three reasons to change. `src/context/` separates the folder contract (`folders.ts`), the structural measures (`audit.ts`), cited-path resolution (`citations.ts`), and index-to-sibling comparison (`index-drift.ts`), because the contract, the checkpoints, the exclusion set, and the catalog format each move on their own and only `citations.ts` gates anything.

## The context audit

### What gates and what reports

- One check out of `aitk context audit` gates `bun run check` and the rest report. Citation resolution has no false positives and a silent failure mode without it, so it earns a stage. Every other measure is a judgment a reader settles, and a push failing on one of those teaches contributors to route around the stage. Apply the split to any later check: gate on a fact, report a judgment.
- `--gate` widens the failing set to required sections and index drift, and the seed stage is its only caller. What moves a finding across the line is the corpus rather than the measure. A context entry in a live project is edited under time pressure by the people who own it, so a threshold there reports. A seed is authored once and read by every scaffolded project, so the same finding ships outward and gates. The thresholds that measure distance stay advisory under both, since no corpus makes a judgment into a fact.
- `verify.sh` invokes the CLI as `bun src/cli.ts`, never as `aitk`. A globally installed `aitk` resolves to the main checkout no matter which worktree is running, so the gate would measure the wrong tree and pass a branch whose own citations are broken. This is the first stage in that script to depend on TypeScript at all, which is why every stage above it is still pure bash.

### Folder scope and resolution

- The audit's folder scope is a named list rather than the index-plus-entry contract read off disk. `.claude/standards/` satisfies the contract too, and auditing it would measure the consumed copy of `standards/` against a rule written for per-domain narrative. `--folder` admits another folder without an edit, which is the escape hatch the contract reading would have given for free.
- A folder name resolves under `.claude/` first and at the project root second, which is what puts `docs/` in reach of the same engine. A sibling command measuring the same things against a different root would put one behavior in two places. `--folder` stays a name rather than a path, since a path invites `../../elsewhere` and the audit's scope is corpora inside the repository.
- The root base is opt-in through `canResolveAtRoot`, which only `--folder` sets. Applying it to the default list too was the first shape, and it audited any target holding a root `context/`, `diagrams/`, or `wireframes/` against a standard that target never adopted, on a bare run naming nothing.
- A root folder is measured and stays out of the citation scope, since the pattern spells the `.claude/` prefix. Widening it to a bare `docs/x.md` would match prose referencing nothing. A run with no `.claude/` folder says the check is out of scope, and refuses under `--citations-only`, because a gate exiting clean on a scope it could not build is the failure it exists to catch.
- Which measures reach a folder is decided by whether the rule behind them generalizes, not by whether a standard claims the folder. Length, depth, and the catalog-table scan are judgments about how far a reader travels and report wherever the audit is pointed, `docs/` included. Required sections, provenance, and bullet weight narrow to the folder `standards/context.md` claims through `governsContent`, and citation resolution keys on the `.claude/` prefix. No standard claims `docs/` and none needs to, since a folder opting into measurement reads the output without a rule to cite.
- A run where no requested name resolves refuses, whichever list it read. Naming the absent ones is what narrows to a name passed by hand, since a project carrying one of the three default folders is ordinary and warning on the other two every run would train a reader past the scope line.

### Which unit answers a measure

- Required sections are the first measure that cannot decide from one entry, so the judgment sits in `missingSections` beside `measureFolders` rather than widening `measureEntry`. Which unit answers is what `nested` on `AuditedFolder` decides.
- Four domains here split across a folder and describe one domain between them, so any sibling answers and the finding names the folder. Entries of the folder named under `.claude/` are one domain each and answer for themselves. Rolling every folder up was the first shape, and it let one entry stand in for thirteen domains beside it.
- A heading at any level satisfies a required section, since those split domains carry the overview as the `#` title and an `##` under it would repeat the filename. The check reports rather than gates by default, the closer call since a missing section reads as a fact. The standard sanctions omitting `## Layout` from a domain owning no paths, and no measure separates that from an entry that forgot it.
- That sanctioned omission is what the `stub: true` frontmatter field answers under `--gate`. A file declaring it is dropped before the check and reported nowhere, and both seed install paths strip the field so no target receives it. The exemption is scoped to this one measure, since a skeleton is exempt from owing sections rather than from being well formed.
- Bullet weight is a reported judgment and narrows to `.claude/context/` the way the provenance marker does. The peer-list checkpoint split a bimodal corpus while this one cuts a smooth decay, so the number is a judgment. The remedy is what scopes it: moving an incident out of a bullet needs a decision to keep, and a diagram entry declares none.

### How the measures count

The length and depth measures both count rendered lines at 80 columns, and the peer-list exemption keys on average bullet weight rather than on bullet count. Entries are authored one line per bullet, so a block of fifteen paragraph-bullets occupies fifteen source lines and renders past sixty, while a flat catalog of one-liners and a stack of paragraphs reach the same count and read nothing alike. Neither half of the depth fix works alone, since weight without the rendered measure leaves a short heavy block silent and the rendered measure without weight reports the catalog.

The depth check exempts two run shapes for opposite reasons, and only one of them is about navigability. A peer list is excused because it is already skimmable, and a table because the checkpoint's remedy does not exist: a heading dropped inside one splits the table rather than the run. The exemption tests whether the run is a table rather than whether it holds one, so a table between paragraphs still reports and a heading breaks it at the seam. It applies to both corpora, which cost one finding in `docs/` and none in `.claude/context/`, where no table currently forms a run past the checkpoint.

The two checkpoints share a unit because they sit in one section of the standard and a reader compares them, so `renderedHeight` serves both rather than length keeping a source count of its own. Their exclusions still differ, since the run measure skips a fence so an example cannot break the run around it and the file measure has no run to protect. Excluding fences from the file measure was weighed and dropped, because the corpus entry it would serve runs 20 percent fenced and stays past the checkpoint either way. Nothing here sets a line width, so each section's legend states the one the report used rather than leaving the number unreproducible.

## The skill audit

`aitk claude skills audit` measures both skill corpora against `standards/skill.md`, gating on one check and reporting six, which is the split the context audit set. Requirement presence is the fact and the rest are judgments. The gate exists because the standard required `REQUIREMENT.md` with nothing reading the rule, the shape three open issues already record.

Every measure traces to a stated line, so the report carries no rule of its own. Tracing each `Must` to a stated gap is the rule in that standard worth the most, and it needs a verdict per skill, so it is named as unmeasured rather than approximated by a count. The report names its blind spots on every run, since a list of what passed reads as a verdict on the whole standard.

The audit reads raw frontmatter rather than `listSkills`, which prefers the folder name over the declared one and can never surface a disagreement between them. The two also resolve their root differently. The listing reads its own install root and the audit reads the cwd, which is what lets a branch be measured by the checkout running it.

The first run found nothing, which is the expected outcome rather than a broken check. Every mechanical rule passed across both corpora the day it shipped, so its value is the regression it stops. A preventive check reads as broken unless the report states what it measured.

## The comment census

- `aitk comments scan` is the first command that parses the target's own source, a new capability class rather than another domain. Reading user code inherits problems no other command has: language detection, comment syntax per language, and literals that look like comments. The surface is held to two languages, line-oriented, no AST, so it stays a counting tool rather than becoming a parser.
- The counter is validated against a measurement taken by hand before it existed. `src/comments/trend.test.ts` replays the commits that measurement recorded and asserts the TypeScript series exactly. The replay skips rather than fails when the commits are unreachable, since CI checks out at depth 1.
- Absent and empty are distinct states for the degradation vocabulary. A sweep with no terms finds nothing, and reporting that as zero hits claims a codebase is clean when nothing was looked for. Rule discovery anchors on a `## Degradation vocabulary` heading rather than a filename, because governance rules are numbered and a renumber would empty the list while the sweep kept reporting clean.
- Case sensitivity for a vocabulary term is derived from the term rather than from a second list. A term carrying an uppercase letter is a marker convention (`TODO`, `HACK`) and matches exactly, while an all-lowercase term is prose (`used to`) and matches either casing. Matching `FIXED` case-insensitively would hit every comment containing the word "fixed".

### Recomputing rather than storing

A measurement that is a pure function of a tree is recomputed from git rather than stored. A ledger needs a schema, drifts from what it claims to measure, cannot answer a question nobody thought to store, and gives a target project nothing on the day it installs. Recompute works retroactively against history that already exists, which is what lets the trend arm replay commits from before the command existed.

The boundary is that this only holds for tree-pure metrics. Which author or session wrote a comment is not recoverable, and adding it would silently make the whole arm dishonest.

The replay is also what found the hand-recorded bash figures unreproducible, which is a finding rather than a test failure. The line totals replay exactly, so the file set is confirmed and only the comment method is lost, while the recorded comment figure matches no file set the command can construct. That is the argument for the command in one line: the figures nobody could repeat are the ones produced by hand.

## The board validator

- `aitk tasks validate` measures a corpus that is gitignored per-machine scratch, which is what keeps it off `bun run check` and off every hook. There is no shared moment to hang it on, so the sweep runbook in `claude/skills/claude-orchestrate/references/orchestrator-sweep.md` calls it at the moment the readiness claim is actually made. `src/tasks/validate.ts` parses and checks while `src/commands/tasks.ts` renders, the same split `archive.ts` already uses beside it.
- Board columns are read from each table's own header rather than by position. Three of the surfaces this repository ships reach a target, and a board laid out differently has to be reported for what it lacks rather than have its second cell read as something it never was. A heading outside the three the standard fixes yields no group at all, which refuses instead of reporting a clean board nothing parsed.
- An absent `Touches` column and an unreadable one are one finding, not two states. Reporting only the second passed a `## Run now` table declaring no file set, which is the shape where the collision check silently tests nothing.
- A backticked span counts as a path when it holds a slash or ends in an extension opening with a letter. The letter is what separates `commands.md` from a task version like `v40.2`, since reading the version as a path collides two rows that merely cite the same task.
- `RESERVED_STEMS` moved out of `archive.ts` as an export and gained `session`, so the two verbs cannot count a board sibling as a task the other does not. It is also what keeps the one-to-one mapping check from reporting `session.md` as a task carrying no row.
