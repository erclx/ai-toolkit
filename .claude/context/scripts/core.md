---
title: Core scripts
description: Repo maintenance scripts, the guard stages check fires, and the bare-flag repair that runs ahead of them
---

# Core scripts

`scripts/core/` holds repo maintenance: the scripts a contributor runs by `bun run` name and the guard stages `check` fires on every push. Nothing here is an `aitk` verb, so the catalog below is the discoverable surface.

## The catalog

- `bootstrap.sh`, run as `bun run bootstrap`: installs deps, links the CLI globally, and appends the Claude Code aliases to `~/.zshrc`. Idempotent and re-runnable
- `verify.sh`, run as `bun run check`: repairs `core.bare`, then format, four drift stages, the skill-path, plugin-boundary, seed-independence, context-citation, seed-standards, and skill-requirement guards, and spell always run. Shell, types, and tests gate on changed files unless `--all`
- `update.sh`, run as `bun run update`: interactive dep update via `bun update --interactive`, then verify
- `clean.sh`, run as `bun run clean`: wipes `node_modules/`, clears bun cache, reinstalls from lockfile
- `snapshot.sh`, run as `bun run snapshot`: writes the project file tree to `.claude/.tmp/project/PROJECT-SNAPSHOT.md` for Claude chat context
- `regen-indexes.sh`: thin wrapper calling `aitk indexes regen` by path so a linked worktree uses its own CLI
- `regen-hero.sh`: fills `assets/hero.html.tmpl` from five catalogs so no count on the README frame is hand-maintained. Clone-only, and it writes the HTML while `aitk capture` renders the image and stamps both sides with a digest.
  - The catalogs reach `bun --eval` as files under a `mktemp -d` rather than as environment variables, because Linux caps a single env entry at 131,072 bytes and `standards list --json` crossed it at 136,227 once two standards landed, up from 114,813
  - The failure is `execve` returning E2BIG, which reports `Argument list too long` and names no catalog, so it reads as a broken interpreter rather than as a payload that outgrew its channel. A file path is bounded whatever the catalogs grow to.
- `check-skill-paths.sh`: fails when a file under `claude/skills/` references a `wiki/` path, which resolves to nothing in a target
- `check-plugin-boundary.sh`: walks `claude/` with symlinks followed and fails when a shipped file resolves under `internal/`
- `check-seed-independence.sh`: walks the `.md` under every root `collect_seed_roots` discovers and fails on the literal token `aitk`, so seed prose a target reads as instruction about itself never names a binary that target may not have

## What the hero frame chooses and what it samples

`regen-hero.sh` no longer samples the skills column. It carries a `FEATURED_SKILLS` list of ten chosen names, because the even step lands on the entries closest to commodity and on none of the workflow the toolkit exists to carry. The run fails when a chosen name is absent from the catalog or when the list is not exactly `LISTED` long, so renaming or retiring a shipped skill breaks the Hero stage until the list is updated. The length assert is not decoration: `SKILL_MORE` counts down from `LISTED` rather than from the number of names rendered, so a list of any other length prints a remainder wrong by the difference.

The rules column still samples, but only over rules a stack names. A rule no stack reaches is opt-in behind `--add`, and featuring one advertises an entry an ordinary `aitk gov install` never delivers. The standards column samples the whole catalog, because three of the top four cited standards already appear and a second hand-kept list buys one swap for the same staleness. Every count and every `+N more` reads the whole catalog either way, so curation governs which names appear and nothing else.

The command count in the stats row reads `grep -c '^import { register as ' src/cli.ts`, since the commands have no `--json` catalog and `--help` is hand-authored ASCII that drifts from what is registered. A command added without that import shape leaves the frame's count low and nothing reports it.

## Reading a JSON payload in a stage

`bun --eval` exits 0 when its script throws while stdin is a pipe, and exits 1 on the same throw with no pipe attached, measured on Bun 1.3.14. A stage piping a catalog into it and branching on `$?` therefore reads a parse failure as a success. A throw also prints nothing, so the empty output then reads as whichever clean result an empty string means in that stage, which is how a broken catalog reports as a clean sweep.

Print a sentinel from inside the eval and branch on that instead. The `Unreferenced rules` stage prefixes `ok:` on success and `unreadable:` in a `catch`, which covers a payload that is not JSON and a payload missing the key on one path. The `stale` grep idiom the drift stages use does not reach here, since those match a scalar and this key holds an array of names.

## Verification

CI runs every stage through `bun run check:ci`, which passes `--all`. The local run scopes shell, types, and tests to the changed-file set, so it is the weaker of the two. See `.claude/context/ci.md`.

`repair_bare_flag` runs ahead of every stage rather than as one of them, because Claude Code's worktree entry leaves `core.bare` set in the shared config and that flag breaks the git reads that scope the run. It writes only when the flag is set and the repository's common dir is named `.git`, which spares a genuinely bare repository that keeps its objects at the root. `claude-worktree` carries the same repair at entry, and this copy covers the entries that never go through the skill. See `.claude/context/claude-plugin/skill-procedures.md` for the split and `wiki/claude/claude-worktrees.md` for the upstream issue.

It lives in `scripts/lib/worktree.sh` rather than inline in `verify.sh` so `src/worktree-repair.test.ts` can source it, which is the one bash function in the repo under test. The function takes its target root as an argument defaulting to `PROJECT_ROOT`, since a test cannot set that for a sourced function without leaking it across cases. The test builds six repository shapes and the `basename` guard is what it exists to pin: deleting that line leaves five cases passing and fails only the genuinely-bare one, which is the case where an unguarded repair does damage. Tests gate on `^src/` locally, so an edit to the lib alone runs them only under `check:ci`, which passes `--all`.

The test strips every inherited `GIT_*` variable before building its fixtures. Git hooks export `GIT_DIR`, so the suite passed standalone and failed under `pre-push` until it did: `git -C real-bare.git` resolved against the toolkit's own repository rather than the fixture, and the genuinely-bare case reported the wrong flag. Any future test that shells out to git needs the same scrub, and the failure is invisible to a normal `bun run test`.

### Stage gotchas

- `check-skill-paths.sh` scans `claude/skills/**` after `regen-skill-references.sh` has written into it, so a failure lands against a generated copy the author cannot edit in place. The message names `standards/bundled/` for that reason. `assert_no_drift` is scoped by folder glob and has the same shape, flagging a hand-authored file with a message about regenerated files.
- Three stages in `verify.sh` call TypeScript, context citations, the seed-standards gate, and the skill-requirement gate, in that order. Each invokes `bun src/cli.ts` rather than `aitk`, because a globally installed `aitk` resolves to the main checkout no matter which worktree is running and the gate would then measure the wrong tree.
- Every stage above the group is pure bash by construction, so the bun startup on every push is cost the citation stage introduced and the two below it reuse. A later TypeScript stage belongs beside them rather than higher up, which is what keeps that split readable.

### The seed-standards stage

- The seed-standards stage discovers its roots rather than listing them, walking `tooling/*/seeds/` and keeping the ones carrying a `.claude/`, so a new stack is covered without a script edit.
- It reports the entries it measured per root and warns on a root that measured none, rather than printing one verdict for the set. A root can resolve an audited folder and hold no entry in it, which `tooling/claude/seeds` does today, and a single pass line over that reads as coverage of a tree nothing opened.
- The count comes from `--gate --json`, whose record lands on stdout while the frame stays on stderr, so a passing run prints the counts alone and a failing one is re-run for its frame
- It branches on the audit's exit code rather than on pass against fail, because 1 and 2 mean opposite things there. 2 is a seed breaking the standard it seeds and fails the push. 1 is the audit refusing, which a seed root carrying a `.claude/` but no audited folder produces, and it warns instead.
- Treating the two alike red-failed a new stack that seeded `.claude/settings.json` alone, reporting a standards violation against a tree holding nothing a standard governs, which is the case discovery exists to make cheap
- That re-run is the one place in the script where a command's non-zero exit is discarded with `|| true`. It exits non-zero by construction, having already failed once, and `set -e` would otherwise take the script down before `log_error` names which seed root broke.

### The plugin boundary stage

- `check-plugin-boundary.sh` collects violations and passes on an empty collection, so a missing `claude/` or a missing `realpath` would report the boundary clean or blame a leak for an absent tool. Both are guarded up front and exit 1 naming the cause. Anything added to that walk needs the same treatment, since a producer that fails and a tree that is clean both arrive as zero rows.

See `.claude/context/scripts/framing.md` for how UI framing crosses the exec boundary these stages sit on.
