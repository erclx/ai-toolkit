# Authoring test

Regression test for a standard's actionability. It answers whether a session that has never seen a standard can author a conforming artifact from that standard alone.

This is a spec-quality test, not an efficacy test. It says nothing about whether the resulting artifact is useful, which is the separate ablation designed in the `context-research` groundwork track. No baseline arm and N of 1 are correct here, because failure is self-evident: a session that reads the standard and still writes a per-file tree has proved the standard failed to communicate its own central rule.

## Running

```bash
scripts/standards/authoring-test/run.sh context      # standards/context.md
scripts/standards/authoring-test/run.sh wireframes   # standards/wireframes.md
```

Each run spawns one headless `claude -p` session. Measured cost is $0.59 for the context arm and $0.74 for the wireframes arm, both around 15 to 20 turns. Budget roughly a dollar per arm. The artifact prints to stdout and the cost line to stderr, so redirecting stdout captures the artifact alone.

The runner passes `--dangerously-skip-permissions`. The flag grants tool use across the filesystem rather than within a directory, so the disposable fixture is not what makes it acceptable. What makes it acceptable is the task: the cwd is the fixture, the prompt names one file to write, and no credential or repo path is in reach of the instruction. Copy the flag only where the same three hold. The reason it is needed rather than `acceptEdits` is in Known harness behavior below.

The runner copies the live `standards/<name>.md` in at run time rather than using a pinned copy, so the test always exercises the current standard.

## Why the fixture is a tarball

The fixture has to be extracted outside this repository before it runs. A fixture sitting under the repo would load the toolkit's own `CLAUDE.md` through the ancestor chain, and the session under test would arrive already knowing the conventions the test is trying to measure. The runner extracts to `mktemp -d` and cleans up on exit.

`fixture.tar.gz` holds a synthetic tool called `feedwatch` in two arms: `ctx-arm` for the context standard and `wf-arm` for the wireframes standard. Synthetic rather than a real domain, because every domain in this repo already carries an entry, and a real domain would let the session pattern-match from prior exposure instead of from the standard.

## Reading a result

`pre-registration.md` fixes what counts as a hit before any run. It names the decisions planted in the fixture source and the five pass criteria. Read it before judging output, so a miss cannot be reinterpreted after the fact.

Three decisions are planted in the context arm and three layout intents in the wireframes arm. Each carries its reasoning in a code comment rather than in a doc, so recording it requires reading code and judging that it matters.

## Known harness behavior

`--permission-mode acceptEdits` is not enough. It treats paths under `.claude/` as sensitive and a non-interactive session cannot get approval, so the run either returns the artifact in its final message, routes around the block and writes somewhere unexpected, or gives up and writes nothing. All three happened across three runs before this was diagnosed.

Fixture-local settings do not fix it. An untrusted workspace makes Claude Code ignore `permissions.allow` outright, and a `mktemp` path is never trusted. Skipping permissions is what remains.

The runner also snapshots the fixture before the run and recovers any markdown created during it, so an artifact written to an unexpected path still survives. Recovered artifacts print first, followed by an HTML comment marking where the run's own commentary begins.

A missing file at the requested path is a harness result, never a standard failure. Judge the artifact.

## Results on file

`result-context.md` is the 2026-07-31 run against `standards/context.md`, the run that first exercised the success criterion. Passed all five criteria and recovered all three planted decisions unprompted.

`result-wireframes.md` is the 2026-07-31 run against `standards/wireframes.md`. Passed all five criteria. It correctly withheld the rejected-modal rationale that the standard routes to `.claude/context/`, which is the rule most likely to be ignored, and named what it was withholding. Its Harness history section records the two inconclusive attempts that preceded it and the fixes each one forced.

The two results are not parity, and the record says so. The context arm ran with its criterion already present, so it measures the standard as it ships. The wireframes arm ran before its criterion existed, so it measures the shape rules alone and the criterion written from it has never been exercised.

Both standards passed, which is a finding about the harness rather than about either standard. A test that has confirmed twice and discriminated zero times has not yet shown it can fail anything. Treat a pass as weak evidence until one arm fails.
