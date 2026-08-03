---
title: UI framing
description: Which domains still shell out, who opens the timeline frame once a dispatcher is gone, and the stream contract framing rests on
---

# UI framing

Every `aitk` command prints inside one timeline frame, and the frame has to survive a call crossing from TypeScript into bash and back. This file holds where that boundary sits today and which side owns the frame at each crossing. The output shape itself is in `docs/agents.md`, and the authoring contract for a new domain script is in the `bash-script` plugin skill.

## The exec boundary

No domain has a dispatcher any more. `src/commands/tooling.ts` handles `sync`, `inject`, `prune-gitignore`, and `list` in TypeScript and shells out for `ref`, `create`, and `verify`. `src/commands/gov.ts` handles `install`, `sync`, and `build`, and shells out for `list` alone. `src/commands/standards.ts` handles `install` and `sync`, and shells out for `list` alone. `src/commands/snippets.ts` handles `install`, `sync`, and `list`, and shells out for `create` alone. `src/commands/claude.ts` is TypeScript end to end, as are `sync` and `init`, which reach no verb script at all.

`scripts/standards/list.sh` sets its own EXIT trap and emits section headers via `log_step` without ever emitting `┌`, which is what lets the command layer above it own the frame.

A migrated list verb has to open that frame itself, and the gap is easy to miss because it only shows through the CLI. The bash verb never emitted `┌`, so a baseline captured by running the script directly matches a frameless port exactly while `aitk snippets list` loses the header `registerPassThroughVerbs` used to print. Capture equivalence baselines at the boundary the user invokes, not at the script.

`claude seeds list` is a real Commander subcommand rather than the hand-rolled routing it replaced. That routing existed only because the verb's script was `scripts/claude/seeds-list.sh` where `registerPassThroughVerbs` builds `scripts/<domain>/<verb>.sh`. The parent `seeds` command keeps an action handler so an unknown or missing subcommand still reports the two errors the bash `case` emitted, since Commander falls through to the parent when no subcommand name matches.

## Frame ownership

Deleting a dispatcher moves the responsibility for opening the frame, because a bash verb script closes a frame it never opened. `src/commands/gov.ts` calls `intro('aitk gov')` before it execs a pass-through, taking over the job the dispatcher used to do. It skips the call when the args carry `-h` or `--help`, since a help screen prints its own frame.

A TypeScript command that both bash and users invoke owns its frame and takes `--nested` to suppress it. `aitk tooling inject` frames itself so direct invocation does not emit dangling `│` lines, while the tooling sandbox scenarios pass `--nested` because they have already opened one. This is the same split `VERIFY_NESTED` makes in `scripts/core/verify.sh`. A migrated domain keeps the same frame because `src/ui.ts` mirrors `lib/ui.sh`.

Once both sides of a call are TypeScript the flag stops being needed at all. `aitk claude` used to shell into `aitk tooling inject --gitignore --nested`, and now calls `injectGitignore` directly inside the already-open frame, which drops a process per invocation.

## Hidden contracts

- The timeline frame opens in the dispatcher rather than in each subcommand. Prompts and `log_*` assume a frame is already open, so opening it at the top prevents dangling output on error paths.
- `log_*` writes to stderr and data goes to stdout, so JSON and lists pipe clean through any wrapper. This is why `--help` is the one exception that prints to stdout.
- `exec` replaces the process and drops the parent trap, so every subcommand re-arms `trap close_timeline EXIT` itself before any early exit, including `--json` paths.
- Subcommand scripts never emit their own `┌`. The dispatcher already did, and a second one produces two frames per invocation.
