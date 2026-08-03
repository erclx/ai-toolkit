---
title: Commands
description: Command registration in commander, migrating a domain off bash, shared helpers, and how a command writes files and prompts
---

# Commands

Every `aitk` verb is registered in commander and either handled in TypeScript or dispatched into a `manage-*.sh` script. This file holds what decides which of the two a verb gets, what a migrated verb owes, and the rules a command follows once it is writing files or asking questions.

## Registration

- A migrated command defines its real option surface in commander rather than forwarding argv. `indexes` is the first, so a mistyped subcommand now fails with a suggestion instead of reaching a shell script. Every command still on bash carries `allowUnknownOption()` and parses nothing.
- Commands still on bash stay thin. A command file parses arguments and execs, so behavior changes land in the bash script rather than in two places.
- A flag that carries a default is still distinguishable from one the operator passed. `getOptionValueSource` reports `default` rather than `cli`, which is what lets `aitk init` default `--stack` to `base` and keep prompting on a bare run. Read provenance rather than the value whenever a default and an explicit pass have to behave differently, since a value test collapses the two.
- A default belongs on the flag rather than in a branch behind an absent one. The default then shows up in `--help` where a caller can see it, and the resolver stays a single function both the preview and the step list call, so the two cannot disagree about what will install.
- The root program sets `helpOption(false)` for its own hand-rolled help, and subcommands inherit it. A migrated command re-enables help explicitly at each level or `--help` returns an unknown-option error.
- `sandbox.ts` is the exception that carries interactive select prompts before the exec, because the scenario picker needs the TS prompt surface. It also holds the sandbox reads that are not provisioning, with the report logic in `src/sandbox/` so the command file keeps only the framing. Each read is reasoned about in `.claude/context/sandbox/index.md`.
- A `check` subcommand coexists with a pass-through parent by registering after it. `sandbox` keeps `allowUnknownOption` and `passThroughOptions` so `aitk sandbox git:commit` still reaches `manage-sandbox.sh`, and commander resolves the named subcommand first. Adding a second such subcommand needs the same ordering.

## Migrating a domain off bash

- A domain migrates one verb at a time. `tooling`, `gov`, and `snippets` register their migrated verbs natively and name each remaining verb as an explicit pass-through, which is what let each dispatcher be deleted before every verb had moved. Naming them, rather than falling back to `allowUnknownOption()` on the whole domain, keeps `--help` honest for the verbs that did move.
- The pass-through registration lives in `src/commands/pass-through.ts` and takes the domain name, since the loop is identical for every domain and only the banner and script path vary. Gov, snippets, and standards all call it. A verb whose script sits somewhere other than `scripts/<domain>/<verb>.sh` registers by hand instead.
- Whichever layer runs first opens the timeline frame, or the bash verb emits a closing `└` with nothing above it. Each pass-through calls `intro` before it execs for exactly this reason, which is the obligation a deleted dispatcher hands upward.
- A pass-through verb sets `helpOption(false)`. Commander resolves `--help` before the action runs, so leaving the built-in option on prints a one-line stub and hides the flag surface the bash script documents. Disabling it lets the flag reach the script, which owns that surface until the verb migrates.
- A step list takes its child-process factory as an argument. `src/init/steps.ts` does, so a test reads the list for its labels and argv without spawning anything.
- Tests run under `bun --bun vitest` rather than plain vitest. Migrated code uses `Bun.YAML`, `Bun.Glob`, and `Bun.$`, which do not exist in the Node runtime vitest defaults to.
- Bash that still needs a migrated capability shells into the CLI by path (`bun "$PROJECT_ROOT/src/cli.ts" ...`) rather than via the global `aitk`, so a linked worktree exercises its own code.

## Shared helpers and what earns a command

- A helper lifts to the `src/` root once a second domain needs it. `stripFrontmatter` moved out of `src/gov/payload.ts` into `src/frontmatter.ts` when `docs` arrived, rather than having `docs` import from `gov` and carry a dependency it has no reason to. `copyPreservingMode`, `resolveTarget`, and `cliRun` were lifted the same way.
- `listIgnored` lifted from `src/indexes/walk.ts` to `src/git-ignore.ts` when the comment scan became its second caller, following the same rule.
- Behavior shared across domains lands in `src/sync/` rather than in the first domain that needs it. Gov is the first consumer of the sync engine, and burying it under `src/gov/` would force a move as soon as snippets arrives.
- A domain earns a command when the operation is mechanical, not when the domain is important. Tasks gained `archive` alone. Creating a task proposes a phase label from the board and writes prose from a conversation, which is judgment, so it stays in `claude-tasks` and no `create` verb exists to tempt a caller.
- `aitk claude skills list` reads `claude/skills/` alone. Internal skills under `.claude/skills/` are excluded, since a count spanning both reports work that never installs into a target. Each entry carries a `requirement` boolean for the sibling `REQUIREMENT.md`. It reports presence and never a reason, because coverage is selective and a `false` is not a gap to close.
- Feature entries stay separate from this domain. They document a user-facing artifact such as the `SLIDES.md` source shape or the design token schema, which is worth reading without the CLI plumbing.

## Writing files and writing output

- A command whose stdout is the product writes the document with `process.stdout.write` and everything else with the `log_*` helpers, which are stderr-only. `aitk docs <topic>` is the one command a caller captures with `$(...)`, so a single frame character on stdout would corrupt the document silently rather than failing.
- Anything that writes a file into a target routes through `copyPreservingMode` in `src/copy.ts`. `copyFile` imposes the source's mode on an existing destination, so a target file deliberately at 600, or one an earlier layer made executable, comes back at the source's mode. The bash `cp` it replaces left an existing mode alone.
- A verb that writes outside a target takes its destination as an argument. `aitk claude setup` defaults to `$HOME/.claude` but accepts a path, which is the only way to cover the settings merge without pointing a test at the operator's real config. The sandbox scenario passes a sandbox-local path for the same reason.
- A preview and the apply it precedes run the same function. `planGitignore` dry-runs `mergeSections`, so the two cannot disagree. Parsing the source a second time for the preview is what lost, since the two reads drift. `govArgs` in `src/init/steps.ts` is the same shape, building both the `gov install` argv and the command a `--skip governance` notice tells the caller to paste.
- Machine-readable output goes through `JSON.stringify` rather than a `printf` template. Interpolating a name straight into a JSON string literal emits output a consuming skill cannot parse as soon as the name carries a quote.

## Prompts and unattended callers

- Declining a prompt exits 0. A cancel is a deliberate choice rather than a failure, and `runDomains` in `src/init/run.ts` reports any non-zero domain as `Failed, run manually`, so exiting 1 made `aitk init` announce a broken install for work the operator chose to skip. Apply it to any prompt a port carries over.
- A headless run refuses to write to a git remote. The four domain syncs still apply, so headless keeps everything but the push. This is the same judgment the standards refusal made, applied to an action that reaches further outward than a local overwrite.
- A picker standing in for a required argument refuses headlessly rather than defaulting to its first option. Confirm-then-apply prompts keep `nonInteractiveDefault`, since the caller already named what to apply. The distinction is whether the prompt is choosing what to do or confirming what was asked for.
- A branch gated behind a prompt takes an optional decision seam so a test can reach it. `select` exits without a TTY, so the branch behind it is otherwise reachable only by driving a PTY. `WorkflowDeps.choose` defaults to the real prompt, leaving production behavior unchanged while the tests assert the exact staged set. Prefer this over asserting on the logic that feeds the prompt.
- A command an unattended caller drives makes every gate a refusal with a non-zero exit. `aitk tasks archive` is called by `.husky/post-merge` and by `claude-tasks`, and a gate that only reports is useful to the second and worthless to the first. The command owning the gates is also what keeps the two callers from drifting into archiving differently.
