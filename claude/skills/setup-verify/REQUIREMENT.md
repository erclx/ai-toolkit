---
name: setup-verify
description: Why a fresh scaffold is checked with declared leaf scripts in a fixed order, and what the excluded stages would cost
---

# Setup verify requirement

## Gap

Without this skill, a freshly scaffolded project is handed over on the strength of the configs looking right, and the first typo surfaces when the user runs something. A scaffold is generated from a reference, so the errors it carries are wiring mistakes and missing dependencies, both of which any script run would have caught.

The naive check fails two ways. A session that assumes script names runs `test` against a stack that exposes `test:run`, or invents a fallback command when a script is absent, and either result reports on something the project never declared. A session that runs a composite script gets one failure covering several stages, so the output names the wrapper rather than the break.

The stages left out are the ones that lie, and each now has an owner in `canon:setup-smoke` rather than nowhere at all. A dev server or a preview reads as failed when it starts slowly, a browser test needs an install and a running server before it can even fail correctly, and a CI workflow cannot be judged locally at all. Including any of them turns a scaffold check into a flaky one, and a flaky check gets ignored.

## Must

- Read the scripts the project declares and run only those
- Run leaf scripts in a fixed order, so a failure points at the exact stage that broke
- Stop at the first failure and surface its output rather than continuing to collect more
- Report per script and close with one summary line naming the failing stage when there is one

## Must not

- Invent a fallback command for an absent script. Skip it.
- Run a composite script, which hides which stage broke
- Run a dev server, a preview, or a browser test

## Guards

- No `package.json` at the project root stops, since there are no declared scripts to read
- A missing dependency folder installs first rather than letting every script fail on the same cause

## Out of scope

- Dev and preview smoke tests, which `project-commands` starts on request and `canon:setup-smoke` checks automatically
- Browser end-to-end tests, which need a browser install and a running server, covered by `canon:setup-smoke`
- CI workflow validation, which runs on the pull request rather than locally. `canon:setup-smoke` runs the same stages locally as the closest proxy
- Generating the configs it checks, which the tooling stack reference owns
