---
title: Superseded values
description: Reading where the tree still asserts a value a changed convention no longer produces, why the sweep keys on the value rather than the file, the exemption marker, the blind spot it cannot reach, and why it reports rather than gates
---

# Superseded values

`aitk gov superseded <superseded> <replacement>` reports where the tree still asserts a value the convention behind it no longer produces. It answers the case a diff cannot: a convention changes, and the declarations testing it keep asserting the old form with nothing pointing at them.

```bash
aitk gov superseded feature-feat- feature-
aitk gov superseded feature-feat- feature- --json
aitk gov superseded old-name new-name --root ../my-app
```

| Option          | Behavior                                                   |
| --------------- | ---------------------------------------------------------- |
| `--root <path>` | Tree to read, defaulting to the current directory          |
| `--json`        | Add a machine-readable record on stdout, keeping the frame |

Under `--json` the record holds stdout alone and the frame still renders on stderr, refusals included, which is the split `output-shape.md` fixes for every mode.

## Why the value is the key

A file-scoped map from the changed rule to what cites it reaches nothing here. A fixture asserting an old output names neither the rule nor the standard behind it, so the change that superseded the value touches no file the fixture can be found from. The value both sides carry is the only key there is.

The slug transform is what proved it. Dropping the type segment left four fixtures and three scenario scripts asserting the type-carrying spelling. One surfaced as a red sandbox arm, which named a failing scenario rather than a stale declaration, and the other six were found by deriving from the rule rather than by anything reporting them.

## What it reads

The whole corpus git lists: tracked files plus untracked ones git does not ignore. The untracked half keeps a file added on this branch in scope rather than one push later.

Matching is a literal substring, so a value carrying regular-expression characters means what it says. Every occurrence on a line reports under its own column, since a line carrying the value twice is two edits.

Binary files are skipped on a NUL byte rather than on an extension list, and so is any listed path that will not open. Both are counted. A run states the files it opened against the files git listed, because a count of what passed reads as a verdict on the repository unless it also says how much it left out.

## The exemption marker

A declaration disagreeing with a convention for a stated reason carries `aitk-allow-superseded: <reason>` on its own line or the one directly above. The marker moves the line into the report's `Exempt` section, which is named rather than counted, so a reader weighing the report can reach the reason.

Only a marker naming a reason counts. A bare token is a line that meant to say something and did not, and honoring it would let a typo mute a finding. This is the `aitk-allow-secret` shape, and both read the same placement rule through one helper.

## The blind spot

The sweep sees the value and nothing else. A prose reference that went stale without carrying it is invisible here, which is not hypothetical: alongside the mechanical instances, one declaration had gone stale by citing the wrong standard for the transform, and it matches no string this sweep could have been given.

A value sweep closes most of this class and no part of that one. The help text and the frame say so on every run, so a clean report is not read as a clean tree.

## Exit codes

Exit codes are `0` when nothing asserts the superseded value, `1` for a refusal, and `2` for at least one finding. It refuses an empty superseded value, which would match every line rather than a convention, a superseded value equal to its replacement, which means no convention changed, and a tree git cannot list, since an empty list passes each of its zero files.

Nothing wires this into `bun run check` or into a hook. A value sweep over-reports by construction, and gating a measure carrying a known false-positive class is what teaches contributors to route around the stage. `aitk gov test-order` is the sibling precedent.

An exit code says nothing about a call made from a session, since a shell profile may wrap the binary in a function taking its status from a later command. Read the JSON record's `findings` array rather than the exit when a skill consumes this.
