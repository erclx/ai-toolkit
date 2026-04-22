---
name: git-worktree
description: Lists linked worktrees with PR state and cleans up merged ones. Use when asked to "list worktrees", "clean up worktrees", or after shipping a PR to reclaim slots. Do NOT use to enter a worktree from scratch (use `claude-worktree`).
---

# Git worktree

See `wiki/claude-worktrees.md` for worktree semantics and the "Shipping from worktrees" workflow. For entry, use `claude-worktree`.

## Mode selection

Pick exactly one mode from the user's request:

- `list`: show every worktree with its branch, PR state, and dirtiness ("list worktrees", "what worktrees do I have")
- `cleanup`: remove worktrees whose branches are merged, then prune local branches ("clean up worktrees", "reclaim worktree slots")

## Context

Run in parallel:

- `git rev-parse --git-dir 2>/dev/null || echo "NO_REPO"`
- `git rev-parse --git-common-dir 2>/dev/null || echo "NO_REPO"`
- `git worktree list --porcelain 2>/dev/null || echo "NO_REPO"`
- `git fetch --prune origin 2>/dev/null || echo "NO_REMOTE"`

Resolve `MAIN_ROOT` from the first `worktree` line of `git worktree list --porcelain`.

## Guards

- If either `git-dir` command returned `NO_REPO`, stop: `❌ Not a git repository.`

## Enumeration (list and cleanup)

Parse `git worktree list --porcelain` into rows. Each row has `path`, `branch`, `head`. Skip the `bare` row if present.

For each row, determine merge state of its branch:

1. Skip the main-root row. Mark it `main` with no PR lookup.
2. Try `gh pr view <branch> --json state,number,url 2>/dev/null`:
   - `MERGED`: state is `merged`, record PR number and URL.
   - `OPEN`: state is `open`, record PR number and URL.
   - `CLOSED`: state is `closed` (not merged), record PR number.
   - Command fails or returns no PR: fall through.
3. Fallback: `git branch --merged main 2>/dev/null | grep -qx "  <branch>"` to detect linear-merge ancestry. On match, mark `merged (local)`. Otherwise `unmerged`.

Determine dirtiness: `git -C <path> status --porcelain` non-empty means `dirty`.

Determine current: the row whose `path` matches the session's current worktree path (from `MAIN_ROOT` enumeration compared to `pwd`).

## `list` mode

Print the enumeration as a table, then stop. `list` has no final command.

```plaintext
| #  | Path                               | Branch            | State    | PR     | Notes    |
| -- | ---------------------------------- | ----------------- | -------- | ------ | -------- |
```

Notes column shows `current`, `dirty`, or empty. Show paths relative to `MAIN_ROOT` (`.claude/worktrees/<name>`).

After the table, append a one-line hint:

- If any row is `merged` and clean and not current: `Hint: /git-worktree cleanup to remove <count> merged worktrees.`
- Otherwise: `Hint: no worktrees ready for cleanup.`

## `cleanup` mode

From the enumeration, include a worktree in the remove set when all hold:

- Not the main row.
- Not the current session's worktree.
- State is `merged` or `merged (local)`.
- Working tree is clean.

Every other non-main row goes to the skip set with a one-word reason: `current`, `dirty`, `open`, `closed`, `unmerged`.

### Preview

```plaintext
**Removing:** <count>

| Path | Branch | PR |
| ---- | ------ | -- |

**Skipping:** <count>

| Path | Branch | Reason |
| ---- | ------ | ------ |
```

If the remove set is empty, stop with `❌ Nothing to remove. All linked worktrees are current, dirty, or unmerged.`

### Final command

After the preview, execute immediately. Claude Code's tool permission dialog is the confirmation gate. Do not wait for user input.

```bash
git -C <MAIN_ROOT> worktree remove <path1> \
  && git -C <MAIN_ROOT> branch -D <branch1> \
  && git -C <MAIN_ROOT> worktree remove <path2> \
  && git -C <MAIN_ROOT> branch -D <branch2> \
  && git -C <MAIN_ROOT> worktree prune
```

Chain one `worktree remove` + `branch -D` pair per row in the remove set, then a single `worktree prune` at the end.

## After execution

Respond with exactly one line:

- `list`: `✅ <n> worktrees listed`
- `cleanup`: `✅ Removed: <count> worktrees, <count> branches pruned`

Do not add any other text.
