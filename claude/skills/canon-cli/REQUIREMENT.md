---
name: canon-cli
description: Why the overwrite contract is stated before a sync runs, and why the skill reads rather than executes
---

# Canon cli requirement

## Gap

Without this skill, a session runs an `canon` sync and finds out afterward what it did. The command names give nothing away. `install` and `sync` differ per domain, some surfaces overwrite unconditionally, some merge, some are written once and never touched again, and none of that is visible from the command line the user typed.

The damage lands on the files a project owns. A golden config carrying local edits is replaced without a warning anyone saw, and a standards install overwrites every standard in a project that only needed the two it had drifted on. The user learns which category a file was in by losing the edit.

The inverse failure is quieter. A session that assumes a sync will pick up a change edits a seed and waits for an update that never comes, because the seed is copy-once and no sync command writes it again. Both failures are one missing fact available before the command runs.

Being reachable is a separate problem from being right. This is a pure reference whose moment happens inside another skill's run, so nothing brings it up unless a body names it. Three sibling requirement files named it and routed nothing, because Claude Code loads `SKILL.md` as the entry and never opens the sibling. A route lives in a body or it does not exist, and a fourth requirement mention would repeat the same defect.

The two bodies now carrying an inline pointer are `claude-seed-sync` and `canon-operator`, each at the point it runs or prints an overwriting command.

## Must

- State per surface and per command whether an existing file is overwritten, merged, written once, or left alone
- Warn about a destructive run before it happens, naming the surface that will be lost
- Name the section-preserving path for a standard or seed the project has customized
- Defer to the toolkit's own context docs when they and this summary disagree, since the summary is a copy and they are the source

## Must not

- Run any `canon` command. The skill is read before acting.
- Restate the full semantics. It is a target-session summary and the detail lives with its owner.
- Take a mention in a sibling's requirement file as an inbound route. The three bodies named in the gap above carry the pointer, and adding a fourth means editing that body rather than its requirement.

## Guards

- A surface or command the contract does not cover routes to the context docs rather than to an inference from a similar row

## Out of scope

- Executing the sync, which the user runs or `canon-operator` routes
- Reconciling a customized seed section by section: `claude-seed-sync`
- Deciding which stack, rule, or standard a project should install, which the setup skills resolve from live catalogs
