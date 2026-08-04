---
title: Shared skill procedures
description: The CLI shell-out pattern every skill follows, the core.bare repair carried at two points, and the procedures defined once in standards and cited from each body
---

# Shared skill procedures

## The CLI shell-out pattern

Plugin skills that shell out to the CLI follow a consistent pattern: read the toolkit catalog via `aitk <domain> list --json`, match against project context, then execute the CLI with `AITK_NON_INTERACTIVE=1` so it skips prompts. Claude Code's tool permission dialog is the single confirmation gate. Skills never reimplement CLI logic or hardcode rule, stack, or snippet names. `setup-gov` is the reference.

### Repairing `core.bare`

`claude-worktree` repairs `core.bare` at two points rather than one. Claude Code's entry tool writes the flag into the parent repository's shared config and its exit tool never restores it, which leaves every later command in the main worktree failing for want of a work tree while the files sit untouched on disk. The linked worktree keeps working, so the session that caused the damage is the one least likely to see it. Repairing only after entry would still admit a repository broken by an earlier session, so the skill reads the flag in Step 1 beside the main-root resolution and repairs before entering, then repeats the repair in Step 5. Both writes are guarded on the flag actually being set, since the entry tool does not set it every time and an unconditional repair would rewrite the config on runs where nothing broke.

`scripts/core/verify.sh` carries the same repair as a second line of defense, sourced from `scripts/lib/worktree.sh` and run ahead of every stage because the flag breaks the git reads that scope the run. Nothing forces worktree entry through the skill, and one occurrence hit an operator whose session never entered a worktree at all. A git hook cannot serve here, because the corrupted command aborts before any hook runs. Both call sites confirm the repository's common dir is named `.git` before writing, which separates the defect from a genuinely bare repository that keeps its objects at the root and would be broken by the repair. The skill states the upstream issue inline rather than pointing at `wiki/claude/claude-worktrees.md`, since a shipped skill runs where no `wiki/` path resolves and `check-skill-paths.sh` fails the build on one.

### Bundled references

`setup-plugins` bundles `references/plugin-catalog.md`, which holds install data alone. `wiki/tools/community-skills.md` is its narrative companion and `.claude/context/claude-plugin/skill-strategy.md` argues the install-versus-author decision, and neither is reachable from the shipped file by design. A `references/` file is read by a session running in a target project, where no `wiki/` path resolves, so the two pointers the catalog used to carry were already dead for the only consumer that reads it. They are recorded here instead, on a surface that never ships, for the maintainer editing the catalog. `community-skills.md` stays in `wiki/` rather than moving to `docs/` because its subject is the community plugin authors, which is the test that decides what `wiki/` holds.

## Procedures defined once and cited

Two procedures run inside more than one skill and are defined once in `standards/`, cited from each body rather than restated in it. Each has a standard of its own, `publish.md` for the scan and `slug.md` for the transform. Neither sits inside a document-type standard, since `prose.md` does not govern a scan and `skill.md` does not govern a slug transform.

The scan carries two checks under one citation, characters and phase labels, with the rules themselves held by `prose.md` and `versioning.md` beside it. A skill citing the scan gets both without naming either file, which is what keeps a new check from costing an edit in every consuming body. The label check scopes by destination, so `claude-diagram` cites the same standard and takes the character half alone.

Both are stated generally, and neither names what enforces it here. An installed standard belongs to the project that installed it, so a standard citing this repository's audit hook, scratch paths, or output filenames goes wrong in a target that has none of them, with nothing reporting it. In this repository the scan covers text the hook never reaches, meaning `.claude/.tmp/`, anything leaving through `gh`, and anything inside a fence, and that belongs here rather than in the file that ships. Each citing skill names its own gap for the same reason, since the gap is a fact about the skill.

They live in `standards/` rather than `standards/bundled/` because the fan-out serves format references a skill consults while holding still, and these are procedures a skill executes mid-run. A citation resolves through the same two paths as any standard, so a target's own copy still wins. The fan-out was left untouched, so neither mechanism replaced the other.

The split between the two surfaces is what keeps the citation honest. The standard owns the procedure and the body owns the trigger, since both the moment a scan runs and the text it runs against vary per skill. The empty-branch case splits the same way, carrying three legitimate answers across the catalogue: fall back to `latest`, stop, or fall through to another source. A body that cites without stating its own case reads as if the default applied to it.

Nothing detects a body that restates a procedure instead of citing it. `assert_no_drift` covers generated copies and a hand-written restatement is not generated, so the guarantee is only that a single definition exists to correct.
