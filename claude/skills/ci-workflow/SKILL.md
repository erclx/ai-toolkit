---
name: ci-workflow
description: Generates GitHub Actions CI workflow files with parallel jobs, emoji job names, and gated deploy stages. Use when asked to write a CI workflow, add GitHub Actions, set up a CI pipeline, or create a `.github/workflows` file.
---

# CI workflow

Generate GitHub Actions workflow files for CI pipelines. Enforce parallel job execution, emoji job naming, and gated deployment stages.

## Guards

- A request for what runs inside a deploy, publish, or release job stops at the gate. Credentials, environments, and deploy targets are invisible to this skill, so emit the job with its `needs` wiring and a placeholder step, then name what the caller fills in. Never guess a deploy command.
- The build, test, and deploy commands belong to the project. Read them from its scripts rather than asserting a second copy in the workflow.

## Workflow setup

- Include `workflow_dispatch` on every workflow alongside the primary trigger.
- Pin all actions to major version tags (`@v4`, never `@latest` or `@main`).
- Use `runs-on: ubuntu-latest` for all jobs.

## Job naming

- Name jobs with emoji + title: `🛡️ Static Checks`, `🧪 Unit Tests`, `📦 Build Check`, `🎭 E2E Tests`, `🚀 Deploy`, `🔍 Code Quality`, `🏷️ Release`, `🔒 Security`.

## Job granularity

- Start a new pipeline with the checks that share setup in one job: static analysis, unit tests, and build. A project with no run history has nothing to measure, and one job is the shape that costs least to reverse.
- Keep them in one job while the gate runs under roughly two minutes end to end. Each extra job repays checkout, dependency install, and toolchain setup before it reaches a stage, so a split at that duration costs more than the parallelism returns.
- Split once a run log puts the gate past that, then apply the dependency rules below. The run log is the revision trigger rather than the entry condition, since repository size and stage count answer nothing.
- Give E2E, release, and deploy their own jobs from the start. Each carries a data dependency or a gate, so this rule never folds them into the check job.

## Job dependencies

- Run independent jobs in parallel.
- Use `needs` only when there is a data dependency (a job requires an artifact) or the job is prohibitively expensive relative to its gate.
- Run static, unit, and build jobs in parallel once the gate is split.
- Gate E2E on build, since it requires the built artifact.
- Gate release and deploy on E2E.

## Artifacts

- Upload artifacts on `if: failure()` only. Set `retention-days: 7`.

## Bun stack

- Use `oven-sh/setup-bun@v2` with `bun-version: latest`.
- Install with `bun install --frozen-lockfile`.
- Cache Playwright browsers keyed on the Playwright version string, never a static key.

## Template

Load `${CLAUDE_SKILL_DIR}/references/workflows.md` for the base workflow template. Adapt it to the project's stack, test commands, and build output. Add or remove jobs as needed, collapsing to one job or keeping the parallel and gated structure by the granularity rule above.

## Validation

Before responding, verify:

- `workflow_dispatch` is present alongside the primary trigger.
- All actions pinned to major version tags, no `@latest` or `@main`.
- A new pipeline folds static, unit, and build into one job, and a gate a run log put past two minutes gives them no `needs` so they run in parallel.
- E2E uses `needs: build`. Release and deploy use `needs: e2e`.
- Artifacts upload on `if: failure()` only with `retention-days: 7`.
- Job names use emoji + title format.
- Deploy, publish, and release jobs carry a placeholder step and a named handoff, never a guessed deploy command.
- Bun projects use `oven-sh/setup-bun@v2` with `bun install --frozen-lockfile`.
