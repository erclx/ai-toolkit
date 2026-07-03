---
name: migration-standards
description: Proposes `git mv` commands to relocate a target project's root `standards/` and `snippets/` folders into `.claude/standards/` and `.claude/snippets/`, the install layout newer toolkit versions expect. Use when asked to "relocate standards", "move standards to .claude", "migrate snippets to .claude", or after a toolkit upgrade leaves rules pointing at `.claude/standards/` while the files sit at the root. Do NOT auto-execute moves or edit rule files. Proposal only.
---

# Claude standards relocate

## Guards

- If neither `standards/` nor `snippets/` exists at `pwd`, stop: `❌ No root standards/ or snippets/ to relocate.`
- If `pwd` is not a git work tree, stop: `❌ Not a git repository. git mv needs version control.`

## Step 1: discover

Run these in parallel from the project root:

- `ls standards/*.md 2>/dev/null`: root standards present
- `ls snippets/ 2>/dev/null`: root snippets present
- `ls .claude/standards/ 2>/dev/null`: detect an existing target copy
- `ls .claude/snippets/ 2>/dev/null`: detect an existing target copy
- `git status --short 2>/dev/null`: confirm a clean tree before proposing moves

## Step 2: check conflicts

- If `.claude/standards/` already holds `.md` files, mark standards as "already relocated" and skip its move.
- If `.claude/snippets/` already holds `.md` files, mark snippets as "already relocated" and skip its move.
- If `git status` is not clean, add a TODO line telling the user to commit or stash first. `git mv` on a dirty tree mixes the move with unrelated changes.

## Step 3: find author-owned inbound references

Toolkit-owned rules and skills are re-synced, so do not rewrite them. Surface only references the user authored:

- `git grep -n "standards/" -- 'CLAUDE.md' '.claude/rules/**' 'docs/**' 2>/dev/null`
- `git grep -n "snippets/" -- 'CLAUDE.md' '.claude/rules/**' 'docs/**' 2>/dev/null`

Report each hit as a TODO line. Exclude paths already under `.claude/standards/` or `.claude/snippets/`.

## Step 4: output

Print one grouped proposal block. Omit empty groups.

```markdown
## Relocate

- standards/ → .claude/standards/ (<count> files)
- snippets/ → .claude/snippets/ (<count> files)

## Already relocated

- .claude/standards/ exists. Skipping.

## Suggested git mv commands

mkdir -p .claude
git mv standards .claude/standards
git mv snippets .claude/snippets

## Re-sync after moving

aitk standards sync .
aitk gov sync .

## Inbound references to verify

- CLAUDE.md:42 references standards/prose.md
- docs/contributing.md:8 references snippets/claude/feature

## Reminder

Re-syncing reinstalls toolkit-owned rules and standards at the new path. Author-owned references above need a manual one-line fix.
```

If both folders are already relocated, output: `✅ standards/ and snippets/ already live under .claude/. Nothing to relocate.`

Do not run the `git mv` commands. Do not edit `CLAUDE.md`, rule files, or docs. The user runs the commands and fixes author-owned references after reviewing.
