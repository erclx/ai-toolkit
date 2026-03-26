---
name: toolkit-sync
description: Commits and ships a toolkit sync in a target project. Use after manually syncing files from ai-toolkit (standards, snippets, tooling, governance, etc.). Stages all changes, writes one chore(sync) commit, renames current branch to chore/toolkit-sync, and opens a PR listing synced folders. Do NOT use for feature work or general commits.
disable-model-invocation: true
---

# Toolkit sync

## Guards

Run in parallel:

- `git diff --name-only main 2>/dev/null || echo "NO_DIFF"`
- `git status --short 2>/dev/null || echo "NO_STATUS"`

If both outputs are empty or `NO_DIFF`/`NO_STATUS`, stop: `❌ No changes since main. Nothing to sync.`

Check if branch `chore/toolkit-sync` exists on remote:

- `git ls-remote --heads origin chore/toolkit-sync 2>/dev/null`

If output is non-empty, stop: `❌ Branch chore/toolkit-sync already exists on remote. Merge or delete it before syncing again.`

## Domain labels

Map top-level folders to human-readable domain labels for use in the commit and PR:

| Folder       | Label        |
| ------------ | ------------ |
| `standards/` | `standards`  |
| `snippets/`  | `snippets`   |
| `prompts/`   | `prompts`    |
| `.cursor/`   | `governance` |

For any folder not in this map, use the folder name as-is.

## Discovery

Run `git diff --name-only main 2>/dev/null` and collect the unique top-level folders from the output. Map each to its label using the table above.

For each domain folder, run `git diff --name-only main -- <folder> 2>/dev/null` to get the specific files changed. Use the filenames to write a one-line description of what changed (e.g. `prose.md, readme.md` → `prose and readme conventions`).

## Preview

Output before executing:

```
Domains synced: <comma-separated folder list>
Commit: chore(sync): update <domains> from toolkit
Branch: chore/toolkit-sync
```

Then execute immediately. Do not wait for user input.

## Execute

Run in sequence:

1. `git add -A`
2. Commit: `git commit -m "chore(sync): update <domains> from toolkit"`
3. `git branch -m chore/toolkit-sync`
4. `git push -u origin chore/toolkit-sync`
5. Open PR using the format defined in the PR format section below

## PR format

Read in parallel before writing the PR body:

- `standards/pr.md`: structure, sections, and banned phrases
- `standards/prose.md`: prose conventions

Title: `chore(sync): update <domains> from toolkit`

Body follows `standards/pr.md` template:

```
## Summary

Sync <domains> from toolkit.

## Key Changes

- Sync `<folder>/` - <one-liner of what changed>.
<repeat per domain>
```

Write body to `.claude/.tmp/pr-body.md`, then open PR with `--body-file`:

```bash
mkdir -p .claude/.tmp && cat <<'BODY' > .claude/.tmp/pr-body.md
<body content>
BODY
gh pr create --title "<title>" --body-file .claude/.tmp/pr-body.md && rm .claude/.tmp/pr-body.md
```

## After completion

Output exactly:

`✅ Synced: <pr-url>`
