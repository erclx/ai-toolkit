import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { PROJECT_ROOT } from '@/project-root'

const CLI = join(PROJECT_ROOT, 'src/cli.ts')

export interface ProcessRun {
  readonly status: number | null
  readonly stdout: string
  readonly stderr: string
  readonly json: unknown
}

export interface RunCliOptions {
  readonly cwd: string
  readonly env?: NodeJS.ProcessEnv
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
 */
export function runCli(
  args: readonly string[],
  options: RunCliOptions,
): ProcessRun {
  const inherited = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')),
  )

  const result = spawnSync('bun', [CLI, ...args], {
    cwd: options.cwd,
    encoding: 'utf8',
    env: { ...inherited, AITK_NON_INTERACTIVE: '1', ...options.env },
  })

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
