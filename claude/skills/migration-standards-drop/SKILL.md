---
name: migration-standards-drop
description: Proposes the ordered drop of an installed `.claude/standards/` tree and the repoint of every citation at `canon standards <name>`, separating a toolkit copy from a file the project wrote and naming any runtime reader before a delete is proposed. Use when asked to "drop the standards tree", "repoint the standards citations", "my project still has .claude/standards/", or when a toolkit update leaves an installed standards copy no command refreshes. Do NOT delete the tree, run the sync, or rewrite a citation. Proposal only.
---

# Migration standards drop

## Guards

- If `.claude/` does not exist at `pwd`, stop: `❌ No .claude/ directory. Nothing here installed a standards tree.`
- If `.claude/standards/` holds no markdown, that is the pass: `✅ No installed standards tree. Nothing to drop.`
- If `canon` is not on `PATH`, stop: `❌ canon is not on PATH. Every citation this move writes names a verb the target has to run.`

Detection is the directory read above and nothing else. No report names this tree, since the sync engine registers governance alone and the unmigrated scan covers a root layout an older toolkit wrote rather than a copy under `.claude/`. A session waiting for a command to raise the tree waits forever.

## Step 1: read the version the sync would run from

Run `canon sync --check . --json` and read its `skew` object. The sync in Step 5 installs the rules the running binary carries, so a binary predating the citation change installs rules naming the path this move removes, and the sweep then has more to fix than it started with.

- `state` is `behind`: stop. `❌ The canon on PATH is <installed> against <latest> published. A gov sync from it installs rules citing the standards path. Update, then re-run.`
- `state` is `unknown`: report the reason and continue. A version that could not be read is unread rather than stale.
- `state` is `current`: continue.

## Step 2: split the tree three ways

Run `canon standards list --json`. Each entry carries `name` and `content`, so the comparison needs no second read. Match every `.claude/standards/<stem>.md` against `name`:

- **Matched, content identical.** A toolkit copy the corpus still carries unchanged. The drop loses nothing.
- **Matched, content differs.** A toolkit copy that has drifted, and the diff cannot say which side moved. Report it as a read the user owes rather than sorting it either way. All 20 files measured at one target on 2026-08-28 read as changed, because the corpus had moved on since the install, and none of them was project-authored.
- **Unmatched.** No standard resolves under that name. Either the project wrote the file or the toolkit retired the name, and the catalog cannot separate the two.

Report a project-authored file as one this move keeps. Its destination is `standards/<name>.md` at the project root, which `canon standards <name>` resolves ahead of the package corpus, so the citation form Step 4 gives every other file serves it too.

`prose` is the recorded retirement. It split into `markdown.md` plus the `write-human` skill and resolves as no standard at all, so a citation repointed one-to-one from it names nothing. Report an unmatched name as the user's to place and name that split as the instance.

## Step 3: name every runtime reader before naming a delete

Run both from the project root, in parallel:

- `git grep -ln 'claude/standards' -- '*.md'`: the citations Step 4 repoints
- `git grep -ln 'claude/standards' -- . ':!*.md'`: the readers

The extension is the split. Markdown cites the tree and a session reads the citation. A hook, a script, or a config opens a file under it at run time, and dropping the tree under one leaves a check whose input is gone reporting success. Two of the five targets in the 2026-08-28 census carried a reader, one of them a hook hand-parsing a standard for a banned-word set.

Report each reader with what replaces it. A reader parsing a standard for a list the CLI now ships reads that list through the verb instead, which is `canon markdown audit <file> --json` for the banned-word case.

When `pwd` is not a git work tree, say the reader search did not run rather than reporting no reader.

## Step 4: give every citation one target

Every citation repoints to `canon standards <name>`, whatever surface it sits on. One form rather than a choice per surface, which is the part a session gets wrong:

- A rule under `.claude/rules/` is markdown a glob match loads, so `${CLAUDE_SKILL_DIR}` expands to nothing there
- A project-local skill under `.claude/skills/<name>/` expands that variable to its own folder, so `${CLAUDE_SKILL_DIR}/../../standards/` resolves back into the tree being dropped
- `CLAUDE.md` and a context entry expand no variable at all

The plugin-root form belongs to a skill the toolkit ships beside its own corpus. Proposing it inside a target writes a path that resolves to the deleted tree.

A citation naming a name Step 2 left unmatched carries no target. Report it under what the user supplies.

## Step 5: output the ordered proposal

The order is fixed and the reverse is the failure. Deleting before the sync lands the installed rules citing a path that is gone, and sweeping before the sync repoints citations the sync then rewrites. The sweep re-reads after the sync for that reason, since the sync fixes the rules it installed and leaves a project's own rules and prose alone.

Take the drop command from whether the tree is tracked, read with `git ls-files .claude/standards`. A tracked tree goes out through `git rm -r` so the index moves with the files, and an untracked one through `rm -rf`. A tree holding both needs both commands, since `git rm -r` takes the tracked files, exits zero, and leaves every untracked one where it was.

Print the blocks below, omitting any that is empty.

````markdown
## Drop

`.claude/standards/` holds <n> files: <n> unchanged toolkit copies, <n> drifted, <n> matching no standard.

## Read before dropping

- `.claude/standards/<name>.md` drifted from the corpus copy. Confirm the project did not edit it.

## Keep

- `.claude/standards/<name>.md` matches no standard. Move it to `standards/<name>.md` at the project root, which `canon standards <name>` resolves first.

## Runtime readers

- `.claude/hooks/<file>.sh` parses a standard at run time. Route it through `canon markdown audit <file> --json` before the drop, or it reports a clean run having read nothing.

## Citations to repoint

- `CLAUDE.md:42` → `canon standards markdown`
- `.claude/rules/core/<n>-<slug>.md:8` → `canon standards skill`

## You supply

- The destination for the `prose` citations. It split into `markdown.md` plus the `write-human` skill, so no single name replaces it.

## Run in this order

```bash
canon gov sync
git rm -r .claude/standards
```

Then re-read the citations and repoint what the sync left.

## Confirm

Run `canon standards <name>` from inside this project for every name the repointed citations carry, and confirm each resolves.

## Reminder

Nothing above was written or run. The tree holds files a delete cannot recover, so the drop and the sweep are yours to apply.
````

Run nothing and write nothing: not the sync, not a delete or a move under `.claude/standards/`, not a citation rewrite. The install stamp is out of scope too, and travels with whatever else reaches this target. The user applies the move after reviewing it.
