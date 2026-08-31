---
title: Census
description: Tracked-plus-untracked file count, a breakdown by extension, and a line total that skips whatever reads as binary
---

# Census

`canon census [path]` reports how large a tree is: the tracked-plus-untracked file count, a breakdown by extension, and a line total. It reads `listRepositoryFiles`, the same corpus the citation check, the markdown corpus, and the secret scan already read, so this is not a fourth definition of what counts.

```bash
canon census
canon census src --json
```

| Option   | Behavior                                                   |
| -------- | ---------------------------------------------------------- |
| `--json` | Add a machine-readable record on stdout, keeping the frame |

Grouping is by extension rather than by a named language category. A config file and a source file land in separate buckets and two source files sharing an extension land in one, and a file with no extension, such as `Dockerfile`, lands under `no-extension`.

Line counts are text-only. A file that reads as binary, and a file git lists that will not open, such as a symlink leaving the tree, are counted toward the file total and their extension's file count, and left out of every line count. The record's `skipped` field states that gap rather than leaving a reader to infer it from the difference between the file count and the summed extension line counts. It carries both causes as one number: on a healthy tree the two are indistinguishable, so a `skipped` count above what the tree's own binary files explain is itself the signal that something in the corpus will not open.

The command reports a snapshot rather than a delta. It registers in the audit catalog with an empty gating set, so `canon audits run --record` is what turns two snapshots into the growth series a hand count used to approximate: 481 files on one date and 965 five weeks later, with nothing between them because nobody had counted again.
