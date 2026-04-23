---
name: aitk-sandbox-check
description: Audits the current branch for plugin-skill edits that lack a matching sandbox scenario update. Prints a per-skill report and copy-paste commands for re-provisioning the sandbox and launching Claude Code against the worktree's plugin dir. Manual-only. Does not execute sandbox or Claude commands.
disable-model-invocation: true
---

# Sandbox check

Manual guard after editing a plugin skill. Reports whether each changed skill has a paired scenario edit, and prints the exact commands to re-provision and re-test. Output-only. Never runs the sandbox or Claude.

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
git rev-parse --show-toplevel
```

```bash
git worktree list --porcelain | awk '/^worktree /{print $2; exit}'
```

The first list is the changed plugin skills. The second list is the changed scenarios. The third is the worktree root used in the `--plugin-dir` path. The fourth is the main worktree root, where `.sandbox/` lives.

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

## Step 4: print the report

Print one block to chat. Do not write a file.

```plaintext
Sandbox check

Re-provision:
  aitk sandbox reset
  aitk sandbox <category>:<scenario>   # for each distinct scenario below

Re-test:
  cd <main-root>/.sandbox
  claude --plugin-dir <worktree-root>/claude --model sonnet

Findings:
  <status>  <skill-name>  →  <scenario-path or "—">     # /<skill-name>

Scenarios changed but not paired:
  <path>                                                 # unchanged skills in the same scenario may still apply
```

Rules for the block:

- List every changed skill on its own line under `Findings:`. Sort `stale` and `unmapped` first, then `aligned`, then `none`.
- Use these status labels exactly: `STALE`, `ALIGNED`, `NONE`, `UNMAPPED`.
- Include a trailing `# /<skill-name>` invocation hint on every line so the user can copy a specific skill's trigger straight into the Claude session.
- The `Re-provision:` block lists each distinct scenario once, in the form `aitk sandbox <category>:<scenario>` where `<scenario>` is the `.sh` filename without the extension.
- Replace `<worktree-root>` in the `Re-test` line with the output of `git rev-parse --show-toplevel`. Do not hardcode a path.
- `Scenarios changed but not paired:` lists any scenario in the changed-scenarios list that no skill in Step 2 mapped to. Omit the section when empty.

If every pairing is `ALIGNED` or `NONE`, prefix the block with `✅ All changed skills have paired scenario edits.`. Still print the full block so the re-test commands are available.

## Do not

- Do not run `aitk sandbox`, `claude`, or any other command the report names. The report is output-only.
- Do not write any file. No report persists to disk.
- Do not propose scenario edits. The skill flags the gap. The user decides whether to edit, rescope, or accept as intentional.
