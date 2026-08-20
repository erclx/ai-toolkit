---
title: Authoring
description: Scenario file shape, the three hooks, fixture trees, and the disposable GitHub remote
---

# Writing a sandbox

Each sandbox is a `.sh` file with two optional hook functions and a required `stage_setup` function.

## stage_setup

`stage_setup` sets up scenario-specific state. It runs inside the sandbox tree after provisioning and asset injection are complete. Commit messages inside `stage_setup` must follow `standards/bundled/commit.md` conventions.

```bash
stage_setup() {
  # scaffold scenario state
  # end with scenario ready instructions
  log_step "Scenario ready: ..."
  log_info "Action:  what to run"
  log_info "Expect:  what should happen"
}
```

Multi-scenario files list options before calling `select_or_route_scenario`. Use `: ` as the separator between option name and description, per `.claude/standards/markdown.md`. Pad option names so the `:` separators align vertically across the list.

```bash
log_info "install/ : clean target, no rules present"
log_info "sync/    : stale .claude/rules/ present"
log_info "list     : read-only catalog dump, no target needed"
```

### Reading git history from a scenario

A scenario reading git history through a pipeline ending in an early exit fails on output it actually read. Scenario files run under `set -o pipefail`, so a `grep -m 1` matching the first line closes the pipe while git is still writing, and the command substitution returns git's SIGPIPE status rather than the match. Take the whole listing through a process substitution with a `while read` loop and `break`, which pipefail does not observe.

The failure is timing-dependent, which is what makes it worth writing down. The same pipeline run by hand in an interactive shell returns the match and exits 0, because git finishes writing before grep exits, and it fails inside the provisioning run where it matters. `infra:drift` carries both reads in the shape that survives.

### Staging a history rather than a tree

A scenario covering a verb whose subject is git history stages a repository of its own, since the ordering such a verb reads cannot be expressed as files in a directory. The `test-order` arm of `infra:gov` is the first of these. It runs `git init` into a subdirectory after the outer `stage_setup` commit, so the outer tree never records the nested repository as a gitlink, and it writes one commit per verdict the verb reports.

Ordering the commits is what the fixture is for, so a stage folder under `scripts/sandbox/fixtures/` cannot hold it. The files each commit carries are one line apiece and sit inline in the scenario, which keeps the sequence and its content readable in one place.

The arm still owes an expectation, and the fixture folder holds that alone. `aitk sandbox check` reads the tree and nothing else, so the arm writes stdout, stderr, and the exit status to three files rather than reaching the terminal through `exec`. That is what lets the declaration assert the classification, the record shape, and the exit code separately, where an arm printing to the terminal leaves a reader checking output by eye and the verdict reads `UNCHECKED`.

Holding the status is load-bearing for any arm over a command that exits non-zero by design. `set -e` would abort the scenario on the outcome the arm exists to observe, so the run captures the code into a file and the declaration pins it.

## Fixtures

A scenario's file content lives under `scripts/sandbox/fixtures/<category>/<scenario>/<arm>/<stage>/`, and `stage_fixtures` from `lib/sandbox-fixtures.sh` copies one stage into the sandbox. The scenario keeps its own git operations between the calls, so the script holds logic and the tree holds content.

```bash
stage_fixtures claude docs drift 01-initial
git add . && git commit -m "feat(api): initial task endpoints" --no-verify -q
stage_fixtures claude docs drift 02-postgres
```

The first two segments mirror the scenario's own path at `scripts/sandbox/<category>/<scenario>.sh`. Both are needed, since four scenario basenames repeat across categories (`claude`, `docs`, `review`, and `sync`) and `docs` is a category as well.

`stage_toolkit_markdown` sits in the same library for the other source of staged content, the toolkit's own `standards/` and `snippets/` trees. An arm modelling a real install wants the files a target actually received, and a copy of them under `fixtures/` would drift from the source with nothing reporting it. It flattens, which is the part to keep: both `detectUnmigrated` and the sync engine match a target file to its source by basename against the flat domain root, so a file staged out of a source subfolder such as `bundled/` reads as project-authored and the arm asserts against a state it did not stage.

`pick_dropped_root` and `restore_dropped_file` sit beside it for the third source, the toolkit's own deleted history. An arm covering the reverse walk has to stage a folder at a root this repository actually dropped, holding bytes it actually published, since attribution matches content against the blobs history holds for that path and a hand-authored file scores `unattributed` instead. Both read the whole listing through a process substitution rather than a pipeline ending in an early exit, which is the `pipefail` trap the section below records.

Each stage splits into two optional subfolders. `create/` copies files in, making parent directories and overwriting whatever is there. `append/` concatenates onto a file the anchor or the injected seeds already provide, and fails when the target is missing, because an absent target means the upstream shape changed and the scenario's assumption is stale.

Every stored file carries a `.fixture` suffix that the helper strips on copy. The suffix keeps the repository's own checks off the content, since an `index.md.fixture` is not an `index.md`. `aitk indexes regen` leaves it alone, and prettier, `shfmt`, and `shellcheck` skip it too. Without the suffix, a fixture that deliberately drifts from its sibling frontmatter gets normalized by `bun run check` and the state it models disappears.

Stage numbering carries ordering, not identity. A stage exists because a commit or a branch switch has to happen before the next file lands.

`scripts/sandbox/fixtures/anchor/create/` is the one tree outside the four-segment layout. It belongs to no single scenario, since all nine anchor scenarios provision from it, so `stage_anchor_tree` calls `create_from_fixtures` directly rather than going through `stage_fixtures`. It holds the minimum a scenario reads: `utils.js`, which `git/{pr,issue,followup}.sh` append to, plus a `.gitignore` matching what `init_empty_sandbox` writes. Three of the nine wipe the tree before staging their own and two overwrite what they need, so growing this fixture is warranted only when a scenario reads a file that is missing.

### Rewriting a file provisioning already wrote

`init_empty_sandbox` writes a `.gitignore` holding `.claude/.tmp/` and `node_modules` before `stage_setup` runs, so a scenario modelling ignore-entry drift is rewriting a file it did not create. Truncating that file drops both entries beside the ones the arm meant to strip, and a session that installs anything inside the sandbox then has `node_modules` tracked. Copy the file before the write that dirties it and restore the copy afterwards, which removes exactly what the write added and hardcodes nothing about what provisioning put there. Restating the two entries inline works until provisioning gains a third.

The same shape covers any file the harness seeds and a scenario has to modify. A rewrite from a remembered baseline drifts the moment the baseline moves, and nothing reports it, since the arm still provisions and still asserts.

### Keeping a stage coherent

A stage must leave the tree coherent with what the scenario claims it staged. `02-postgres` on the `claude/docs` `drift` arm replaced `src/db.ts` alone, moving `createTask` to `(title, userId)` and returning `rows[0]`, while `src/routes/tasks.ts` stayed at its `01-initial` content calling `createTask(title)` and reading `result.lastInsertRowid`. The commit message said the migration shipped and the route did not compile against the module it imported.

A skill reading that diff saw a half-migration, correctly declined to mark the outcome, and failed four assertions. A stage that changes a module's signature carries its callers, or the arm tests the fixture's incoherence rather than the skill.

## use_config

`use_config` runs before provisioning. Declare it to set sandbox behavior flags.

```bash
use_config() {
  export SANDBOX_SKIP_AUTO_COMMIT="true"  # skip auto-commit after stage_setup
  export SANDBOX_INJECT_SEEDS="true"      # inject tooling/claude/seeds/ into sandbox root
  export SANDBOX_INJECT_STANDARDS="true"  # inject standards into .claude/standards/
  export SANDBOX_INJECT_GOV="true"        # inject .claude/rules/ into sandbox
}
```

`SANDBOX_INJECT_SEEDS` is a raw copy of `tooling/claude/seeds/.` into the sandbox root, not a run of `aitk claude init`. It drops `CLAUDE.md` and `.claude/*` seed files before `stage_setup` runs. Hooks ride along in that tree, which is what makes a hook change observable to a run.

`SANDBOX_INJECT_STANDARDS` and `SANDBOX_INJECT_GOV` run `aitk standards install` and `aitk gov install` against the sandbox rather than copying source trees. The installer decides what lands, so the sandbox cannot drift from what a target receives, and provisioning exercises the installer as a side effect. `SANDBOX_GOV_STACK` picks the stack and defaults to `base`.

A stack install narrows what arrives. The copy it replaced took all 51 rules under `governance/rules`, while `base` resolves to 30, which is what a real target holds since no project carries both the React and FastAPI rules. A scenario needing a framework's rules sets `SANDBOX_GOV_STACK` rather than assuming every rule is present.

A failed install aborts provisioning with the installer's own stderr, since a sandbox missing the rules a scenario depends on would otherwise fail later somewhere unrelated.

## use_anchor

`use_anchor` marks a scenario as one that needs a real remote. Declaring it stages the sandbox from the anchor fixture instead of starting empty, and names the repository the scenario will push to.

All nine declare it the same way, delegating to `use_sandbox_anchor` in `lib/sandbox-git.sh` so the repository name lives in one place:

```bash
use_anchor() {
  use_sandbox_anchor
}
```

`ANCHOR_REPO` carries no default. Every declaring scenario calls `use_sandbox_anchor` with no argument and resolves to `toolkit-sandbox`, so a fallback would sit permanently unreached.

The library exports `use_sandbox_anchor` rather than declaring `use_anchor` itself. `manage-sandbox.sh` keys off `type -t use_anchor` to decide between staging the anchor fixture and starting empty, so a hook declared at source time would hand an anchor to `git/commit.sh`, `git/stage.sh`, and `infra/indexes.sh`, which source the file for the identity helpers alone.

`manage-sandbox.sh` handles provisioning, asset injection, skill injection, git setup, and baseline tagging. The hook functions configure behavior before that pipeline runs.

After `stage_setup` completes, `manage-sandbox.sh` unions the `claude/skills/**/SKILL.md` diff against `main` with any untracked new skill folders and copies each into `<sandbox>/.claude/skills/<name>/SKILL.md`. That diff lists a skill the branch deleted alongside one it changed, so the loop skips a path no longer in the tree and a branch retiring a skill provisions without a failed copy. This covers dev skills authored in the current branch whether or not they are committed yet. Project-scoped skills take priority over the installed plugin, so invoking `/<skill-name>` in the sandbox session exercises the dev version without `--plugin-dir` or `--bare`.

## Disposable GitHub remote (`toolkit-sandbox`)

Set `ANCHOR_REPO="toolkit-sandbox"` when a scenario needs a real GitHub remote for `gh` calls (open PRs, push branches, merge, edit PR bodies). The repo at `${GITHUB_ORG}/toolkit-sandbox` exists for this purpose and is treated as fully disposable. Any scenario for a `gh`-dependent skill should default to this pattern.

Each scenario owns its own reset:

1. Closes any open PRs it will recreate (`gh pr close <branch> 2>/dev/null || true`)
2. Deletes any remote branches it will recreate (`git push origin --delete <branch> -q 2>/dev/null || true`)
3. Force-pushes a fresh main (`git push --force origin HEAD:main`)
4. Recreates branches and opens PRs

Wrap each cleanup call with `2>/dev/null || true` so a missing branch or PR from the prior run does not abort the scenario.
