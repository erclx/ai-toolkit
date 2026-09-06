---
name: setup-smoke
description: Why the heavy scaffold stages need an owner and what heuristic judges a server smoke pass
---

# Setup smoke requirement

## Gap

Without this skill, a freshly scaffolded project's dev server, preview server, end-to-end suite, and screenshot harness never run anywhere. `setup-verify` excludes all three for the flakiness reasons that make them wrong for an unattended chain, and names no destination for any of them, so a broken dev server or a missing end-to-end dependency surfaces only once the user hits it by hand.

A dev or preview server carries no exit code to read, since it runs until stopped rather than finishing on its own, unlike the leaf scripts `setup-verify` runs. Judging it needs a heuristic rather than a pass/fail read.

## Must

- Read the scripts the project declares and run only those, skip absent ones
- Run `dev`, `preview`, `test:e2e`, `screenshot` in that fixed order, stopping at the first failure
- Judge a server script by running it in the background, waiting a fixed window, checking the process is alive and its output carries no fatal error string, then killing it regardless of the outcome
- Install dependencies itself when missing, so it runs standalone without `setup-verify` having run first

## Must not

- Invent a fallback command for an absent script
- Run a composite script
- Require `setup-verify` to have passed first
- Duplicate a leaf script `setup-verify` already runs
- Get invoked by anything other than a person or a chain naming it directly. Review this at each future change, since nothing can answer it before the skill has run. `canon docs target-projects` states the scaffold chain that keeps it outside the unattended path, for the same flakiness reasons that keep it out of `setup-verify`'s own leaf-script order.

## Guards

- No `package.json` at the project root stops, since there are no declared scripts to read
- A missing dependency folder installs first rather than letting every script fail on the same cause

## Out of scope

- The leaf scripts `setup-verify` already runs: `lint:fix`, `typecheck`, `check`, `test:run`, `build`
- Generating the configs these scripts drive, which the tooling stack reference owns
- A true port-probe readiness check, since no manifest key exposes a generic port across stacks
