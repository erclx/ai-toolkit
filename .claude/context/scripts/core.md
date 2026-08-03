---
title: Core scripts
description: Repo maintenance scripts, the guard stages check fires, and the bare-flag repair that runs ahead of them
---

# Core scripts

`scripts/core/` holds repo maintenance: the scripts a contributor runs by `bun run` name and the guard stages `check` fires on every push. Nothing here is an `aitk` verb, so the catalog below is the discoverable surface.

## The catalog

- `bootstrap.sh`, run as `bun run bootstrap`: installs deps, links the CLI globally, and appends the Claude Code aliases to `~/.zshrc`. Idempotent and re-runnable
- `verify.sh`, run as `bun run check`: repairs `core.bare`, then format, four drift stages, the skill-path, plugin-boundary, context-citation, and skill-requirement guards, and spell always run. Shell, types, and tests gate on changed files unless `--all`
- `update.sh`, run as `bun run update`: interactive dep update via `bun update --interactive`, then verify
- `clean.sh`, run as `bun run clean`: wipes `node_modules/`, clears bun cache, reinstalls from lockfile
- `snapshot.sh`, run as `bun run snapshot`: writes the project file tree to `.claude/.tmp/project/PROJECT-SNAPSHOT.md` for Claude chat context
- `regen-indexes.sh`: thin wrapper calling `aitk indexes regen` by path so a linked worktree uses its own CLI
- `regen-hero.sh`: fills `assets/hero.html.tmpl` from five catalogs so no count on the README frame is hand-maintained. Clone-only, and it writes the HTML while `aitk capture` renders the image
- `check-skill-paths.sh`: fails when a file under `claude/skills/` references a `wiki/` path, which resolves to nothing in a target
- `check-plugin-boundary.sh`: walks `claude/` with symlinks followed and fails when a shipped file resolves under `internal/`

## Verification

CI runs every stage through `bun run check:ci`, which passes `--all`. The local run scopes shell, types, and tests to the changed-file set, so it is the weaker of the two. See `.claude/context/ci.md`.

`repair_bare_flag` runs ahead of every stage rather than as one of them, because Claude Code's worktree entry leaves `core.bare` set in the shared config and that flag breaks the git reads that scope the run. It writes only when the flag is set and the repository's common dir is named `.git`, which spares a genuinely bare repository that keeps its objects at the root. `claude-worktree` carries the same repair at entry, and this copy covers the entries that never go through the skill. See `.claude/context/claude-plugin/skill-procedures.md` for the split and `wiki/claude-worktrees.md` for the upstream issue.

It lives in `scripts/lib/worktree.sh` rather than inline in `verify.sh` so `src/worktree-repair.test.ts` can source it, which is the one bash function in the repo under test. The function takes its target root as an argument defaulting to `PROJECT_ROOT`, since a test cannot set that for a sourced function without leaking it across cases. The test builds six repository shapes and the `basename` guard is what it exists to pin: deleting that line leaves five cases passing and fails only the genuinely-bare one, which is the case where an unguarded repair does damage. Tests gate on `^src/` locally, so an edit to the lib alone runs them only under `check:ci`, which passes `--all`.

The test strips every inherited `GIT_*` variable before building its fixtures. Git hooks export `GIT_DIR`, so the suite passed standalone and failed under `pre-push` until it did: `git -C real-bare.git` resolved against the toolkit's own repository rather than the fixture, and the genuinely-bare case reported the wrong flag. Any future test that shells out to git needs the same scrub, and the failure is invisible to a normal `bun run test`.

### Stage gotchas

- `check-skill-paths.sh` scans `claude/skills/**` after `regen-skill-references.sh` has written into it, so a failure lands against a generated copy the author cannot edit in place. The message names `standards/bundled/` for that reason. `assert_no_drift` is scoped by folder glob and has the same shape, flagging a hand-authored file with a message about regenerated files.
- Two stages in `verify.sh` call TypeScript, context citations and the skill-requirement gate directly below it. Each invokes `bun src/cli.ts` rather than `aitk`, because a globally installed `aitk` resolves to the main checkout no matter which worktree is running and the gate would then measure the wrong tree. Every stage above the pair is pure bash by construction, so the bun startup on every push is cost the citation stage introduced and the one below it reuses. A later TypeScript stage belongs beside them rather than higher up, which is what keeps that split readable.
- `check-plugin-boundary.sh` collects violations and passes on an empty collection, so a missing `claude/` or a missing `realpath` would report the boundary clean or blame a leak for an absent tool. Both are guarded up front and exit 1 naming the cause. Anything added to that walk needs the same treatment, since a producer that fails and a tree that is clean both arrive as zero rows.

See `.claude/context/scripts/framing.md` for how UI framing crosses the exec boundary these stages sit on.
