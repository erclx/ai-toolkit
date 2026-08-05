---
title: Shared skill procedures
description: The CLI shell-out pattern every skill follows, the core.bare repair carried at two points, and the procedures defined once in standards and cited from each body
---

# Shared skill procedures

## The CLI shell-out pattern

Plugin skills that shell out to the CLI follow a consistent pattern: read the toolkit catalog via `aitk <domain> list --json`, match against project context, then execute the CLI with `AITK_NON_INTERACTIVE=1` so it skips prompts. Claude Code's tool permission dialog is the single confirmation gate. Skills never reimplement CLI logic or hardcode rule, stack, or snippet names. `setup-gov` is the reference.

### Reading a report rather than rediscovering

`migration-standards` extends the pattern past the catalog. Its detection now comes from the `unmigrated` array in `aitk sync --check --json`, where it used to list `standards/` and `snippets/` with `ls`. The two answer different questions. A listing counts every markdown file in the folder, and a project that keeps its own docs at `standards/` has that folder proposed for relocation under `.claude/`, where a sync then walks files nobody installed. `detectUnmigrated` claims a root folder only when it holds a file whose basename the toolkit ships, so the count the proposal reports is the toolkit-owned subset.

Reading the same report the router read is the other half of it. `toolkit-operator` routes here off `unmigrated`, so a skill rediscovering by its own rule can disagree with the report that sent the session to it, and the disagreement surfaces as a proposal the operator's own diagnosis does not support.

The `ls` path stays as the fallback, on three triggers rather than one, and the body says the counts are unfiltered when it fires. Two are the obvious ones, `aitk` off `PATH` and a non-zero exit. The third is a report that parses and carries no `unmigrated` key, which is what a CLI older than `0.46.0` returns, since the field reached a release there. Reading an absent key as an empty answer is the failure taking detection from a command introduces and a folder listing never had: the run exits zero, takes the nothing-to-relocate branch, and reports a clean layout to a project whose every domain sits at the root. An absent key and an empty array are therefore separate states, and a current CLI reporting `"unmigrated": []` has looked and found nothing.

That skew is the general shape rather than one skill's problem. A skill reaches a target through whichever CLI the machine has, while the skill itself loads live from the plugin, so a body written against a field can run against a binary predating it. `ARCHITECTURE.md` carries the two-speed release as a standing risk, and this is the first skill to answer it with a per-field test rather than assuming the surface it reads. The fallback deliberately does not key on `historyUnavailable`, which was the shape borrowed from `claude-seed-sync` when the change was planned. That field reports failed attribution on a domain or on `seeds`, and `unmigrated` is a filesystem read carrying no attribution at all, so keying on it would drop a correct detection whenever an unrelated half of the report could not be dated.

### Repairing `core.bare`

`claude-worktree` repairs `core.bare` at two points rather than one. Claude Code's entry tool writes the flag into the parent repository's shared config and its exit tool never restores it, which leaves every later command in the main worktree failing for want of a work tree while the files sit untouched on disk. The linked worktree keeps working, so the session that caused the damage is the one least likely to see it. Repairing only after entry would still admit a repository broken by an earlier session, so the skill reads the flag in Step 1 beside the main-root resolution and repairs before entering, then repeats the repair in Step 5. Both writes are guarded on the flag actually being set, since the entry tool does not set it every time and an unconditional repair would rewrite the config on runs where nothing broke.

`scripts/core/verify.sh` carries the same repair as a second line of defense, sourced from `scripts/lib/worktree.sh` and run ahead of every stage because the flag breaks the git reads that scope the run. Nothing forces worktree entry through the skill, and one occurrence hit an operator whose session never entered a worktree at all. A git hook cannot serve here, because the corrupted command aborts before any hook runs. Both call sites confirm the repository's common dir is named `.git` before writing, which separates the defect from a genuinely bare repository that keeps its objects at the root and would be broken by the repair. The skill states the upstream issue inline rather than pointing at `wiki/claude/claude-worktrees.md`, since a shipped skill runs where no `wiki/` path resolves and `check-skill-paths.sh` fails the build on one.

### Bundled references

`setup-plugins` bundles `references/plugin-catalog.md`, which holds install data alone. `wiki/tools/community-skills.md` is its narrative companion and `.claude/context/claude-plugin/skill-strategy.md` argues the install-versus-author decision, and neither is reachable from the shipped file by design. A `references/` file is read by a session running in a target project, where no `wiki/` path resolves, so the two pointers the catalog used to carry were already dead for the only consumer that reads it. They are recorded here instead, on a surface that never ships, for the maintainer editing the catalog. `community-skills.md` stays in `wiki/` rather than moving to `docs/` because its subject is the community plugin authors, which is the test that decides what `wiki/` holds.

## Procedures defined once and cited

Two procedures run inside more than one skill and are defined once in `standards/`, cited from each body rather than restated in it. Each has a standard of its own, `publish.md` for the scan and `slug.md` for the transform. Neither sits inside a document-type standard, since `prose.md` does not govern a scan and `skill.md` does not govern a slug transform.

The scan carries two checks under one citation, characters and phase labels, with the rules themselves held by `markdown.md` and `versioning.md` beside it. A skill citing the scan gets both without naming either file, which is what keeps a new check from costing an edit in every consuming body. The label check scopes by destination, so `claude-diagram` cites the same standard and takes the character half alone.

Both are stated generally, and neither names what enforces it here. An installed standard belongs to the project that installed it, so a standard citing this repository's audit hook, scratch paths, or output filenames goes wrong in a target that has none of them, with nothing reporting it. In this repository the scan covers text the hook never reaches, meaning `.claude/.tmp/`, anything leaving through `gh`, and anything inside a fence, and that belongs here rather than in the file that ships. Each citing skill names its own gap for the same reason, since the gap is a fact about the skill.

They live in `standards/` rather than `standards/bundled/` because the fan-out serves format references a skill consults while holding still, and these are procedures a skill executes mid-run. A citation resolves through the same two paths as any standard, so a target's own copy still wins. The fan-out was left untouched, so neither mechanism replaced the other.

The split between the two surfaces is what keeps the citation honest. The standard owns the procedure and the body owns the trigger, since both the moment a scan runs and the text it runs against vary per skill. The empty-branch case splits the same way, carrying three legitimate answers across the catalogue: fall back to `latest`, stop, or fall through to another source. A body that cites without stating its own case reads as if the default applied to it.

Nothing detects a body that restates a procedure instead of citing it. `assert_no_drift` covers generated copies and a hand-written restatement is not generated, so the guarantee is only that a single definition exists to correct.

### A main-root write names its route or the guard silently takes it

Eleven bodies write shared session scratch at the main worktree root, and Claude Code refuses any such write from a linked worktree, naming the worktree copy as the destination instead. The redirected write still succeeds, so a body stating only the destination reports success and loses the file, and no stage reports the miss. That is the whole defect: the instruction and the guard disagreed, the guard won, and nothing said so.

Each body now names the route beside the destination rather than the destination alone. Creating a whole file goes out as a plain single `Bash` command carrying a heredoc, with `mkdir -p` sent separately because the isolation refuses a compound command whose target it cannot statically verify. Changing a line inside an existing file goes through an `aitk` verb, since the shell route for that case is the stream editor `CLAUDE.md` bans. `CLAUDE.md` and the seed state the split once and each guard names only what it writes, because eleven restatements of one mechanism is eleven places to correct and this rule has already been corrected once.

Two structured edits earned verbs, `aitk tasks pull-request` and `aitk tasks outcome`, chosen over a body instruction because the board is the write with a measured cost and a verb is the only part of this a test can reach. A structured edit no verb covers, such as `claude-docs` retargeting a `Plan:` line or `claude-memory-review` flipping an item's emoji, reads the file and writes it back whole. That stays a body instruction until a second caller wants the same edit, which is the point a third verb would pay for itself.

The read sites were left alone. `Read` resolves against the main root normally, so the six bodies that only read were correct as written and rewriting them would have added diff with no behavior behind it.
