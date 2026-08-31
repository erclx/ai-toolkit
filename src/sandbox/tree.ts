import { randomBytes } from 'node:crypto'
import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * Mints a short per-run identifier the first time it is asked for and holds it
 * in `AITK_SANDBOX_RUN_ID` for the rest of this process, so a script that
 * spawns a child inheriting `process.env` — `run.sh` calling `manage-sandbox.sh`
 * and then `aitk sandbox check` — resolves the same tree in every one of them.
 * A process that already carries the variable, inherited from such a parent,
 * reuses it rather than minting a new one.
 *
 * Twin of `mint_sandbox_run_id` in `scripts/lib/sandbox-path.sh`.
 */
export function mintSandboxRunId(): string {
  const existing = process.env.AITK_SANDBOX_RUN_ID
  if (existing !== undefined && existing !== '') return existing

  const id = randomBytes(4).toString('hex')
  process.env.AITK_SANDBOX_RUN_ID = id
  return id
}

/**
 * The provisioned tree's path, split out of `src/commands/sandbox.ts` so the
 * per-run default is unit-testable on its own rather than only through the
 * command's registration.
 *
 * Twin of `resolve_sandbox_dir` in `scripts/lib/sandbox-path.sh`. The exec
 * boundary rules out a shared constant, so a change to the default lands on
 * both sides. The fall-through used to be one path per machine, so two
 * sessions each resolving the default at once provisioned over each other
 * with neither told; `mintSandboxRunId` gives the path a per-run component
 * instead, which is what makes two such sessions land on two different trees.
 */
export function sandboxTree(): string {
  const override = process.env.AITK_SANDBOX_DIR
  if (override !== undefined && override !== '') return override

  const state = process.env.XDG_STATE_HOME
  const base =
    state !== undefined && state !== ''
      ? state
      : join(homedir(), '.local', 'state')

  return join(base, 'aitk', `sandbox-${mintSandboxRunId()}`)
}
