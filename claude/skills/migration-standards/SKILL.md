---
name: migration-standards
description: Proposes `git mv` commands to relocate a target project's root `snippets/` folder into `.claude/snippets/`, the install layout newer toolkit versions expect. Use when asked to "relocate snippets", "move snippets to .claude", "migrate snippets to .claude", or after a toolkit upgrade leaves a rule pointing at `.claude/snippets/` while the files sit at the root. Do NOT auto-execute moves or edit rule files. Proposal only.
---

# Claude standards relocate

Snippets is the one domain this skill relocates. Standards used to travel beside it and the toolkit corpus now installs into no project at all, so a root `standards/` folder in a target holds work the project authored and nothing proposes moving it. `aitk standards <name>` reads a toolkit standard wherever a session needs one.

## Guards

- If `snippets/` does not exist at `pwd`, stop: `❌ No root snippets/ to relocate.`
- If `pwd` is not a git work tree, stop: `❌ Not a git repository. git mv needs version control.`

## Step 1: read the report

Run `aitk sync --check . --json` from the project root. Its `unmigrated` array is the detection. Each entry carries `domain`, `rootPath`, `installPath`, and `files`, and a domain appears only when the root folder holds a file the toolkit ships and nothing sits at the install path. Report `files` as the count, since it excludes files the project wrote into the same folder.

Run these beside it, in parallel. The report answers whether to move and neither of these is derivable from it:

- `ls .claude/snippets/ 2>/dev/null`: separate a domain already relocated from one never installed, which the report cannot, since both are absent from `unmigrated`
- `git status --short 2>/dev/null`: confirm a clean tree before proposing moves

### When the report is unavailable

Fall back to `ls snippets/` on any of three conditions. Say in the output that the count is unfiltered, because a root folder can hold project-authored files the report would have excluded and the fallback counts every one of them.

- `aitk` is not on `PATH`
- The command exits non-zero
- The report parses and carries no `unmigrated` key at all

The third is the one that decides whether this skill works for the projects it exists for. `unmigrated` reached a release in `0.46.0`, and a CLI older than that exits zero with a well-formed report that never mentions the field. Reading an absent key as an empty list sends the run down the nothing-to-relocate branch and reports a clean layout to a project whose every domain sits at the root, which is a silent false negative where the unfiltered count is a visible imprecision.

An absent key and an empty array are different states, so test for the key rather than for emptiness. A current CLI reporting `"unmigrated": []` has looked and found nothing, and falling back there would trade a correct answer for a listing that proposes moving whatever the folder happens to hold.

Do not fall back on `historyUnavailable`. That field reports failed attribution on a domain or on `seeds`, and `unmigrated` is a filesystem read carrying no attribution of its own, so a report that cannot date a file still detects the layout correctly.

## Step 2: check conflicts

- If `.claude/snippets/` already holds `.md` files, mark snippets as "already relocated" and skip the move.
- If `git status` is not clean, add a TODO line telling the user to commit or stash first. `git mv` on a dirty tree mixes the move with unrelated changes.
- If the root folder holds files and no domain names it in a report that carried the key, propose nothing. The content is the project's own, and moving it under `.claude/` puts project files where a sync walks. This reads a present key alone. A report with no `unmigrated` key never reaches here, since Step 1 sends it to the fallback.
- A root `standards/` folder is never a conflict and never a move. Say so in one line when one is present, since a user who came here expecting both domains reads silence as an oversight.

## Step 3: find author-owned inbound references

Toolkit-owned rules and skills are re-synced, so do not rewrite them. Surface only references the user authored:

```bash
git grep -n "snippets/" -- 'CLAUDE.md' '.claude/rules/**' 'docs/**' 2>/dev/null
```

Report each hit as a TODO line. Exclude paths already under `.claude/snippets/`.

## Step 4: output

Print one grouped proposal block. Omit empty groups.

```markdown
## Relocate

- snippets/ → .claude/snippets/ (<count> files)

## Already relocated

- .claude/snippets/ exists. Skipping.

## Left alone

- standards/ is the project's own. No toolkit standard installs into a project.

## Suggested git mv commands

mkdir -p .claude
git mv snippets .claude/snippets

## Re-sync after moving

aitk snippets sync .
aitk gov sync .

## Inbound references to verify

- CLAUDE.md:42 references snippets/align.md
- docs/contributing.md:8 references snippets/claude/feature

## Reminder

Re-syncing reinstalls toolkit-owned rules and snippets at the new path. Author-owned references above need a manual one-line fix.
```

Two states produce no proposal at all, and each gets its own line rather than an empty block:

- The folder already lives under `.claude/`: `✅ snippets/ already lives under .claude/. Nothing to relocate.`
- The root folder exists and no domain names it in `unmigrated`: `✅ snippets/ holds no file the toolkit installed. Nothing to relocate.` The guard passed because the folder is there, so a session that printed nothing would leave the user reading silence as a failed run rather than as the answer.

Read the `toolkit-cli` skill before printing the re-sync block, and name in the reminder any surface it lists as overwritten. The user runs those commands against a tree the moves above relocated, and that relocation is what puts an overwrite onto files never installed at the new path.

Do not run the `git mv` commands. Do not edit `CLAUDE.md`, rule files, or docs. The user runs the commands and fixes author-owned references after reviewing.
