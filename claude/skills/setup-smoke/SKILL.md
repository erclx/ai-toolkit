---
name: setup-smoke
description: Runs the heavy scaffold checks setup-verify skips - dev and preview server smoke, Playwright end-to-end tests, and the screenshot harness - on the same declared-scripts contract. Use after setup-verify passes, or when asked to "run the smoke tests", "check the dev server", "run e2e against the scaffold", or "run the heavy checks". Do NOT use in place of setup-verify, or on a project without package.json.
---

# Smoke scaffold

Runs the local checks a scaffold's leaf scripts cannot cover: whether the dev and preview servers actually start, whether the end-to-end suite passes against a real server, and whether the screenshot harness produces output. Standalone from `setup-verify`. Neither skill requires the other to have run first.

## Guards

- If `package.json` does not exist at the project root, stop: `❌ No package.json found. Cannot smoke test.`
- If `node_modules/` does not exist, run `bun install` first, then proceed.

## Step 1: read scripts

Read `package.json` from the project root and extract the `scripts` block. Do not hardcode script names.

## Step 2: run the chain

Run the scripts below in order. Stop on the first failure and surface the error.

| Order | Script       | Skip if | How judged              |
| ----- | ------------ | ------- | ----------------------- |
| 1     | `dev`        | absent  | server smoke, see below |
| 2     | `preview`    | absent  | server smoke, see below |
| 3     | `test:e2e`   | absent  | leaf script: exit code  |
| 4     | `screenshot` | absent  | leaf script: exit code  |

Skip any script not present in `package.json`. Do not invent a fallback command. Run each leaf script as `bun run <script>` from the project root.

### Server smoke

`dev` and `preview` run until stopped, so there is no exit code to read. Start the script backgrounded, wait 5 seconds, then check two things: the process is still running, and its captured output carries no string matching `error`, `Error`, or `fatal`. Kill the process either way once judged. Report a failure on either check failing.

This is weaker than a real readiness probe. No manifest key exposes a generic port to poll across stacks, so port-probing is out of reach here.

## Step 3: report

For each script run, report one of:

- `✅ <script>`
- `❌ <script>` followed by the failing output (last 40 lines) or, for a server script, the reason judged (process died, or a fatal string in its output)

End with a summary line:

- On pass: `✅ Scaffold smoke-tested (<n> scripts passed).`
- On fail: `❌ Scaffold failed at <script>. Fix the error and re-run setup-smoke.`

## Out of scope

- `lint:fix`, `typecheck`, `check`, `test:run`, `build`. Those are `canon:setup-verify`'s leaf-script chain.
- Generating the configs these scripts drive, which the tooling stack reference owns.
