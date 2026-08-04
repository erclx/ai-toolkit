import { $ } from 'bun'
import type { Command } from 'commander'
import {
  type Finding,
  isRecordKind,
  RECORD_KINDS,
  type ValidateOutcome,
  validateRecords,
} from '@/records/validate'
import { intro, logError, logInfo, logStep, logWarn, outro } from '@/ui'

/** Returned when a record carries a finding, which is the gating result. */
const EXIT_FINDINGS = 2

interface ValidateCommandOptions {
  readonly json?: boolean
  readonly root?: string
}

/**
 * The session-record folders are shared scratch at the main worktree root, and
 * `git worktree list` puts that root first. Trusting the working directory would
 * validate a linked worktree's empty folder and report it clean.
 */
async function mainWorktreeRoot(): Promise<string> {
  const result = await $`git worktree list --porcelain`.quiet().nothrow()
  if (result.exitCode !== 0) return process.cwd()

  const line = result.stdout
    .toString()
    .split('\n')
    .find((entry) => entry.startsWith('worktree '))

  return line ? line.slice('worktree '.length).trim() : process.cwd()
}

export function register(program: Command): void {
  const records = program
    .command('records')
    .description('Check the gitignored session records under .claude/')
    .helpOption('-h, --help', 'Show this help message')

  records
    .command('validate')
    .description('Report where a record and the standard governing it disagree')
    .argument('<kind>', `Record folder: ${RECORD_KINDS.join(', ')}`)
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .option('--root <path>', 'Project root, defaulting to the main worktree')
    .addHelpText(
      'after',
      [
        '',
        'Checks:',
        '  plans       filename, required sections, and the suggested-and-answer contract',
        '  groundwork  README and current-state files, numbering, dating, and a half-closed track',
        '  intake      overview file, numbering, dating, and the four bullets every item carries',
        '',
        'Exit codes:',
        '  0  every check passed',
        '  1  refused, with the reason on stderr or in the JSON record',
        '  2  at least one record carries a finding',
        '',
        'It reports and never writes. Each folder is per-machine scratch with no',
        'history behind it, so a session fixes the record the report names.',
        '',
        'Examples:',
        '  aitk records validate plans',
        '  aitk records validate intake --json',
        '',
      ].join('\n'),
    )
    .action(async (kind: string, opts: ValidateCommandOptions) => {
      process.exitCode = await runValidate(kind, opts)
    })
}

async function runValidate(
  kind: string,
  opts: ValidateCommandOptions,
): Promise<number> {
  const emitJson = opts.json ?? false

  if (!isRecordKind(kind)) {
    return report(
      {
        ok: false,
        reason: 'unknown-kind',
        message: `Not a record kind: ${kind}. Expected one of: ${RECORD_KINDS.join(', ')}.`,
      },
      emitJson,
      process.cwd(),
    )
  }

  const root = opts.root ?? (await mainWorktreeRoot())

  return report(await validateRecords(root, kind), emitJson, root)
}

function report(
  outcome: ValidateOutcome,
  emitJson: boolean,
  root: string,
): number {
  if (!outcome.ok) {
    // The framed branch below already reaches stderr through logError, so the
    // bare write is what keeps the JSON mode from reporting the reason on
    // stdout alone.
    if (emitJson) {
      process.stderr.write(`${outcome.message}\n`)
      process.stdout.write(
        `${JSON.stringify({
          ok: false,
          reason: outcome.reason,
          message: outcome.message,
        })}\n`,
      )
      return 1
    }

    intro('aitk records validate')
    logStep('Refused')
    logError(outcome.message)
    outro()
    return 1
  }

  if (emitJson) {
    process.stdout.write(
      `${JSON.stringify({
        ok: true,
        root,
        kind: outcome.kind,
        records: outcome.records,
        findings: outcome.findings,
      })}\n`,
    )
  } else {
    intro('aitk records validate')
    logStep(outcome.kind)
    logInfo(`${outcome.records} record(s) read`)

    logStep(outcome.findings.length === 0 ? 'Clean' : 'Findings')
    if (outcome.findings.length === 0) {
      logInfo('every record matches the shape its standard fixes')
    } else {
      for (const found of outcome.findings) logWarn(describe(found))
    }
    outro()
  }

  return outcome.findings.length > 0 ? EXIT_FINDINGS : 0
}

function describe(found: Finding): string {
  const scope = found.record === found.subject ? '' : `${found.record}: `
  return `${scope}${found.subject} ${found.message}`
}
