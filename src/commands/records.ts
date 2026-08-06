import type { Command } from 'commander'
import {
  BACKED_FOLDERS,
  type PullOutcome,
  pullRecords,
  type PushOutcome,
  pushRecords,
} from '@/records/backup'
import {
  type Finding,
  isRecordKind,
  RECORD_KINDS,
  type ValidateOutcome,
  validateRecords,
} from '@/records/validate'
import {
  intro,
  logError,
  logInfo,
  logStep,
  logWarn,
  outro,
  pipeOutput,
} from '@/ui'
import { mainWorktreeRoot } from '@/worktree'

/** Returned when a record carries a finding, which is the gating result. */
const EXIT_FINDINGS = 2

interface ValidateCommandOptions {
  readonly json?: boolean
  readonly root?: string
}

type BackupCommandOptions = ValidateCommandOptions

export function register(program: Command): void {
  const records = program
    .command('records')
    .description(
      'Check and back up the gitignored session records under .claude/',
    )
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
        '  memory      filename and type prefix, frontmatter, and the body shape each type carries',
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
        '  aitk records validate memory',
        '  aitk records validate intake --json',
        '',
      ].join('\n'),
    )
    .action(async (kind: string, opts: ValidateCommandOptions) => {
      process.exitCode = await runValidate(kind, opts)
    })

  records
    .command('push')
    .description(
      'Commit the backed record folders and push them to the records remote',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .option('--root <path>', 'Project root, defaulting to the main worktree')
    .addHelpText('after', backupHelp('push'))
    .action(async (opts: BackupCommandOptions) => {
      process.exitCode = await runPush(opts)
    })

  records
    .command('pull')
    .description(
      'Fetch the records remote and write it into the backed record folders',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .option('--root <path>', 'Project root, defaulting to the main worktree')
    .addHelpText('after', backupHelp('pull'))
    .action(async (opts: BackupCommandOptions) => {
      process.exitCode = await runPull(opts)
    })
}

function backupHelp(verb: 'push' | 'pull'): string {
  const direction =
    verb === 'push'
      ? [
          'It commits nothing outside the folders above and leaves the project working',
          'tree untouched. The push runs even when this call committed nothing, since a',
          'previous run can have committed and then failed to reach the network.',
        ]
      : [
          'It refuses rather than discarding local records that never reached the remote,',
          'so a machine holding uncommitted or unpushed records is told to push first.',
        ]

  return [
    '',
    'Backed folders under .claude/:',
    `  ${BACKED_FOLDERS.join(', ')}`,
    '',
    'Exit codes:',
    '  0  the records remote and this machine agree',
    '  1  refused, with the reason on stderr or in the JSON record',
    '',
    ...direction,
    '',
    'The history lives in a second git directory at .claude/.records.git, pointed at a',
    'private repository a person creates once. The verbs refuse with the setup command',
    'when it is absent, and refuse when its origin is also a remote of this project.',
    '',
    'Examples:',
    `  aitk records ${verb}`,
    `  aitk records ${verb} --json`,
    '',
  ].join('\n')
}

async function runPush(opts: BackupCommandOptions): Promise<number> {
  const root = opts.root ?? (await mainWorktreeRoot())
  const outcome = await pushRecords(root)

  if (!outcome.ok)
    return reportRefusal('aitk records push', outcome, opts.json ?? false)

  if (opts.json ?? false) {
    process.stdout.write(`${JSON.stringify(outcome)}\n`)
    return 0
  }

  intro('aitk records push')
  logStep('Staged')
  logInfo(
    `${outcome.folders.length} folder(s), ${outcome.changed} path(s) changed`,
  )
  logStep(outcome.pushed ? 'Pushed' : 'Nothing to push')
  logInfo(
    outcome.commit
      ? `records at ${outcome.commit}`
      : 'no records committed yet',
  )
  outro()
  return 0
}

async function runPull(opts: BackupCommandOptions): Promise<number> {
  const root = opts.root ?? (await mainWorktreeRoot())
  const outcome = await pullRecords(root)

  if (!outcome.ok)
    return reportRefusal('aitk records pull', outcome, opts.json ?? false)

  if (opts.json ?? false) {
    process.stdout.write(`${JSON.stringify(outcome)}\n`)
    return 0
  }

  intro('aitk records pull')
  logStep('Fetched')
  logInfo(`records at ${outcome.commit}`)
  logStep('Written')
  logInfo(`${outcome.files} file(s) across ${outcome.folders.length} folder(s)`)
  outro()
  return 0
}

function reportRefusal(
  banner: string,
  outcome: Extract<PushOutcome | PullOutcome, { ok: false }>,
  emitJson: boolean,
): number {
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

  // The setup refusals carry the commands to run on their own lines. A marker
  // beside a command reads as a result rather than as something to copy, so the
  // remainder goes out unmarked.
  const [reason, ...rest] = outcome.message.split('\n')

  intro(banner)
  logStep('Refused')
  logError(reason)
  if (rest.length > 0) pipeOutput(rest.join('\n'))
  outro()
  return 1
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
