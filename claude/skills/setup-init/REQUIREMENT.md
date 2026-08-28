---
name: setup-init
description: Scope boundary for the one-shot onboarding chain and the setup steps it leaves to a caller
---

# Setup init requirement

## Gap

Without this skill, a session installs a stack whose name it recalled rather than read, hand-writes configs the tooling sync already ships as golden files, and re-runs the chain over a project that owns its configs already.

Two failures are the expensive ones because both return success. A monorepo run drops husky into every subtree, git honors one `core.hooksPath`, and the extra hook directories go quiet with nothing reporting it. A caller reads the chain as onboarding complete when index bootstrap and plugin provisioning never ran, since no step states whether they belong to the chain.

Two more start at the resolve step. A project whose language the toolkit carries no stack for resolves to `base`, and the preview reports the resolved name without marking it as a fallback, so `base` development dependencies, scripts, and hooks land on a project that will not use them and nobody had the moment to decline.

The other is the refusal that ends rather than routes. An existing project, an install wanting the Claude layer without the tooling chain, and a language with no stack are the three states the chain does not serve, and each is declined by a declaration naming no destination, so the person who arrived with one reads a stop and goes no further.

## Must

- Resolve every domain argument against a catalog read at run time, so a stack, rule, snippet, or tooling name the catalog does not carry cannot reach the command line
- Preview the resolved chain before the first command runs, naming the evidence file behind each detected technology
- Pass `--skip base` on every subtree past the first in a monorepo, so the shared hook layer lands once
- State which onboarding steps the chain does not run, so a caller knows what is left rather than inferring completeness from a clean report
- Mark a stack reached by fallback as a fallback in the preview, and name what `base` carries, so the write can be declined at the one point it is still declinable
- Name a destination for every state the chain does not serve, in this body rather than only in a reference doc the person would have to already know to open, and say for each whether the chain stops or runs on a default

## Must not

- Generate a config that tooling sync ships as a golden file. Generating from prose duplicates the installed file and the two drift.
- Author a rule, stack, or snippet inside the target project when detection finds no match. Authoring happens in the toolkit and reaches a project by install or sync.
- Grow an existing-project branch, a mode switch, or a clobber guard. The chain runs once against a fresh scaffold and the per-domain paths cover everything after that.

## Guards

- An unmatched technology stops for a decision. Surface the gap and either defer to rule authoring or proceed on the matched layer with the gap named in the report, rather than resolving to the nearest rule.

## Out of scope

- Installing governance rules alone: `setup-gov`. This skill installs governance beside tooling and the seeds.
- Bootstrapping the `index.md` system: `setup-indexes`. Neither `aitk init` nor this chain performs it.
- Provisioning Claude Code plugins: `setup-plugins`. Those install once per machine rather than into a project, so no project-scoped chain can carry them.
- Running the verification scripts, which `setup-verify` owns and this chain invokes as its last step
- Re-installing into a project that already has the files, which the per-domain `aitk <domain> install` and `aitk sync` commands own
- Deciding which of those per-domain commands an existing project needs: `aitk-operator`. That skill reads the target before naming one, which this chain never does, so it is the destination rather than a guess made here.
- Seeding the `.claude/` folder without the tooling chain, which `aitk claude init` does on its own and `setup-indexes` finishes
