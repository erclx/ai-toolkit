---
name: claude-worktree
description: Enters a Claude Code worktree at `.claude/worktrees/<name>/` with a name derived from the active plan or branch. Use when asked to "enter a worktree", "start a worktree", "work in a worktree", or at the plan-to-execute boundary after `/claude-feature`. Do NOT use to list, clean up, or rotate worktrees.
---

# Claude worktree

Wrap the `EnterWorktree` entry path with name derivation so the user does not pick a name by hand.

## Guards

- If `git rev-parse --git-dir` and `git rev-parse --git-common-dir` differ, the session is already inside a linked worktree. Stop: `❌ Already in a worktree. Run ExitWorktree first.`
- If neither command resolves, the session is not in a git repo and no `WorktreeCreate` hook is configured. Stop: `❌ Not a git repository. EnterWorktree needs git or a WorktreeCreate hook.`

## Step 1: resolve the main worktree root

Run in parallel:

- `git worktree list --porcelain | awk '/^worktree /{print $2; exit}' 2>/dev/null || pwd`
- `git branch --show-current 2>/dev/null || echo ""`
- `git config --get core.bare 2>/dev/null || echo false`

Plans always live at the main root, never inside a linked worktree. See Worktrees in `CLAUDE.md`.

`EnterWorktree` writes `core.bare = true` into the shared config, and nothing restores it, so the repository can already be broken before this session arrives. Repair it before entering when the value is `true` and `<main-root>/.git` is a directory:

```bash
git config core.bare false
```

The directory test separates the defect from a genuinely bare repository, which keeps its objects at the root and has no `.git` directory. Announce the repair in one line naming the flag. Leave the file alone when the value is already `false`.

## Step 2: derive the worktree name

Try each source in order. Stop at the first match.

1. **Plan matched to current branch.** Derive `<slug>` per `.claude/standards/slug.md`, or `${CLAUDE_SKILL_DIR}/../../standards/slug.md` when the project does not have it. An empty result falls through to the next source here rather than becoming `latest`, since the slug is one candidate among several. If `<main-root>/.claude/plans/feature-<slug>.md` exists, use `<slug>`.
2. **Single plan file.** List `<main-root>/.claude/plans/feature-*.md`. If exactly one match, derive `<slug>` from the filename.
3. **Multiple plan files, no branch match.** Ask the user which plan. Show the candidate slugs as a numbered list. Do not pick.
4. **Current branch.** When no plan exists, use the `<slug>` from step 1 if it is not `main` or `master`.
   4b. **Session context.** When on `main` or `master` with no matching plan, read the current conversation to infer a kebab slug from the topic being discussed. Propose it: `Infer: <slug>. Confirm or rename?` Do not enter the worktree until the user confirms or provides a corrected name.
5. **Ask.** None of the above applies. Ask the user for a name. Do not invent one.

Validate the result: letters, digits, dots, underscores, dashes only, max 64 chars (`/` separators are also allowed). If the derived name violates the rule, sanitize by replacing invalid chars with `-` and truncating. Show the sanitized name in the preview before invoking.

## Step 3: preview

Output exactly:

```plaintext
Worktree: .claude/worktrees/<name>/
Source: <plan|branch|user>
```

## Step 4: enter

Call `EnterWorktree` with `name: "<name>"`. Claude Code's tool permission dialog is the confirmation gate. Do not pause for additional confirmation.

## Step 5: align the branch name and repair the shared config

`EnterWorktree` creates a branch named `worktree-<name>`, which diverges from `<name>` and breaks downstream slug derivation in `claude-autoship` and any skill that reads `git branch --show-current`. Rename it to match:

```bash
git branch -m worktree-<name> <name>
```

Before renaming, guard against a collision: if `git show-ref --verify --quiet refs/heads/<name>` succeeds, the target branch already exists. Stop: `❌ Branch <name> already exists. Resolve manually before continuing.` Do not delete the existing branch.

Skip the rename if the worktree was entered via `path` rather than `name`, since the branch already exists under its own identity.

Entry also sets `core.bare = true` in the shared config, which strands the main worktree. Every later command run there fails with `fatal: this operation must be run in a work tree` while the files sit untouched on disk. The linked worktree keeps working, so nothing surfaces until the operator returns to the main checkout. Repeat the Step 1 repair, which writes the parent's config even from inside the linked worktree:

```bash
git config core.bare false
```

The flag is not set on every entry, so read before writing and announce only when the write happened. Tracked upstream as `anthropics/claude-code#58345`, closed as not planned, so the repair stays until the tool changes.

Do not invoke `ExitWorktree` from this skill. Exit is the user's call.
