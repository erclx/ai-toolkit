---
description: Enforce exit and stream discipline in CLI command actions
paths:
  - 'src/**/*.ts'
---

# CLI output standards

## Process exit

- Set `process.exitCode` in a command action. Never call `process.exit()`, which ends the process before an async stdout write drains and truncates piped output at the 64K pipe buffer.
- Verify output through a pipe. Redirecting to a file hides the truncation, and the exit code is correct either way.

## Streams

- Write diagnostics to stderr in every mode, including `--json`.
- Name the file and the field that failed on stderr. A JSON record carries an action and a reason, so an operator sees neither without it.

## Authority

- Follow `docs/agents/output-shape.md` for the framed shapes, the stream split, and the exit discipline behind them. It is the single source.
