# Authoring test

Regression test for a standard's actionability. It answers whether a session that has never seen a standard can author a conforming artifact from that standard alone.

This is a spec-quality test, not an efficacy test. It says nothing about whether the resulting artifact is useful, which is the separate ablation designed in the `context-research` groundwork track. No baseline arm and N of 1 are correct here, because failure is self-evident: a session that reads the standard and still writes a per-file tree has proved the standard failed to communicate its own central rule.

## Running

```bash
scripts/standards/authoring-test/run.sh context      # standards/context.md
scripts/standards/authoring-test/run.sh wireframes   # standards/wireframes.md
```

Each run spawns one headless `claude -p` session and costs roughly $0.60 over about two minutes. The artifact prints to stdout and the cost line to stderr, so redirecting stdout captures the artifact alone.

The runner copies the live `standards/<name>.md` in at run time rather than using a pinned copy, so the test always exercises the current standard.

## Why the fixture is a tarball

The fixture has to be extracted outside this repository before it runs. A fixture sitting under the repo would load the toolkit's own `CLAUDE.md` through the ancestor chain, and the session under test would arrive already knowing the conventions the test is trying to measure. The runner extracts to `mktemp -d` and cleans up on exit.

`fixture.tar.gz` holds a synthetic tool called `feedwatch` in two arms: `ctx-arm` for the context standard and `wf-arm` for the wireframes standard. Synthetic rather than a real domain, because every domain in this repo already carries an entry, and a real domain would let the session pattern-match from prior exposure instead of from the standard.

## Reading a result

`pre-registration.md` fixes what counts as a hit before any run. It names the decisions planted in the fixture source and the five pass criteria. Read it before judging output, so a miss cannot be reinterpreted after the fact.

Three decisions are planted in the context arm and three layout intents in the wireframes arm. Each carries its reasoning in a code comment rather than in a doc, so recording it requires reading code and judging that it matters.

## Known harness behavior

The write is blocked. `--permission-mode acceptEdits` still treats paths under `.claude/` as sensitive, and a non-interactive session cannot get approval, so the artifact comes back in the final message instead of landing on disk. That is a harness constraint rather than a standard failure. Judge stdout, and do not read a missing file as a fail.

## Results on file

`result-context.md` is the 2026-07-31 run against `standards/context.md`, the run that first exercised the success criterion. It passed all five criteria and recovered all three planted decisions unprompted.

The wireframes arm has not been run. It is the likelier failure, since that standard has never been exercised by anyone other than its author.
