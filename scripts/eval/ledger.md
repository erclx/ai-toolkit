# Run ledger

One row per eval run, appended by `run.sh`. The harness spends about a dollar a run, and this file is what makes a claim about it checkable. "The harness has confirmed three times and discriminated zero" is repeated in `README.md`, `pre-registration.md`, and every result document, and until this ledger existed nothing could settle it.

A row records that a run happened. `result-<arm>.md` records what a run found. Those are different artifacts, and appending a log to a findings document destroys what that document is cited for.

## Columns

- `Date`: the day the run started
- `Arm`: which arm ran, matching the argument to `run.sh`. An ablation half reads `seed-<section>-kept` or `seed-<section>-cut`, which sorts the two halves of a pair together and keeps a schema change out of a file this small
- `Kind`: `findings` for a run started to learn something, `regression` for one confirming nothing broke. Written by the caller, since the harness cannot know why it was started
- `Subject`: short commit of the working tree the standard or seed was read from, suffixed `-dirty` when tracked files were modified. A run exercises the tree rather than a release. This file is excluded from that check, since appending a row would otherwise mark every run after the first as dirty
- `Cost`: `total_cost_usd` as reported by the run
- `Turns`: `num_turns` as reported by the run
- `Verdict`: `pending` on append. Whoever judges the report edits the cell to `pass`, `fail`, or `inconclusive`
- `Output`: the retained raw output under `.claude/.tmp/eval-runs/`, gitignored and never pruned. Reads `none` when retention failed, so the cell never names a directory that was never written

## Reading a row

A `pending` verdict older than its report means nobody closed the loop. The three confirmed-versus-discriminated claims are a count over `Verdict` filtered by `Kind`, and a harness that has never produced a `fail` has not yet shown it can fail anything.

Two rows sharing a section and differing on `kept` against `cut` are one ablation pair. Read them together or not at all, since a single half carries no verdict of its own. The retained output holds the `CLAUDE.md` each half was handed, which is what makes a pair re-diffable after the runs.

Both halves of a pair carry the pair's verdict rather than one of their own. `pass` means the pair discriminated and the section under test changed observable behavior. `inconclusive` means it did not, which is a statement about the pair rather than about the section, since a null can come from a prompt that never reached the trigger or from a rule another file already carries. The result document says which.

The `Output` path points at scratch, so it resolves only on the machine that ran it and only until that scratch is cleared. A transcript that becomes load-bearing evidence for a claim gets promoted by hand into the arm's result document, which keeps the default cheap and the exception deliberate.

## Runs

Rows append to the end of this file, so the table stays last and nothing may follow it. Column alignment is prettier's job rather than the runner's.

| Date       | Arm               | Kind     | Subject  | Cost                | Turns | Verdict      | Output                                                   |
| ---------- | ----------------- | -------- | -------- | ------------------- | ----- | ------------ | -------------------------------------------------------- |
| 2026-08-02 | seed-memory-kept  | findings | 309d5413 | 0.37187249999999994 | 5     | pass         | .claude/.tmp/eval-runs/seed-memory-kept-20260802T145548  |
| 2026-08-02 | seed-memory-cut   | findings | 309d5413 | 0.46913000000000005 | 9     | pass         | .claude/.tmp/eval-runs/seed-memory-cut-20260802T145637   |
| 2026-08-02 | seed-indexes-kept | findings | 309d5413 | 0.8573619999999998  | 20    | inconclusive | .claude/.tmp/eval-runs/seed-indexes-kept-20260802T145746 |
| 2026-08-02 | seed-indexes-cut  | findings | 309d5413 | 0.912242            | 19    | inconclusive | .claude/.tmp/eval-runs/seed-indexes-cut-20260802T145954  |
| 2026-08-02 | seed-output-kept  | findings | 309d5413 | 0.8441654999999999  | 25    | pass         | .claude/.tmp/eval-runs/seed-output-kept-20260802T150229  |
| 2026-08-02 | seed-output-cut   | findings | 309d5413 | 0.6811045           | 20    | pass         | .claude/.tmp/eval-runs/seed-output-cut-20260802T150418   |
| 2026-08-02 | seed-tasks-kept   | findings | 309d5413 | 0.977825            | 14    | pass         | .claude/.tmp/eval-runs/seed-tasks-kept-20260802T150552   |
| 2026-08-02 | seed-tasks-cut    | findings | 309d5413 | 0.9946095           | 18    | pass         | .claude/.tmp/eval-runs/seed-tasks-cut-20260802T150837    |
| 2026-08-02 | seed-output-kept  | findings | 309d5413 | 0.650339            | 18    | pass         | .claude/.tmp/eval-runs/seed-output-kept-20260802T151213  |
| 2026-08-02 | seed-output-cut   | findings | 309d5413 | 0.7213480000000001  | 24    | pass         | .claude/.tmp/eval-runs/seed-output-cut-20260802T151323   |
| 2026-08-02 | seed-memory-kept  | findings | 309d5413 | 0.372966            | 6     | pass         | .claude/.tmp/eval-runs/seed-memory-kept-20260802T151521  |
| 2026-08-02 | seed-memory-cut   | findings | 309d5413 | 0.502545            | 9     | pass         | .claude/.tmp/eval-runs/seed-memory-cut-20260802T151556   |
| 2026-08-02 | seed-tasks-kept   | findings | 309d5413 | 1.237188            | 24    | pass         | .claude/.tmp/eval-runs/seed-tasks-kept-20260802T151645   |
| 2026-08-02 | seed-tasks-cut    | findings | 309d5413 | 1.0710235           | 23    | pass         | .claude/.tmp/eval-runs/seed-tasks-cut-20260802T152019    |
