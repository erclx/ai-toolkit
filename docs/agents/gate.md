---
title: Merge gate
description: Running the gate this repository verifies a branch with, what the stage table holds and what stays a script, how the changed set scopes three stages, and why a stage that cannot read its input reports rather than passing
---

# Merge gate

`aitk gate run` runs every stage that guards a branch here, in order, stopping at the first stage that finds a fact. `bun run check` and `bun run check:ci` are the two callers, and no other entry point exists.

```bash
aitk gate run
aitk gate run --all --no-write
aitk gate run --json
```

| Option       | Behavior                                                                      |
| ------------ | ----------------------------------------------------------------------------- |
| `--all`      | Run every stage instead of scoping shell, types, and tests to the changed set |
| `--no-write` | Check formatting instead of applying it, which is what a merge gate wants     |
| `--nested`   | Suppress the outer frame when a calling script has already opened one         |
| `--json`     | Add a machine-readable record on stdout                                       |

## What the command owns and what it runs

Three things sit in the command: the stage table in `src/gate/stages.ts`, the changed-file scoping and the run loop in `src/gate/sequencer.ts`, and every threshold comparison in `src/gate/measures.ts`. Each individual check is the script or the verb it already was, under `scripts/core/` or behind another `aitk` command, and the move changed none of them. Sequencing, scoping, and comparison are where the recurring defects were, and a check whose behavior changed while its sequencing moved would make any regression impossible to attribute.

A stage is a list of checks and a check is one of four kinds:

| Kind      | What it is                                                                      |
| --------- | ------------------------------------------------------------------------------- |
| `command` | Any binary, run from the project root                                           |
| `cli`     | This checkout's own `src/cli.ts`, never a globally installed `aitk`             |
| `drift`   | A regenerated pathspec asserted against the index and against the untracked set |
| `measure` | A reading whose verdict is a comparison rather than an exit code                |

A `cli` check runs the source rather than the binary because a globally installed `aitk` resolves to the main checkout no matter which worktree is running, so a gate reading through it would measure the wrong tree and pass a branch it never opened.

Every check is an argument vector rather than a shell line, so no stage carries a quoting hazard and a `drift` pathspec reaches git exactly as the table spells it.

## Scoping

Shell, types, and tests read the changed set. Everything else always runs, because its input is diffuse enough that no path predicts it.

The changed set unions the branch diff against the merge base with `origin/main`, the working tree, and untracked files, which is what a pull request will contain. The baseline is the remote ref and not local `main`, since on `main` itself the local ref is HEAD and every unpushed commit would drop out. Every fallback widens rather than narrows: no merge base at all runs every stage, and a local baseline equal to HEAD does the same. `--all` turns scoping off outright, which is what `bun run check:ci` passes so CI stays the backstop for a wrong local scoping decision.

## A stage that cannot read its input

Six stages can reach an input they cannot read: an absent tool, a catalog that did not report, a corpus with nothing under it. Each returns the reason and the run prints it as a warning without failing, which is what the shell script this replaces did.

Two of the six qualify that under CI. Sandbox coverage and Plugin manifests refuse there rather than warning, because the scenario tree ships in the checkout and the runner installs the plugin CLI as a workflow step, so an absence on a runner is a broken workflow rather than somebody mid-setup.

## Exit codes

| Code | Meaning               |
| ---- | --------------------- |
| `0`  | no stage found a fact |
| `1`  | a stage found a fact  |

One code for a failure, which is what a `bun run` caller and a git hook both read.

## The record

`--json` puts one record on stdout and keeps every diagnostic on stderr:

```json
{
  "ok": true,
  "root": "/path/to/checkout",
  "scoped": true,
  "changed": 12,
  "summary": { "ran": 23, "passed": 22, "skipped": 1, "failed": 0 },
  "stages": [{ "id": "indexes", "label": "Indexes", "status": "passed" }]
}
```

A failing stage carries its remedy in `failure`, and the same line goes to stderr so a caller reading neither the record nor the frame is still told what to fix.
