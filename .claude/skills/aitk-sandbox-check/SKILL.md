---
name: aitk-sandbox-check
description: Audits the current branch for plugin-skill edits that lack a matching sandbox scenario update. Reports per-skill pairings, re-provisions changed scenarios, and prints the re-test command. Does not launch Claude in the sandbox.
disable-model-invocation: true
---

# Sandbox check

Manual guard after editing a plugin skill. Reports whether each changed skill has a paired scenario edit, re-provisions changed scenarios, and prints the re-test command for the user to launch.

## Guards

- If the current branch is `main` or `master`, stop: `❌ On main. Checkout a feature branch first.`
- If `git diff "$(git merge-base main HEAD)" --name-only -- 'claude/skills/**/SKILL.md'` is empty, stop: `✅ No plugin skill changes since main.`

## Step 1: collect changed files

Run in parallel from the worktree root:

```bash
git diff "$(git merge-base main HEAD)" --name-only -- 'claude/skills/**/SKILL.md'
```

```bash
git diff "$(git merge-base main HEAD)" --name-only -- 'scripts/sandbox/**/*.sh'
```

```bash
pwd
```

The first list is the changed plugin skills. The second list is the changed scenarios. The third is the current root, whether that is main or a linked worktree. `.sandbox/` lives under whichever root ran `manage-sandbox.sh`, because the script resolves `PROJECT_ROOT` from its own path.

## Step 2: map each changed skill to a scenario

For each changed skill path `claude/skills/<skill-name>/SKILL.md`:

1. Split `<skill-name>` on the first `-` into `<category>` and `<rest>`.
2. Check whether `scripts/sandbox/<category>/<rest>.sh` exists in the worktree.
3. If it exists, record that path as the scenario.
4. If it does not exist, do not guess. Ask the user: `Scenario for <skill-name>? (path under scripts/sandbox/, or "none" if the skill has no scenario)`. Record the answer. Accept `none` as an explicit opt-out.

Do not guess past the first fallback. Fuzzy matching across sandbox categories produces wrong pairings (`gov-install` is `infra/gov.sh`, not `gov/install.sh`).

## Step 3: classify each pairing

- **aligned**: scenario path is set and appears in the changed-scenarios list.
- **stale**: scenario path is set but does not appear in the changed-scenarios list.
- **none**: user answered `none` in Step 2.
- **unmapped**: no scenario file was identified and the user did not answer `none`.

## Step 4: re-provision changed scenarios

For each distinct scenario recorded in Step 2 with an `ALIGNED` or `STALE` pairing, preview the command on one line and run it. Skip scenarios classified as `NONE` or `UNMAPPED`, since they have nothing to provision.

Preview and run for each scenario:

```bash
AITK_NON_INTERACTIVE=1 ./scripts/manage-sandbox.sh <category>:<scenario>
```

Claude Code's tool permission dialog is the confirmation gate. Do not pause for additional user input after the preview.

Always invoke the local script, never `aitk sandbox`. `aitk` is globally installed and resolves to the main repo's scripts, so from a worktree it would run stale scenarios and provision the sandbox outside the worktree.

## Step 5: print the report

Print one block to chat:

```plaintext
Sandbox check

Re-test:
  cd <current-root>/.sandbox
  claude --model sonnet

Findings:
  <status>  <skill-name>  →  <scenario-path or "—">     # /<skill-name>

Scenarios changed but not paired:
  <path>                                                 # unchanged skills in the same scenario may still apply
```

Rules for the block:

- List every changed skill on its own line under `Findings:`. Sort `stale` and `unmapped` first, then `aligned`, then `none`.
- Use these status labels exactly: `STALE`, `ALIGNED`, `NONE`, `UNMAPPED`.
- Include a trailing `# /<skill-name>` invocation hint on every line so the user can copy a specific skill's trigger straight into the Claude session.
- Print `cd` and `claude` on separate lines. Do not chain them with `&&`.
- After the `Re-test:` block, print one line: `Note: invoke skills as /<skill-name>, not /toolkit:<skill-name>. The project-scoped copy takes priority.`
- `Scenarios changed but not paired:` lists any scenario in the changed-scenarios list that no skill in Step 2 mapped to. Omit the section when empty.

If every pairing is `ALIGNED` or `NONE`, prefix the block with `✅ All changed skills have paired scenario edits.`. Still print the full block so the re-test command is available.

## Do not

- Do not run `claude` or `cd` into the sandbox. The user launches the re-test session.
- Do not propose scenario edits. The skill flags the gap. The user decides whether to edit, rescope, or accept as intentional.
