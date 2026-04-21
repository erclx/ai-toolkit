---
name: git-worktree
description: Lists linked worktrees with PR state, cleans up merged ones, and rotates the current worktree onto a fresh branch off main. Use when asked to "list worktrees", "clean up worktrees", "rotate worktree", or after shipping a PR to reclaim slots. Do NOT use to enter a worktree from scratch (use `claude-worktree`).
---

# Git worktree

See `wiki/claude-worktrees.md` for worktree semantics and the "Shipping from worktrees" workflow. For entry, use `claude-worktree`.

## Mode selection

Pick exactly one mode from the user's request:

- `list`: show every worktree with its branch, PR state, and dirtiness ("list worktrees", "what worktrees do I have")
- `cleanup`: remove worktrees whose branches are merged, then prune local branches ("clean up worktrees", "reclaim worktree slots")
- `rotate`: exit the current worktree and enter a fresh one off `main` ("rotate worktree", "start the next feature off main")

## Context

Run in parallel for all modes:

- `git rev-parse --git-dir 2>/dev/null || echo "NO_REPO"`
- `git rev-parse --git-common-dir 2>/dev/null || echo "NO_REPO"`
- `git worktree list --porcelain 2>/dev/null || echo "NO_REPO"`

Resolve `MAIN_ROOT` from the first `worktree` line of `git worktree list --porcelain`. Set `IN_LINKED` to true when `git-dir` and `git-common-dir` differ.

For `cleanup` and `list`, also run:

- `git fetch --prune origin 2>/dev/null || echo "NO_REMOTE"`

## Guards

- If either `git-dir` command returned `NO_REPO`, stop: `❌ Not a git repository.`
- If mode is `rotate` and `IN_LINKED` is false, stop: `❌ rotate requires being inside a linked worktree. From main, use claude-worktree to enter one.`
- If mode is `rotate` and no `<new-name>` argument was given, stop: `❌ rotate needs a new name. Usage: /git-worktree rotate <new-name>`
- If mode is `rotate` and `git rev-parse --verify main 2>/dev/null` fails, stop: `❌ No 'main' branch found at the main root. rotate needs main as the base.`

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

## `rotate` mode

The argument `<new-name>` is the slug for the new worktree. Validate: letters, digits, dots, underscores, dashes, and `/` separators only, max 64 chars. Reject anything else with `❌ Invalid name. Allowed: letters, digits, ., _, -, /. Max 64 chars.`

Additional guards:

- If `git -C <MAIN_ROOT> rev-parse --verify <new-name> 2>/dev/null` succeeds, stop: `❌ Branch <new-name> already exists.`
- If `<MAIN_ROOT>/.claude/worktrees/<new-name>` exists on disk, stop: `❌ Worktree path already exists.`
- If the current worktree is dirty, stop: `❌ Current worktree has uncommitted changes. Commit, stash, or ship before rotating.`

### Preview

```plaintext
Current: <current-path> (branch: <current-branch>, state: <state>)
New: .claude/worktrees/<new-name>/ off main
```

### Final commands

Execute in sequence:

1. `ExitWorktree(action: "keep")` returns the session to `MAIN_ROOT`. The old worktree stays on disk for a future `cleanup` pass.
2. `git -C <MAIN_ROOT> worktree add .claude/worktrees/<new-name> -b <new-name> main` creates the new worktree and branch directly, bypassing `EnterWorktree`'s `worktree-` branch prefix.
3. `EnterWorktree(path: "<MAIN_ROOT>/.claude/worktrees/<new-name>")` enters the freshly created worktree without creating a new branch.

## After execution

Respond with exactly one line:

- `list`: `✅ <n> worktrees listed`
- `cleanup`: `✅ Removed: <count> worktrees, <count> branches pruned`
- `rotate`: `✅ Rotated to .claude/worktrees/<new-name>/ on branch <new-name>`

Do not add any other text.
