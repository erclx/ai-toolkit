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

Multi-scenario files list options before calling `select_or_route_scenario`. Use `: ` as the separator between option name and description, per `.claude/standards/prose.md`. Pad option names so the `:` separators align vertically across the list.

```bash
log_info "install/ : clean target, no rules present"
log_info "sync/    : stale .claude/rules/ present"
log_info "list     : read-only catalog dump, no target needed"
```

## Fixtures

A scenario's file content lives under `scripts/sandbox/fixtures/<category>/<scenario>/<arm>/<stage>/`, and `stage_fixtures` from `lib/sandbox-fixtures.sh` copies one stage into the sandbox. The scenario keeps its own git operations between the calls, so the script holds logic and the tree holds content.

```bash
stage_fixtures claude docs drift 01-initial
git add . && git commit -m "feat(api): initial task endpoints" --no-verify -q
stage_fixtures claude docs drift 02-postgres
```

The first two segments mirror the scenario's own path at `scripts/sandbox/<category>/<scenario>.sh`. Both are needed, since four scenario basenames repeat across categories (`claude`, `docs`, `review`, and `sync`) and `docs` is a category as well.

Each stage splits into two optional subfolders. `create/` copies files in, making parent directories and overwriting whatever is there. `append/` concatenates onto a file the anchor or the injected seeds already provide, and fails when the target is missing, because an absent target means the upstream shape changed and the scenario's assumption is stale.

Every stored file carries a `.fixture` suffix that the helper strips on copy. The suffix keeps the repository's own checks off the content, since an `index.md.fixture` is not an `index.md`. `aitk indexes regen` leaves it alone, and prettier, `shfmt`, and `shellcheck` skip it too. Without the suffix, a fixture that deliberately drifts from its sibling frontmatter gets normalized by `bun run check` and the state it models disappears.

Stage numbering carries ordering, not identity. A stage exists because a commit or a branch switch has to happen before the next file lands.

`scripts/sandbox/fixtures/anchor/create/` is the one tree outside the four-segment layout. It belongs to no single scenario, since all nine anchor scenarios provision from it, so `stage_anchor_tree` calls `create_from_fixtures` directly rather than going through `stage_fixtures`. It holds the minimum a scenario reads: `utils.js`, which `git/{pr,issue,followup}.sh` append to, plus a `.gitignore` matching what `init_empty_sandbox` writes. Three of the nine wipe the tree before staging their own and two overwrite what they need, so growing this fixture is warranted only when a scenario reads a file that is missing.

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

A stack install narrows what arrives. The copy it replaced took all 38 rules under `governance/rules`, while `base` resolves to 20, which is what a real target holds since no project carries both the React and FastAPI rules. A scenario needing a framework's rules sets `SANDBOX_GOV_STACK` rather than assuming every rule is present.

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

After `stage_setup` completes, `manage-sandbox.sh` unions the `claude/skills/**/SKILL.md` diff against `main` with any untracked new skill folders and copies each into `<sandbox>/.claude/skills/<name>/SKILL.md`. This covers dev skills authored in the current branch whether or not they are committed yet. Project-scoped skills take priority over the installed plugin, so invoking `/<skill-name>` in the sandbox session exercises the dev version without `--plugin-dir` or `--bare`.

## Disposable GitHub remote (`toolkit-sandbox`)

Set `ANCHOR_REPO="toolkit-sandbox"` when a scenario needs a real GitHub remote for `gh` calls (open PRs, push branches, merge, edit PR bodies). The repo at `${GITHUB_ORG}/toolkit-sandbox` exists for this purpose and is treated as fully disposable. Any scenario for a `gh`-dependent skill should default to this pattern.

Each scenario owns its own reset:

1. Closes any open PRs it will recreate (`gh pr close <branch> 2>/dev/null || true`)
2. Deletes any remote branches it will recreate (`git push origin --delete <branch> -q 2>/dev/null || true`)
3. Force-pushes a fresh main (`git push --force origin HEAD:main`)
4. Recreates branches and opens PRs

Wrap each cleanup call with `2>/dev/null || true` so a missing branch or PR from the prior run does not abort the scenario.
