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

Copying a standard into each consumer's `references/` is the established route and five bundled sources produce eleven copies. It stays affordable while the consumer set is small and stops at roughly a handful, since `markdown.md` at 21 citing bodies and `slug.md` at 13 would each produce a copy per body, which is the duplication the fan-out exists to prevent. Where the set is too wide, the home is a verb, and the readers call it rather than holding it.

### A verb is the home for a rule stated across every reader

Three attribute standards land on the CLI for the same reason, which is that a transform, a scan, and a closed list are each a value a caller reads rather than a shape a caller writes. `markdown.md` has already arrived: its ban sets and structural checkpoints ship as data in `src/markdown/`. The other two are recorded as destinations and no verb exists for either yet.

## Gotchas

- The meta-standard's subject is the corpus this census is dissolving. `standard.md` routes to `591-standard-authoring.md` while standards remain a document type someone authors, and it is the one entry whose destination expires if the corpus does. Nothing detects that, because a rule globbing an empty folder reports the same as one globbing a full folder.
- A destination recorded against a carrier nobody has built reads identically to one recorded against a live carrier, and only the marker below separates them. Four still name a carrier to write, being two verbs and two skill destinations.
- `internal/standards/tooling-reference.md` is outside this census. It never installs into a target, so it has no corpus to leave, and `595-tooling-reference.md` already carries it.
- A destination is not an install channel. Recording a home for every standard leaves the folder in place and leaves it installing, so the outcome about nothing living only in an installed folder stays open until the sweep and the install removal behind it run.

## Destinations

Twenty-seven standards, being 22 at the flat root and five under `bundled/`. Each carries its purpose and the home it routes to. `arrived` marks a home the guidance already sits in, and `to write` marks a carrier the census named without building. The two rules it named have since landed, and four carriers remain.

### To the CLI

- `markdown.md` fixes what a check can decide about any markdown file. `aitk markdown audit`, arrived, with `501-markdown.md` left pointing at it.
- `slug.md` turns a branch name into the one string every derived name spells. A verb emitting the slug, to write. Thirteen skill bodies restate the transform today and no rule or verb reaches it.
- `publish.md` fixes the scan finished text passes on its way out and the cross-reference form each destination takes. A verb returning the form and the unreadable-source branch, to write. Seven skill bodies cite it and no rule globs finished text.

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
- `versioning.md` keeps phase labels and semver tags off each other's surfaces. `claude-tasks`, `git-commit`, and `git-pr`, to write. Three consumers sits inside the ceiling above, and the discipline is a lookup per surface rather than a check.
- `glossary.md` fixes the file holding one entry per term a body of material defines. `claude-teach`, to write. Its path is fixed by whichever surface holds a glossary rather than by the standard, so no glob covers it while one skill reads it.
