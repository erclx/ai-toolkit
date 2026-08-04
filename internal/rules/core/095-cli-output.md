---
description: Enforce exit and stream discipline in CLI command actions
paths:
  - 'src/**/*.ts'
---

# CLI output standards

## Process exit

- Set `process.exitCode` and return from any command action that writes to stdout. Calling `process.exit()` there ends the process before the write drains and truncates piped output at the 64K pipe buffer.
- Verify output through a pipe. Redirecting to a file hides the truncation, and the exit code is correct either way.
- Confine `process.exit()` to a fail-fast path that has written to stderr alone, and reach for `process.exitCode` first even there.

## Streams

- Write diagnostics to stderr in every mode, including `--json`.
- Name the file and the field that failed on stderr. A JSON record carries an action and a reason, so an operator sees neither without it.

## Authority

- Follow `docs/agents/output-shape.md` for the framed shapes, the stream split, and the exit discipline behind them. It is the single source.
