---
title: Output shape
description: The two framed shapes every command renders into, and how JSON and --names modes keep stdout clean
---

# Output shape

Every CLI command renders into one of two framed shapes. Data goes to stdout. UI and logs go to stderr. Help output is the exception. It prints to stdout so it can be piped and grepped.

## Data shape (lists, runs, errors)

```plaintext
┌
│ aitk <domain>
│
├ Section
│ ✓ item
│ ✓ item
└
```

Rules:

- `┌` opens the frame on stderr
- `│ aitk <domain>` is the command banner, one per invocation
- `├ Section` headers introduce groups of items. `log_step` produces the blank `│` spacer before each.
- `└` closes the frame on stderr, wired via `trap close_timeline EXIT`
- Errors render as `│ ✗ message` inside the same frame. Never emit a lone error line without a frame.

## Help shape

```plaintext
┌
├ Usage: aitk <domain> [command]
│
│  Commands:
│    ...
└
```

Help skips the banner. The `Usage:` line sits directly on `├`. Help writes to stdout because `--help` is documentation, not runtime UI.

## JSON and `--names` modes

`--json` and `--names` keep stdout clean and machine-readable. The frame still renders on stderr (open, banner, close) so the stream discipline is consistent across modes. Consumers that only read stdout see pure data.
