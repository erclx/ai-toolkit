---
name: git-stash
description: Stashes a focused subset of working-tree changes under a conventional message, or lists and pops existing stashes. Use for short-lived context switches within a session ("stash these for later", "park this work"), or when picking work back up ("pop the pr fix", "list stashes"). Do NOT use for parallel feature tracks (use worktrees) or long-running parked work (commit on a branch).
---

# Git stash

Read these files from the project root in parallel:

- `standards/commit.md`: format, types, scopes, and constraints
- `standards/prose.md`: prose conventions for all generated text

## Mode selection

Pick exactly one mode from the user's request:

- `push`: stash a subset of current changes ("stash these", "park this")
- `list`: show existing stashes ("list stashes", "what did I stash")
- `pop`: restore a stash by message match ("pop the pr fix", "bring back the X stash")

## Context

For `push` and `list`, run in parallel:

- `git status --short 2>/dev/null || echo "NO_REPO"`
- `git stash list 2>/dev/null || echo "NO_STASHES"`

For `push`, also run:

- `git diff -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_DIFF"`
- `git diff --cached -- . ':(exclude)*.lock' ':(exclude)*-lock.json' 2>/dev/null || echo "NO_STAGED_DIFF"`

## Guards

- If `git status --short` is empty in `push` mode, stop:
  `❌ No changes to stash.`
- If `git stash list` is empty in `list` or `pop` mode, stop:
  `❌ No stashes.`
- In `pop` mode, if no stash message matches the user's request, stop:
  `❌ No stash matches '<query>'. Run /git-stash list to see options.`

## Selection rules (push mode)

- Pick only the files that share the user's stated concern. Skip unrelated work from other in-flight tracks.
- Treat untracked files as eligible only if the user names them or they clearly belong to the concern. Use `-u` in the stash command when including them.
- A `D` deletion belongs to its concern's stash. Use the path as-is in the pathspec.
- Never bundle two concerns into one stash. If the request spans concerns, ask which one.

## Response format

### Preview (push)

**Concern:** <one-line summary>
**Stash message:** `<type>(<scope>): <subject>`
**Files:** <count>

| Status | File   |
| ------ | ------ |
| M      | <file> |
| ??     | <file> |

**Skipped (unrelated):** <count> files left in working tree.

Count characters in the stash message. Shorten any subject over 72 characters.

### Preview (list)

| #   | Branch   | Message   |
| --- | -------- | --------- |
| 0   | <branch> | <subject> |
| 1   | <branch> | <subject> |

### Preview (pop)

**Match:** `stash@{<n>}` <message>
**Files restored:** <count>

After outputting the preview, execute the final command immediately. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

### Final command (push)

```bash
git stash push -m "<type>(<scope>): <subject>" -- <file1> <file2>
```

Add `-u` before `-m` when untracked files are included.

### Final command (list)

```bash
git stash list
```

### Final command (pop)

```bash
git stash pop stash@{<n>}
```

## After execution

Respond with exactly one line:

- push: `✅ Stashed: <subject>`
- list: `✅ <n> stashes`
- pop: `✅ Popped: <subject>`

Do not add any other text.
