---
name: migration-standards
description: Proposes `git mv` commands to relocate a target project's root `standards/` and `snippets/` folders into `.claude/standards/` and `.claude/snippets/`, the install layout newer toolkit versions expect. Use when asked to "relocate standards", "move standards to .claude", "migrate snippets to .claude", or after a toolkit upgrade leaves rules pointing at `.claude/standards/` while the files sit at the root. Do NOT auto-execute moves or edit rule files. Proposal only.
---

# Claude standards relocate

## Guards

- If neither `standards/` nor `snippets/` exists at `pwd`, stop: `❌ No root standards/ or snippets/ to relocate.`
- If `pwd` is not a git work tree, stop: `❌ Not a git repository. git mv needs version control.`

## Step 1: read the report

Run `aitk sync --check . --json` from the project root. Its `unmigrated` array is the detection. Each entry carries `domain`, `rootPath`, `installPath`, and `files`, and a domain appears only when the root folder holds a file the toolkit ships and nothing sits at the install path. Report `files` as the count, since it excludes files the project wrote into the same folder.

Run these beside it, in parallel. The report answers which domains to move and neither of these is derivable from it:

- `ls .claude/standards/ 2>/dev/null`: separate a domain already relocated from one never installed, which the report cannot, since both are absent from `unmigrated`
- `ls .claude/snippets/ 2>/dev/null`: the same, for the other domain
- `git status --short 2>/dev/null`: confirm a clean tree before proposing moves

Keep the two listings as separate commands. `ls` labels its output with a `dir:` header only when more than one operand succeeds, so a combined call with one directory present prints that directory's filenames bare while the redirect swallows the other's failure, and the result reads as whichever directory was expected.

### When the report is unavailable

Fall back to `ls standards/*.md` and `ls snippets/` when `aitk` is not on `PATH` or the command exits non-zero. Say in the output that the counts are unfiltered, because a root folder can hold project-authored files the report would have excluded and the fallback counts every one of them.

Do not fall back on `historyUnavailable`. That field reports failed attribution on a domain or on `seeds`, and `unmigrated` is a filesystem read carrying no attribution of its own, so a report that cannot date a file still detects the layout correctly.

## Step 2: check conflicts

- If `.claude/standards/` already holds `.md` files, mark standards as "already relocated" and skip its move.
- If `.claude/snippets/` already holds `.md` files, mark snippets as "already relocated" and skip its move.
- If `git status` is not clean, add a TODO line telling the user to commit or stash first. `git mv` on a dirty tree mixes the move with unrelated changes.
- If a root folder holds files and no domain names it in `unmigrated`, propose nothing for it. The content is the project's own, and moving it under `.claude/` puts project files where a sync walks.

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

Two states produce no proposal at all, and each gets its own line rather than an empty block:

- Both folders already live under `.claude/`: `✅ standards/ and snippets/ already live under .claude/. Nothing to relocate.`
- A root folder exists and no domain names it in `unmigrated`: `✅ <folder>/ holds no file the toolkit installed. Nothing to relocate.` Name every such folder. The guard passed because the folder is there, so a session that printed nothing would leave the user reading silence as a failed run rather than as the answer.

Do not run the `git mv` commands. Do not edit `CLAUDE.md`, rule files, or docs. The user runs the commands and fixes author-owned references after reviewing.
