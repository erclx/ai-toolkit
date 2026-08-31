---
title: Key Changes bijection
description: Comparing the files a pull request body's Key Changes names against its own diff, the two directions and why they are graded apart, the span rules the extractor was measured into, and the three refusals that separate a clean pass from a read that produced nothing
---

# Key Changes bijection

`aitk pr key-changes` reads the `## Key Changes` section of a pull request body, lifts the paths its bullets claim, and compares that set against the files the pull request actually changed. This repository squash-merges, so the body becomes the commit message and the record on the trunk once the branch is gone.

```bash
aitk pr key-changes
aitk pr key-changes 1265 --json
aitk pr key-changes --body .claude/.tmp/pr/body.md --base origin/main
```

| Option          | Behavior                                                           |
| --------------- | ------------------------------------------------------------------ |
| `[number]`      | Pull request to read, defaulting to the one open on this branch    |
| `--body <path>` | Read the body from a file, taking the changed set from git instead |
| `--base <ref>`  | Far side of the range when `--body` supplies the body              |
| `--root <path>` | Repository to read, defaulting to the cwd                          |
| `--json`        | Add a machine-readable record on stdout, keeping the frame         |

Without `--body` the body, the file list, and the head commit come back from one `gh pr view` call, because the three have to describe the same commit and reading them apart leaves a window where a push between them compares a body against another head's files.

That view caps its file list at 100 rows and says nothing about having done so, which was measured against `#1250`: the pull request carries 101 files and the view reports 100. A pull request at the cap therefore takes a second read through the paginated endpoint, and a failure there refuses with `gh-truncated` rather than comparing against a set known to be short. A set silently one file short is the worst input this takes, since the missing file is exactly what a correct bullet would then be accused of inventing.

## The two directions

They are reported apart because they want different tolerances.

- **`unmet`** is a whole path the body claims and the diff does not carry. This is the graded direction and it sets the exit code. A bullet naming an untouched file is wrong more often than not, and it corrupts the record that reaches the trunk.
- **`unnamed`** is a changed file no bullet reached. Reported with no grade, since the class covers a real omission and equally a lockfile, a generated asset, or a regenerated index that earns no bullet. Grading it would fire on nearly every branch.
- **`unresolved`** is a path written partially, such as `claude-worker/SKILL.md` for a file under `claude/skills/`. It is judged in neither direction.

A partial path can credit a changed file and can never accuse one. Nothing separates a path written short from a path written wrong, so the asymmetry keeps the accusing direction to spans the tree can anchor.

## What counts as a claim

Only `## Key Changes` is read. `## Technical Context` legitimately names files a branch never touched, such as an install stamp inside a target, so widening the read manufactures a finding out of every argument an author made for the change.

Inside the section, the claim region of a bullet ends at its first comma outside a backticked span. That one lever was chosen by measurement. Over the 23 merged pull requests in this repository carrying the section, reading whole bullets reported 16 paths as claimed-but-untouched and every one was a file the body named for context. Cutting at the comma left 110 claims of the original 149 and took the false reports to 2. A list of sixteen clause-opening words tried beside it removed nothing the comma had not already removed, because this corpus punctuates every one of them.

A span inside the claim region has to survive all of these:

| Rule                                              | What it keeps out                                      |
| ------------------------------------------------- | ------------------------------------------------------ |
| No whitespace, `<`, `>`, `$`, `*`, `\|`, `?`, `^` | A backticked command, a placeholder, a glob, a pattern |
| No `://` and no leading `/`, `~`, `@`, `#`, `!`   | A URL, an absolute path, a module alias                |
| Contains `/`                                      | A bare filename with no folder around it               |
| Extension starts with a letter, or ends with `/`  | A dotted number such as an address                     |
| Not a single top-level folder                     | `src/`, which nobody claims to have rewritten whole    |
| A `file:line` span leads its bullet               | A citation into a file the bullet is describing        |

The last two rows earn their place from the corpus rather than from a rule. Every body that spelled a lone top-level folder was naming where something lives, and a line citation that follows another claim in the same bullet points into the file being described rather than naming a second one. A line citation leading its bullet stays a claim, which is how a body names the exact line it rewrote.

A folder claim covers every changed file beneath it. A bare filename drops outright: resolved as a sibling of a path earlier in its bullet it produced seven wrong paths across this corpus against two right ones, because a compound bullet names a sibling folder as often as a sibling file.

## Anchoring

A claim is anchored when its first segment names a folder the tree holds. The roots come from the tracked file list joined with the first segment of every changed path, and the second half is what admits a folder the branch created. Reading the tree alone would mark every claim under a new top-level directory unanchored, and an unanchored claim never accuses, so the first branch to open one would lose the graded direction with nothing reporting it.

## Exit codes and refusals

| Code | Meaning                                           |
| ---- | ------------------------------------------------- |
| `0`  | every claimed path is in the diff                 |
| `1`  | refused, with `reason` naming the cause           |
| `2`  | at least one claimed path is absent from the diff |

Branch on the record rather than on the exit code. A shell function wrapping `aitk` takes its status from whatever it runs last, so every non-zero exit can reach a caller as zero.

Three refusals separate a clean pass from a read that produced nothing:

- `no-section`. The body carries no such heading, so it claims nothing.
- `no-claims`. The heading is there and no span resolved, which is the extractor failing over prose rather than the body being wrong. Nothing is raised.
- `no-changes`. The pull request changed no files, so no claim has anything to answer.

An empty extraction read as a clean pass is the failure shape this repository has recorded twice, which is why the middle one is its own reason rather than a zero count.

`gh-missing`, `gh-failed`, `gh-truncated`, `unreadable-body`, `unreadable-tree`, `no-base`, `bad-base`, and `unreadable-changes` cover the reads that never reached a comparison.

## What it was measured against

Driven over the 40 most recent merged pull requests in this repository, 23 of which carry the section, the shipped verb reported zero unmet paths and one `no-claims` refusal. The naive extractor it replaced reported 16.

The bound is that the corpus is one repository writing to one house style. A project that punctuates differently loses claims to the comma cut rather than gaining false ones, since every rule above drops rather than invents, so the check degrades toward silence rather than toward noise.

What it cannot see is a bullet claiming a change to a file the branch did touch for another reason, a path written without backticks, and a claim in a second coordinated clause after the comma. The last of those falls to the ungraded direction rather than out of the reading.

## Where it runs

`claude-pr-review` Step 3 calls it and files an `unmet` path as a `should-fix` finding under the `**PR body**` block the stale ticked box already takes, since what both corrupt is the merge record rather than a file in the diff. A body is edited between pushes, so a finding names the head the comparison ran at.
