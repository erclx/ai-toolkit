import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from 'commander'
import { PROJECT_ROOT, execScript } from '@/exec'
import {
  expectFilePath,
  parseTarget,
  resolveVerdict,
  verdictExitCode,
  type RunEnvelope,
  type Verdict,
} from '@/sandbox/expect'
import {
  intro,
  logError,
  logInfo,
  logRemove,
  logStep,
  logWarn,
  outro,
  select,
} from '@/ui'

const SANDBOX_DIR = join(PROJECT_ROOT, 'scripts', 'sandbox')

/**
 * Holds fixture content for scenarios rather than scenarios of its own.
 * Twin of the `-not -name fixtures` filter in `scripts/manage-sandbox.sh`.
 */
const FIXTURES_DIR = 'fixtures'

/** A run that reported nothing counts as clean, so only real signals fail. */
const CLEAN_ENVELOPE: RunEnvelope = { isError: false, turns: 0, denials: 0 }

interface CheckOptions {
  readonly envelope?: string
  readonly writes?: string
  readonly json?: boolean
}

function getCategories(): string[] {
  return readdirSync(SANDBOX_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== FIXTURES_DIR)
    .map((d) => d.name)
    .sort()
}

function getCommands(category: string): string[] {
  return readdirSync(join(SANDBOX_DIR, category), { withFileTypes: true })
    .filter((f) => f.isFile() && f.name.endsWith('.sh'))
    .map((f) => f.name.replace(/\.sh$/, ''))
    .sort()
}

async function interactivePicker(): Promise<string> {
  intro('aitk sandbox')

  const categories = getCategories()
  const category = await select({
    message: 'Select category:',
    options: categories.map((c) => ({ value: c, label: c })),
  })

  const commands = getCommands(category)
  const command = await select({
    message: 'Select command:',
    options: commands.map((c) => ({ value: c, label: c })),
  })

  return `${category}:${command}`
}

/**
 * Reads the `claude -p --output-format json` envelope. Decision 8 lets the
 * envelope fail a run but never pass one, so an unreadable file falls back to
 * clean rather than manufacturing a failure the expectations did not find.
 */
function readEnvelope(path: string | undefined): RunEnvelope {
  if (path === undefined || !existsSync(path)) return CLEAN_ENVELOPE

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as Record<
      string,
      unknown
    >
    const denials = parsed.permission_denials

    return {
      isError: parsed.is_error === true,
      turns: typeof parsed.num_turns === 'number' ? parsed.num_turns : 0,
      denials: Array.isArray(denials) ? denials.length : 0,
    }
  } catch {
    return CLEAN_ENVELOPE
  }
}

function readWrites(path: string | undefined): string[] {
  if (path === undefined || !existsSync(path)) return []

  return readFileSync(path, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
}

/**
 * The unchecked count rides the summary line in every verdict, including a pass.
 * It is the number the rollout is measured by, and a count that surfaces only on
 * arms that happen to carry prose is a count nobody drains.
 */
function reportVerdict(verdict: Verdict): void {
  if (verdict.results.length > 0) {
    logStep('Checking expectations')
    for (const result of verdict.results) {
      if (result.ok) logInfo(result.message)
      else logRemove(result.message)
    }
  }

  if (verdict.manual.length > 0) {
    logStep('Not checked (needs a reader)')
    for (const line of verdict.manual) logWarn(line)
  }

  logStep(`Verdict: ${verdict.state.toUpperCase()}`)
  if (verdict.note !== undefined) logWarn(verdict.note)

  const summary = `${verdict.asserted} asserted, ${verdict.failed} failed, ${verdict.unchecked} unchecked`
  if (verdict.state === 'unchecked') logWarn(summary)
  else logInfo(summary)
}

function runCheck(
  target: string,
  arm: string | undefined,
  options: CheckOptions,
): void {
  intro('aitk sandbox check')

  const parsed = parseTarget(target)
  if (parsed === undefined) {
    logError('Invalid target. Use <category>:<command>, e.g. claude:docs.')
    outro()
    process.exitCode = 1
    return
  }

  // A sandbox that was never provisioned fails every path assertion, reading as a
  // skill that did nothing rather than a caller that ran check too early. The
  // whole point of a verdict is that it means what it says.
  const sandboxDir = join(PROJECT_ROOT, '.sandbox')
  if (!existsSync(sandboxDir)) {
    logError(`No sandbox at ${sandboxDir}. Provision one with aitk sandbox.`)
    outro()
    process.exitCode = 1
    return
  }

  const verdict = resolveVerdict(
    expectFilePath(PROJECT_ROOT, parsed.category, parsed.command, arm ?? ''),
    {
      sandboxDir,
      writes: readWrites(options.writes),
      envelope: readEnvelope(options.envelope),
    },
  )

  // The report always renders on stderr. `--json` adds the machine copy on
  // stdout rather than replacing the frame, per the stream contract in
  // `docs/agents.md`, so one invocation serves a human and a caller at once.
  reportVerdict(verdict)
  if (options.json === true)
    process.stdout.write(`${JSON.stringify(verdict)}\n`)

  outro()
  process.exitCode = verdictExitCode(verdict.state)
}

export function register(program: Command): void {
  const sandbox = program
    .command('sandbox')
    .description('Provision and run sandbox scenarios')
    .allowUnknownOption()
    .allowExcessArguments(true)
    .passThroughOptions()
    .action(async (_opts: unknown, cmd: Command) => {
      const args = cmd.args

      if (args.length === 0) {
        const resolved = await interactivePicker()
        await execScript('manage-sandbox.sh', ['--no-header', resolved])
      } else {
        await execScript('manage-sandbox.sh', args)
      }
    })

  sandbox
    .command('check')
    .description('Check a provisioned sandbox against a scenario expectation')
    .argument('<target>', 'Scenario as <category>:<command>, e.g. claude:docs')
    .argument('[arm]', 'Named scenario arm, e.g. drift')
    .helpOption('-h, --help', 'Show this help message')
    .option('--envelope <file>', 'Run envelope JSON from claude -p')
    .option('--writes <file>', 'Newline-delimited paths the session wrote')
    .option('--json', 'Emit the verdict as JSON on stdout')
    .addHelpText(
      'after',
      [
        '',
        'Examples:',
        '  aitk sandbox check claude:docs drift',
        '  aitk sandbox check claude:docs drift --envelope run.json --json',
        '',
        'Exit codes: 0 on pass or unchecked, 1 on failure.',
      ].join('\n'),
    )
    .action(
      (target: string, arm: string | undefined, options: CheckOptions) => {
        runCheck(target, arm, options)
      },
    )
}
