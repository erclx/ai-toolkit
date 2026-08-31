import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { PROJECT_ROOT } from '@/project-root'
import { registryPath } from '@/targets/registry'

const CLI = join(PROJECT_ROOT, 'src/cli.ts')

/** No case has ever needed longer, and a blocked verb should fail fast. */
const DEFAULT_TIMEOUT_MS = 10_000

export interface ProcessRun {
  readonly status: number | null
  readonly stdout: string
  readonly stderr: string
  readonly json: unknown
}

export interface RunCliOptions {
  readonly cwd: string
  readonly env?: NodeJS.ProcessEnv
  readonly timeoutMs?: number
}

/**
 * Thrown when a case reaches past its declared temporary directory into this
 * machine's real toolkit state. `gov install` and `gov sync` both record the
 * target they ran against into `stateDir()/targets.json`, so a case that
 * inherits the real `HOME` unmodified writes a row for a directory `afterEach`
 * is about to delete, and nothing but this check would ever say so.
 */
export class ContainmentViolation extends Error {}

/**
 * Compares two snapshots of the real machine's target registry and reports
 * whether a spawn changed it. A pure comparison over the two reads rather
 * than the read itself, so the detection logic is testable without touching
 * the filesystem or spawning anything.
 */
export function detectRegistryLeak(
  before: string | undefined,
  after: string | undefined,
): boolean {
  return before !== after
}

function readRealRegistry(): string | undefined {
  try {
    return readFileSync(registryPath(), 'utf8')
  } catch {
    return undefined
  }
}

/**
 * Spawns the real entry point rather than calling a command's action function
 * in-process, so a case answers whether a verb is registered, whether it
 * exits the way its own contract states, and whether its `--json` record
 * parses off stdout alone, none of which an in-process call can misreport.
 *
 * A git hook exports `GIT_DIR`, which would resolve a fixture's git-aware
 * reads against this checkout instead of the temporary directory a case
 * builds, so every spawn drops the `GIT_` prefix before adding the headless
 * flag every case needs to avoid a picker blocking on stdin.
 *
 * `AITK_STATE_DIR` gets the same treatment as `GIT_DIR`, pointed at a folder
 * under the case's own `cwd` rather than dropped, since dropping it alone
 * would still resolve through the inherited `HOME` to this machine's real
 * `~/.local/state/aitk`. A case explicitly passing its own value through
 * `options.env` still wins, matching `AITK_NON_INTERACTIVE` below.
 *
 * The registry snapshot before and after the spawn is what actually catches
 * an escape past that redirection, since a default can be wrong in a way a
 * case never asserts on its own. `ContainmentViolation` fails loud rather
 * than leaving a dead row for a reviewer to find on a real machine.
 */
export function runCli(
  args: readonly string[],
  options: RunCliOptions,
): ProcessRun {
  const inherited = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')),
  )

  const before = readRealRegistry()

  const result = spawnSync('bun', [CLI, ...args], {
    cwd: options.cwd,
    encoding: 'utf8',
    timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    env: {
      ...inherited,
      AITK_NON_INTERACTIVE: '1',
      AITK_STATE_DIR: join(options.cwd, '.aitk-state'),
      ...options.env,
    },
  })

  const after = readRealRegistry()
  if (detectRegistryLeak(before, after)) {
    throw new ContainmentViolation(
      `A case wrote into this machine's real target registry at ${registryPath()}. ` +
        'Every process-tier case must stay inside the directory it declared.',
    )
  }

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    json: parseJson(result.stdout),
  }
}

/**
 * Data goes to stdout and framing to stderr, so a harness reading `--json`
 * off the merged output would assert against a record no verb ever wrote. A
 * command that emits no JSON, or fails before it gets there, leaves the
 * field `undefined` rather than throwing, so a case asserting the exit code
 * of a refusal is not also forced to guard a parse.
 */
function parseJson(stdout: string): unknown {
  const trimmed = stdout.trim()
  if (trimmed === '') return undefined

  try {
    return JSON.parse(trimmed)
  } catch {
    return undefined
  }
}
