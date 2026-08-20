---
title: Destinations
description: The test routing a standard to one home outside the corpus, the destination and purpose recorded per standard, and why the drop bucket came back empty
---

# Destinations

Records where each standard's guidance lives once the corpus stops being a folder a project holds. Every standard resolves to one home, which is a governance rule, a skill body, or the CLI. This entry decides and records. It moves nothing and repoints no citation, both of which belong to the sweep behind it.

## Decisions

### The test routes on what the standard governs, not on how many surfaces cite it

A standard already declares which branch it takes, in the first sentence of its own `## Scope`. A document-type standard names the backticked paths it governs, and an attribute standard says so and resolves to `*`. `read_applies_to` in `scripts/standards/list.sh` already parses that sentence for `appliesTo`, so the routing signal is measured rather than assigned.

- **A document type a project authors** goes to the governance rule that globs that document. The rule reaches the author while the file is open, which is the moment the guidance has to arrive. Seventeen have one.
- **An attribute with no document** cannot be globbed, so it goes to the CLI when a verb can compute or check it, and to the skills that run it otherwise.
- **A procedure only one surface runs** goes to that surface's `references/`, through the bundled fan-out.
- **Nothing reaches it** and it is dropped, with the readership recorded. The bucket is empty.

Readership decides nothing here on its own. It is the four channels the task carries, being a skill body, a governance rule, a CLI verb, and a seed, and a zero on one channel can mean well-routed rather than unread. `design.md` is cited by no skill in either catalog and is reached by a rule, a seed, and a context entry.

### The fan-out is a destination with a ceiling rather than a mechanism to reject

Copying a standard into each consumer's `references/` is the established route and six bundled sources produce eleven copies. It stays affordable while the consumer set is small and stops at roughly a handful, since `markdown.md` at 21 citing bodies and `slug.md` at 13 would each produce a copy per body, which is the duplication the fan-out exists to prevent.

Counting the bodies that cite a standard reads short of the set the move has to satisfy, which is what the `versioning.md` withdrawal below turns on. A bundled standard has no flat sibling and never installs, so leaving the flat root breaks anything still pointing at the installed path, and two of `versioning.md`'s readers are standards rather than skill bodies. Read the whole reader set, being the skills, the flat standards depending on it in-body, and any installed rule naming it, before calling a consumer count small.

### A verb is the home for a rule stated across every reader

One attribute standard lands on the CLI, which is `markdown.md`, whose ban sets and structural checkpoints ship as data in `src/markdown/`. Two more were recorded here on the same reasoning, that a transform and a scan are each a value a caller reads rather than a shape a caller writes, and both were withdrawn once the reasoning was measured rather than asserted. A closed list a check already walks earns a verb. A value every caller reads and no caller restates does not, because there is no duplication for the verb to collapse and the standard still has to state the rule for the reader.

## Gotchas

- The meta-standard's subject is the corpus this census is dissolving. `standard.md` routes to `591-standard-authoring.md` while standards remain a document type someone authors, and it is the one entry whose destination expires if the corpus does. Nothing detects that, because a rule globbing an empty folder reports the same as one globbing a full folder.
- A destination recorded against a carrier nobody has built reads identically to one recorded against a live carrier, and only the marker below separates them. Nothing now reads `to write`: two rules and one skill destination were built, and three were withdrawn into a section of their own so a reversal does not read as an arrival.
- `internal/standards/tooling-reference.md` is outside this census. It never installs into a target, so it has no corpus to leave, and `595-tooling-reference.md` already carries it.
- A destination is not an install channel. Recording a home for every standard leaves the folder in place and leaves it installing, so the outcome about nothing living only in an installed folder stays open until the sweep and the install removal behind it run.

Removing a skill from a bundled standard's `consumers` field leaves the copy already sitting in that skill's `references/`, so it has to be deleted by hand in the same change. Narrowing `claude-standards-audit` meant dropping it from `consumers` in `standards/bundled/branch.md` and `standards/bundled/pr.md`, and `scripts/core/regen-skill-references.sh` walks the bundled folder and copies with no pass that removes a file the field no longer names, while `assert_no_drift` compares the working tree against HEAD rather than against a fresh regen. An orphan that is already committed reads clean forever. `git rm` the matching file in the same commit, rerun the regen, and confirm the folder holds only what the field still lists.

Shipping a dependency beside its consumer connects them only when the consumer's cited path resolves against the root that now holds it. The marketplace symlinks put `standards/` and `snippets/` into the plugin cache, and a headless run in a project with no `.claude/` showed the skill resolving `.claude/standards/versioning.md` against the project root, finding nothing, and never looking in its own plugin root, while a `references/` file bundled inside the same skill folder resolved in the same run because that path is relative to the skill. Delivery succeeded and reach did not. Name the root each cited path resolves against before calling such an outcome met, and test in a target that lacks the file rather than one with its own copy. The reach half closed by citing `${CLAUDE_SKILL_DIR}/../../standards/<name>.md` as a fallback after the project path.

## Destinations

Twenty-seven standards, being 21 at the flat root and six under `bundled/`. Each carries its purpose and the home it routes to. `arrived` marks a home the guidance already sits in, and the `Withdrawn` section holds the destinations re-decided rather than built. Every carrier the census named has now either landed or been reversed, so no row is waiting on one.

### To the CLI

- `markdown.md` fixes what a check can decide about any markdown file. `aitk markdown audit`, arrived, with `501-markdown.md` left pointing at it.

`slug.md` and `publish.md` were recorded here and are withdrawn below.

### To an existing governance rule

- `architecture.md` fixes what a cross-domain decision record holds. `540-architecture.md`.
- `context.md` fixes the per-domain narrative entry. `510-context.md`.
- `design.md` fixes visual intent and the token tables. `550-design.md`.
- `diagrams.md` fixes the per-kind Mermaid entry. `560-diagrams.md`.
- `groundwork.md` fixes the measurement track a topic gets before anyone plans it. `556-groundwork.md`.
- `intake.md` fixes the folder a raw dump is filed into. `557-intake.md`.
- `memory.md` fixes the pen entry and its lifecycle from write to retire. `559-memory.md`.
- `plan.md` fixes the plan file and the suggested-and-answer contract a worker executes. `558-plan.md`.
- `readme.md` fixes the voice and structure of the page a project leads with. `580-readme.md`.
- `requirements.md` fixes the problem, goals, and non-goals record. `530-requirements.md`.
- `rule.md` fixes a path-scoped governance rule. `590-rule-authoring.md`.
- `session.md` fixes the pre-compaction handoff. `562-session.md`, which globs the `session-` file alone because `555-tasks.md` globs the board around it and one rule over both shapes would carry two.
- `skill.md` fixes the skill folder, its frontmatter, and its invocation contract. `570-skill.md`.
- `standard.md` fixes a standard's frontmatter, scope statement, and success criterion. `591-standard-authoring.md`.
- `tasks.md` fixes the board, its filenames, and its readiness groups. `555-tasks.md`.
- `teach.md` fixes the learning workspace layout, its ordinal naming, and its mission and record formats. `561-teach.md`, whose frontmatter states that most targets open no workspace for it to fire on. The pedagogy stays in `claude-teach`, which is the split the architecture record already fixes.
- `wireframes.md` fixes layout and interaction intent before any UI exists. `520-wireframes.md`.

### To a skill, through the bundled fan-out

- `branch.md` fixes the branch name and its type vocabulary. `git-branch`, `git-split`, `git-pr`, and `claude-worktree`, arrived.
- `commit.md` fixes the commit subject. `git-commit` and `git-stage`, arrived.
- `issue.md` fixes an issue body. `git-issue`, arrived.
- `pr.md` fixes a pull request title and body. `git-split` and `git-pr`, arrived.
- `snippets.md` fixes a snippet file. `create-snippet`, arrived.
- `glossary.md` fixes the file holding one entry per term a body of material defines. `claude-teach`, arrived. Its path is fixed by whichever surface holds a glossary rather than by the standard, so no glob covers it while one skill reads it.

### Withdrawn

Three destinations the census recorded were re-decided rather than built, each on a premise that did not survive re-measurement. A row here is a decision reversed, not a carrier waiting, which is the distinction the marker above cannot carry on its own.

- `slug.md` was routed to a verb emitting the slug, on thirteen skill bodies restating the transform. None of them does. Each cites the standard and then states its own empty-result response, which is what that standard's `## An empty result` section instructs, so the duplication a verb would collapse does not exist. Withdrawn by the operator on 2026-08-20 against a re-measurement at `b26506ee`. It stays in the flat corpus reached by citation.
- `publish.md` was routed to a verb returning the cross-reference form and the unreadable-source branch, on the same reasoning about a value a caller reads. Withdrawn with `slug.md` and on the same day, since neither verb had a caller that would stop restating anything. It stays in the flat corpus, cited by seven skill bodies.
- `versioning.md` was routed to `claude-tasks`, `git-commit`, and `git-pr` through the fan-out, on three consumers sitting inside the ceiling. Two of its readers are standards rather than skills. `publish.md` and `tasks.md` each depend on it in-body, and neither is leaving, since `tasks.md` routes to `555-tasks.md` and `publish.md` is withdrawn above. A bundled standard never installs, so the move would point both at a file no target holds. Withdrawn by the operator on 2026-08-20, re-measured at `653bbb15`.
