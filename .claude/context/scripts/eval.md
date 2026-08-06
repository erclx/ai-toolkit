---
title: Eval harness
description: Arms and what each measures, the ablation strip, the two records a run leaves, and the limits a run cannot report past
---

# Eval harness

`scripts/eval/` asks whether a session that has never seen an artifact can author a conforming one from that artifact alone. It is not a verb and nothing dispatches to it, so it is invoked by path. That stays true by decision: a run spends real money, so it is started by a person deciding to spend it rather than by a command surface.

A research harness lives beside the domain it measures only while it measures one. This one sat at `scripts/standards/authoring-test/` because standards were all it tested, and the seed arm made that placement wrong, since a seed is a tooling artifact rather than a standard. It moved to `scripts/eval/` while three files referenced it rather than waiting for the next arm to make the move expensive.

## What an arm measures

Sufficiency and necessity need different arms. The original arms ask whether an artifact carries a session through a task, and no arrangement of them says whether a given line does work. An ablation variant answers the second by running one prompt twice, against the seed as it ships and against the seed with one section's lines removed.

Both halves are labeled `<section>-kept` and `<section>-cut` rather than pairing a cut against the bare arm. The bare arm carries a different prompt, so pairing against it varies the prompt and the artifact at once.

An ablation half records its `Kind` as `ablation`, written by the runner rather than the caller. `Verdict` means whether the artifact conformed under `findings` and `regression`, and whether the pair discriminated under `ablation`, so the two have to be counted separately and `Kind` is the only thing that separates them. A variant that stayed `findings` would silently merge the harness's confirmed-versus-discriminated count with a different question.

## The ablation strip

The strip anchors on each bullet's own text and kills the run when an anchor stops matching exactly one line. An ordinal is not a stable address here, and one ablation was ordered against Indexes bullets that no longer existed by the time it ran.

The miss is fatal rather than a warning because a cut half that silently kept its section is identical to its partner in every artifact a run leaves behind. A wrong strip would read as a null result about the section rather than as a broken run.

## What a run records

A run that costs money leaves two records, split by what each costs to keep.

`scripts/eval/ledger.md` takes one appended row per run carrying date, arm, kind, subject commit, cost, turns, verdict, and output path, and is committed. The raw transcript lands in `.claude/.tmp/eval-runs/<arm>-<timestamp>/` and is not, because a transcript holds the full text of every file the session read and a hundred retained runs is a repository hundreds of megabytes larger for every clone. The row is the durable record, and a transcript is promoted into the arm's result document by hand on the day it becomes evidence for a claim.

Retention is additive. A failure to write either record warns and the verdict still prints, and a row whose retention failed records its output cell as `none` rather than naming a directory nothing wrote.

`pre-registration.md` and each `result-*.md` are frozen evidence rather than maintained prose. Each opens with a banner refusing edits, the result document over its machine-derived blocks and its first-person text, and the pre-registration over what it fixed as a hit before either run. The pre-registration gained its banner only when the durable-record move retargeted the paths around it and reached a file with nothing saying to leave it alone.

Both therefore quote paths, seed bullets, and rules as they stood on the run date. A repository-wide sweep excludes them, and a path inside one that no longer resolves is the record doing its job rather than drift to repair.

### The `Subject` column

A `Subject` commit an ablation pair regenerates from gets a pushed tag under `eval/`, and an ordinary run does not. Rows pointing at a commit that lives on one local branch and nothing else are one branch cleanup or one lost disk away from losing the entry point while the content stays committed. A tag survives that deletion, and the `eval/` prefix keeps it clear of the `v*` release tags. `run.sh` does not create the ref, so the next ablation can recreate the same state, which is accepted on the same grounds the citation check was cut.

The ledger's own path is excluded from the dirty check that builds a row's `Subject`. It is a tracked file the append writes to, so counting it marks every run after the first `-dirty` with nothing under test changed, which corrupts the one column saying which tree a run exercised. An edit that drops the pathspec exclusion breaks the column silently, since the value stays plausible.

### The ledger table

The row is appended with `>>` and anchors on no existing line, so its table has to stay last in `ledger.md`. Prose added below the table lands between the header and the next run's row and breaks the table silently.

## Limits

- Nothing prunes `.claude/.tmp/eval-runs/`. It is the second uncapped scratch folder after `sandbox-runs/`, and neither is queued for a cap, since the pruning outcome that would have set one was cut. Clearing it by hand loses every `Output` path the ledger points at, which is the intended trade rather than a bug.
- `run.sh` is safe serially and not concurrently. Two arms starting in the same second race on the `while [ -e "$run_dir" ]` existence check, and parallel `>>` appends to the ledger can interleave. Parallelism is the obvious fix for wall clock, which is the harness's real cost. Fix both hazards before taking it, since a corrupted ledger is the one record a re-run cannot rebuild.

### The snapshot blind spot

A harness that reports writes by diffing one directory cannot see a write outside it, and both harnesses here have that shape. `scripts/eval/` compares a before-and-after hash of the fixture, and a cut half of the memory ablation wrote into `~/.claude/projects/<fixture>/memory/` while the run reported no files changed, which is true of the fixture and false of the machine. The sandbox harness reports `write_scope` from a manifest diff over its sandbox tree and carries the same blind spot rather than a different one, recorded in `.claude/context/sandbox/overview.md`. Read the transcript alongside the file list in either, and clear the stray path afterward.

The sandbox picked a boundary, watching the four shared-scratch directories under each toolkit root and naming what it leaves out, so the deciding is done rather than deferred and the eval fixture can copy the shape or state its own.
