---
name: verify-scaffold
description: Verifies a freshly scaffolded project by running its `package.json` scripts in order and reporting pass/fail per script. Use after the agent has followed a tooling stack reference and generated configs, or when asked to "verify the scaffold", "check the setup", "run verify", or "make sure everything works". Do NOT use on a project without `package.json`, or to run E2E or dev servers.
---

# Verify scaffold

Runs the local verification chain against a freshly scaffolded project. Catches config typos, missing deps, and wiring mistakes before the user ever sees them.

## Guards

- If `package.json` does not exist at the project root, stop: `❌ No package.json found. Cannot verify.`
- If `node_modules/` does not exist, run `bun install` first, then proceed.

## Step 1: read scripts

Read `package.json` from the project root and extract the `scripts` block. Do not hardcode script names. Different stacks expose different scripts.

## Step 2: run the chain

Run the scripts below in order. Stop on the first failure and surface the error. Each script is a leaf command so failures point at the exact break.

| Order | Script      | Skip if                     |
| ----- | ----------- | --------------------------- |
| 1     | `lint:fix`  | absent                      |
| 2     | `typecheck` | absent                      |
| 3     | `check`     | absent                      |
| 4     | `test:run`  | absent, fall back to `test` |
| 5     | `build`     | absent                      |

Skip any script not present in `package.json`. Do not invent a fallback command. Do not run composite scripts like `check:full`. Do not run `dev`, `preview`, `test:e2e`, `test:ui`, `screenshot`.

Run each as `bun run <script>` from the project root.

## Step 3: report

For each script run, report one of:

- `✅ <script>`
- `❌ <script>` followed by the failing output (last 40 lines)

End with a summary line:

- On pass: `✅ Scaffold verified (<n> scripts passed).`
- On fail: `❌ Scaffold failed at <script>. Fix the error and re-run verify-scaffold.`

## Out of scope

- Dev server and preview server smoke tests. Too flaky for a scaffold check. The user runs these manually.
- Playwright E2E tests. Require browser install and a running server.
- CI workflow validation. Runs in GitHub Actions on PR, not locally.
