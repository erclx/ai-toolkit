---
name: aitk-sandbox-check
description: Audits the current branch for skill or script edits that lack a matching sandbox scenario update. Reports per-item pairings, re-provisions changed scenarios, and prints the re-test command. Auto-trigger at ship time after editing `claude/skills/**/SKILL.md`, `scripts/**`, or `src/**` when the user signals end-of-feature ("ready to ship", "open PR", "before push", "wrap up", "ship it"). Do NOT auto-trigger on individual file edits mid-feature or on docs-only changes.
---

# Sandbox check

Manual guard after editing a plugin skill or a domain script. Reports whether each changed item has a paired scenario edit, re-provisions changed scenarios, and prints the re-test command for the user to launch.

## Guards

- If the current branch is `main` or `master`, stop: `❌ On main. Checkout a feature branch first.`
- If both `git diff "$(git merge-base main HEAD)" --name-only -- 'claude/skills/**/SKILL.md'` and `git diff "$(git merge-base main HEAD)" --name-only -- 'scripts/**' 'src/**'` are empty, stop: `✅ No skill or script changes since main.`

## Step 1: collect changed files

Run in parallel from the worktree root:

```bash
git diff "$(git merge-base main HEAD)" --name-only -- 'claude/skills/**/SKILL.md'
```

```bash
git diff "$(git merge-base main HEAD)" --name-only -- 'scripts/**' 'src/**'
```

```bash
git diff "$(git merge-base main HEAD)" --name-only -- 'scripts/sandbox/**/*.sh'
```

```bash
pwd
```

The first list is the changed plugin skills. The second list is the changed scripts (`scripts/`, `src/`). The third is the changed sandbox scenarios. The fourth is the current root, whether that is main or a linked worktree. `.sandbox/` lives under whichever root ran `manage-sandbox.sh`, because the script resolves `PROJECT_ROOT` from its own path.

Drop any path in the script list that already appears in the scenario list. Scenario edits surface through the "Scenarios changed but not paired" tail and do not need a mapping pass.

## Step 2a: map plugin skill changes

For each changed skill path `claude/skills/<skill-name>/SKILL.md`:

1. Split `<skill-name>` on the first `-` into `<category>` and `<rest>`.
2. Check whether `scripts/sandbox/<category>/<rest>.sh` exists in the worktree.
3. If it exists, record that path as the scenario.
4. If it does not exist, do not guess. Ask the user: `Scenario for <skill-name>? (path under scripts/sandbox/, or "none" if the skill has no scenario)`. Record the answer. Accept `none` as an explicit opt-out.

Do not guess past the first fallback. Fuzzy matching across sandbox categories produces wrong pairings (`gov-install` is `infra/gov.sh`, not `gov/install.sh`).

## Step 2b: map script changes

For each changed script path, apply the first matching rule:

| Path                         | Scenario            |
| ---------------------------- | ------------------- |
| `scripts/<domain>/*.sh`      | `infra/<domain>.sh` |
| `scripts/manage-<domain>.sh` | `infra/<domain>.sh` |
| `scripts/lib/<name>.sh`      | see lib rule below  |
| `src/**`                     | unmapped, see below |

For `scripts/lib/<name>.sh`:

1. If `scripts/sandbox/infra/<name>.sh` exists, record that path as the scenario.
2. Otherwise, grep `scripts/sandbox/**/*.sh` for `source.*<name>` and record every matched scenario.

For `src/**`, do not record a scenario. Mark the row `UNMAPPED` and append `Closest e2e: bun run check:install` to the row's hint.

If a domain produces no `infra/<domain>.sh`, do not guess. Ask the user the same question used in Step 2a. Accept `none` as an explicit opt-out.

## Step 3: classify each pairing

- **aligned**: scenario path is set and appears in the changed-scenarios list.
- **stale**: scenario path is set but does not appear in the changed-scenarios list.
- **none**: user answered `none`.
- **unmapped**: no scenario file was identified and the user did not answer `none`, or the item is under `src/**`.

## Step 4: print the report

Build the distinct scenario list from Step 2 results. Keep their original input order so re-runs are deterministic. The first entry is the `Provisioning:` target. Any remainder is the `Queued:` list.

Print one block to chat:

```plaintext
Sandbox check

Provisioning:
  AITK_NON_INTERACTIVE=1 ./scripts/manage-sandbox.sh <category>:<scenario>

Queued (run manually after testing the current scenario):
  AITK_NON_INTERACTIVE=1 ./scripts/manage-sandbox.sh <category>:<scenario>
  AITK_NON_INTERACTIVE=1 ./scripts/manage-sandbox.sh <category>:<scenario>

Re-test:
  cd <current-root>/.sandbox
  claude --model sonnet

Findings:
  <status>  <item-path>  →  <scenario-path or "none">     # <invocation-hint>

Scenarios changed but not paired:
  <path>                                                 # unchanged items in the same scenario may still apply
```

Rules for the block:

- List every changed item on its own line under `Findings:`. Sort `stale` and `unmapped` first, then `aligned`, then `none`.
- Use these status labels exactly: `STALE`, `ALIGNED`, `NONE`, `UNMAPPED`.
- For plugin skills, use `<skill-name>` as the item path and append `# /<skill-name>` as the invocation hint. For scripts under `scripts/`, use the path relative to the repo root (`scripts/gov/list.sh`) and omit the hint. For `src/**` items, append `# Closest e2e: bun run check:install` as the hint.
- `Provisioning:` shows exactly one scenario, the next to provision. Always invoke the local script, never `aitk sandbox`. `aitk` is globally installed and resolves to the main repo's scripts, so from a worktree it would run stale scenarios and provision the sandbox outside the worktree.
- `.sandbox/` is a single directory per repo root. Provisioning a second scenario overwrites the first, so the skill provisions one at a time and queues the rest.
- `Queued:` lists every remaining distinct scenario as a full `manage-sandbox.sh` command, one per line, so the user can copy directly. Omit the section when there is only one scenario.
- Omit `Provisioning:` and `Queued:` when every pairing is `NONE` or `UNMAPPED`, since there is nothing to provision.
- Print `cd` and `claude` on separate lines. Do not chain them with `&&`.
- After the `Re-test:` block, print one line: `Note: invoke skills as /<skill-name>, not /toolkit:<skill-name>. The project-scoped copy takes priority.`
- `Scenarios changed but not paired:` lists any scenario in the changed-scenarios list that no Step 2 mapping pointed to. Omit the section when empty.

If every pairing is `ALIGNED` or `NONE`, prefix the block with `✅ All changed items have paired scenario edits.`. Still print the full block so the re-test command is available.

## Step 5: execute re-provision

Immediately after printing the report, run only the `Provisioning:` command. Claude Code's tool permission dialog is the confirmation gate. Do not pause for additional user input.

Do not run any `Queued:` scenarios. The user copies the next command after testing the current one.

Skip this step when every pairing is `NONE` or `UNMAPPED`.

## Do not

- Do not run `claude` or `cd` into the sandbox. The user launches the re-test session.
- Do not propose scenario edits. The skill flags the gap. The user decides whether to edit, rescope, or accept as intentional.
