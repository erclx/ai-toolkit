---
name: aitk-sandbox-check
description: Audits the current branch for skill or script edits that lack a matching sandbox scenario update. Reports per-item pairings, drives a headless verification run against the first changed scenario, and prints the interactive re-test command for the rest. Auto-trigger at ship time after editing `claude/skills/**/SKILL.md`, `scripts/**`, or `src/**` when the user signals end-of-feature ("ready to ship", "open PR", "before push", "wrap up", "ship it"). Do NOT auto-trigger on individual file edits mid-feature or on docs-only changes.
---

# Sandbox check

Manual guard after editing a plugin skill or a domain script. Reports whether each changed item has a paired scenario edit, verifies the first changed scenario headlessly, and prints the interactive re-test command for the user to launch against the rest.

Verification runs without a human opening a session. `scripts/sandbox/run.sh` drives a skill through `claude -p`, provisions the scenario itself, and returns a verdict. An item that still ships unverified names which gate stopped it.

## Guards

- If the current branch is `main` or `master`, stop: `❌ On main. Checkout a feature branch first.`
- If both `git diff "$(git merge-base main HEAD)" --name-only -- 'claude/skills/**/SKILL.md' '.claude/skills/**/SKILL.md'` and `git diff "$(git merge-base main HEAD)" --name-only -- 'scripts/**' 'src/**'` are empty, stop: `✅ No skill or script changes since main.`

## Step 1: collect changed files

Run in parallel from the worktree root:

```bash
git diff "$(git merge-base main HEAD)" --name-only -- 'claude/skills/**/SKILL.md' '.claude/skills/**/SKILL.md'
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

The first list is the changed skills, both plugin (`claude/skills/`) and internal (`.claude/skills/`). The second list is the changed scripts (`scripts/`, `src/`). The third is the changed sandbox scenarios. The fourth is the current root, whether that is main or a linked worktree. `.sandbox/` lives under whichever root ran `manage-sandbox.sh`, because the script resolves `PROJECT_ROOT` from its own path.

Drop any path in the script list that already appears in the scenario list. Scenario edits surface through the "Scenarios changed but not paired" tail and do not need a mapping pass.

## Step 2a: map skill changes

For each changed skill path under `claude/skills/<skill-name>/SKILL.md` or `.claude/skills/<skill-name>/SKILL.md`:

1. Split `<skill-name>` on the first `-` into `<category>` and `<rest>`.
2. Check whether `scripts/sandbox/<category>/<rest>.sh` exists in the worktree.
3. If it exists, record that path as the scenario.
4. If it does not exist, do not guess. Ask the user: `Scenario for <skill-name>? (path under scripts/sandbox/, or "none" if the skill has no scenario)`. Record the answer. Accept `none` as an explicit opt-out.

Do not guess past the first fallback. Fuzzy matching across sandbox categories produces wrong pairings (`setup-gov` is `infra/gov.sh`, not `gov/install.sh`).

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

Headless verification (this session runs it):
  scripts/sandbox/run.sh <category>:<rest> "/aitk:<skill-name>"

Interactive re-test (copied to clipboard):
cd <current-root>/.sandbox && claude --plugin-dir <current-root>/claude --model sonnet

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
- `Headless verification:` shows the Step 6 command for the `Provisioning:` scenario alone. Replace the command with `gate: <label>` when a Step 6 skip condition holds, so the report says why before the run is missing rather than after.
- Print the interactive re-test command flush-left as a single chained line (`cd … && claude --plugin-dir … --model sonnet`) so the user can paste it into any terminal. The `--plugin-dir` points at `<current-root>/claude` so unchanged sub-skills (those not dev-injected) stay available to chained skills like `claude-autoship`. Dev-injected skills under the sandbox's `.claude/skills/` still take priority.
- Pipe the same chained command to the clipboard using the first available tool: `wl-copy`, `xclip -selection clipboard`, `pbcopy`, then `clip.exe`. If none are present, drop the `(copied to clipboard)` suffix from the heading and continue silently.
- After the `Interactive re-test:` block, print one line: `Note: in the interactive session, invoke skills as /<skill-name>, not /aitk:<skill-name>. The project-scoped copy takes priority.` The headless prompt in Step 6 uses the qualified form for the opposite reason, so keep the two lines distinct.
- `Scenarios changed but not paired:` lists any scenario in the changed-scenarios list that no Step 2 mapping pointed to. Omit the section when empty.

If every pairing is `ALIGNED` or `NONE`, prefix the block with `✅ All changed items have paired scenario edits.`. Still print the full block so the re-test command is available.

## Step 5: execute re-provision

Immediately after printing the report, run only the `Provisioning:` command. Claude Code's tool permission dialog is the confirmation gate. Do not pause for additional user input.

Do not run any `Queued:` scenarios. The user copies the next command after testing the current one.

Skip this step when every pairing is `NONE` or `UNMAPPED`.

Also skip it when Step 6 runs. `run.sh` provisions the same target before its session, so a separate provision is duplicate work.

## Step 6: run the headless verification

Verify the `Provisioning:` scenario through `scripts/sandbox/run.sh`, which drives the skill under `claude -p` and returns without holding a terminal. One arm per invocation. Never sweep the `Queued:` list, which is what keeps the spend inside the $0.10 to $0.25 a run costs.

Derive both arguments from the Step 2 mapping:

- Target: `<category>:<rest>` from the scenario path `scripts/sandbox/<category>/<rest>.sh`
- Prompt: `/aitk:<skill-name>` with no arguments. The qualified form resolves through `--plugin-dir` whether or not the branch changed the skill, and a bare `/<skill-name>` resolves only for the ones the sandbox injects.

```bash
scripts/sandbox/run.sh <category>:<rest> "/aitk:<skill-name>"
```

Print the target and prompt used before running, since a wrong pairing is invisible in the verdict alone. A scenario that needs prompt arguments is a case to report, not to guess at.

Report the verdict. Do not assert it. `run.sh` merges a `verdict` object into the JSON envelope on stdout carrying `state`, `asserted`, `failed`, and `unchecked`. Print `state` as it came back, and say so when it is `unchecked`, which means the arm declared no expectations and the run asserted nothing. Do not read `unchecked` as a pass or convert it into a failure. `--strict` covers a caller that has finished arming.

Do not fix a failing verdict. The skill surfaces the result and the user decides.

Print one line after the run:

```plaintext
Verification: <state>  <category>:<rest>  →  <asserted> asserted, <failed> failed, <unchecked> unchecked
```

Skip the run and print `Verification: skipped  <category>:<rest>  →  gate: <label>` when either condition holds:

- `no-mechanism`: the `Provisioning:` scenario came from a Step 2b script mapping, so no skill invocation exists to pass as the prompt
- `credentials`: the scenario file declares a `use_anchor` function and `gh auth status` fails. Those scenarios push to a private remote, so the failure is the credential rather than the skill. Check both before running, since no precondition catches this and a missing credential otherwise surfaces as a push error naming the host.

Skip this step whenever Step 5 is skipped.

### Gate vocabulary

An item shipping without live verification names exactly one gate. Cost, credentials, and no-mechanism are different facts with different fixes, and a report that collapses them lets an affordable run and an impossible one read the same.

| Gate           | What it blocks                                                  | Who clears it                                |
| -------------- | --------------------------------------------------------------- | -------------------------------------------- |
| `no-mechanism` | An arm with no scenario, or a claim no assertion kind carries   | A task that writes the scenario or assertion |
| `credentials`  | The `use_anchor` scenarios, off an authenticated machine        | The operator, once                           |
| `cost`         | Nothing at this scale. One arm sits inside the documented range | Nobody, it is already affordable             |

Use `cost` only for a sweep across the catalog the user asked for. A single arm never earns it.

## Do not

- Do not open an interactive sandbox session. An interactive session holds a terminal a headless caller cannot release, so the user launches that one from the `Interactive re-test:` line.
- Do not read the line above as a ban on `scripts/sandbox/run.sh`. The runner returns when its session ends and holds nothing, and Step 6 is where this session uses it.
- Do not sweep the `Queued:` list through the runner. Verify one arm and let the user ask for the rest.
- Do not propose scenario edits. The skill flags the gap. The user decides whether to edit, rescope, or accept as intentional.
