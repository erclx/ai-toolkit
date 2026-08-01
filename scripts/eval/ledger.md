# Run ledger

One row per eval run, appended by `run.sh`. The harness spends about a dollar a run, and this file is what makes a claim about it checkable. "The harness has confirmed three times and discriminated zero" is repeated in `README.md`, `pre-registration.md`, and every result document, and until this ledger existed nothing could settle it.

A row records that a run happened. `result-<arm>.md` records what a run found. Those are different artifacts, and appending a log to a findings document destroys what that document is cited for.

## Columns

- `Date`: the day the run started
- `Arm`: which arm ran, matching the argument to `run.sh`
- `Kind`: `findings` for a run started to learn something, `regression` for one confirming nothing broke. Written by the caller, since the harness cannot know why it was started
- `Subject`: short commit of the working tree the standard or seed was read from, suffixed `-dirty` when tracked files were modified. A run exercises the tree rather than a release
- `Cost`: `total_cost_usd` as reported by the run
- `Turns`: `num_turns` as reported by the run
- `Verdict`: `pending` on append. Whoever judges the report edits the cell to `pass`, `fail`, or `inconclusive`
- `Output`: the retained raw output under `.claude/.tmp/eval-runs/`, gitignored and never pruned

## Reading a row

A `pending` verdict older than its report means nobody closed the loop. The three confirmed-versus-discriminated claims are a count over `Verdict` filtered by `Kind`, and a harness that has never produced a `fail` has not yet shown it can fail anything.

The `Output` path points at scratch, so it resolves only on the machine that ran it and only until that scratch is cleared. A transcript that becomes load-bearing evidence for a claim gets promoted by hand into the arm's result document, which keeps the default cheap and the exception deliberate.

## Runs

Rows append to the end of this file, so the table stays last and nothing may follow it. Column alignment is prettier's job rather than the runner's.

| Date | Arm | Kind | Subject | Cost | Turns | Verdict | Output |
| ---- | --- | ---- | ------- | ---- | ----- | ------- | ------ |
