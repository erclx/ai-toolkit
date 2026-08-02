import { resolve } from 'node:path'
import type { Command } from 'commander'
import {
  type EntryReport,
  LENGTH_CHECKPOINT,
  measureFolders,
  RUN_CHECKPOINT,
} from '@/context/audit'
import { auditCitations, type CitationReport } from '@/context/citations'
import {
  type AuditedFolder,
  DEFAULT_FOLDERS,
  presentNames,
  resolveFolders,
} from '@/context/folders'
import { auditIndexes, type FolderDrift } from '@/context/index-drift'
import {
  frameError,
  intro,
  logError,
  logInfo,
  logStep,
  logWarn,
  outro,
  pipeOutput,
} from '@/ui'

/** Returned when an unresolved citation is found, which is the gating check. */
const EXIT_UNRESOLVED = 2

/** A name of dots alone is `.` or `..`, both of which escape the audit root. */
const FOLDER_NAME = /^(?!\.+$)[A-Za-z0-9._-]+$/

interface AuditCommandOptions {
  readonly json?: boolean
  readonly folder?: string
  readonly citationsOnly?: boolean
}

export function register(program: Command): void {
  const context = program
    .command('context')
    .description('Report the structural state of the context folders')
    .helpOption('-h, --help', 'Show this help message')

  context
    .command('audit')
    .description('Report entry length, depth, citations, and index drift')
    .argument('[path]', 'Project root, defaulting to the current directory')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .option('--folder <list>', `Comma-separated folder names under .claude/`)
    .option('--citations-only', 'Run the gating citation check alone')
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  the audit completed with every cited path resolving',
        '  1  refused, with the reason on stderr',
        '  2  a cited path did not resolve',
        '',
        'Only unresolved citations set a failing exit code. Length, depth,',
        'table, and index findings are advisory.',
        '',
        'Examples:',
        '  aitk context audit',
        '  aitk context audit --json',
        '  aitk context audit --citations-only',
        '  aitk context audit --folder context,diagrams',
        '',
      ].join('\n'),
    )
    .action(async (path: string | undefined, opts: AuditCommandOptions) => {
      process.exitCode = await runAudit(path, opts)
    })
}

function parseFolders(list: string | undefined): string[] | string {
  if (!list) return [...DEFAULT_FOLDERS]

  const names = list
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  if (names.length === 0) return 'Empty --folder list. Pass at least one name.'

  // `..` would resolve the audit root above `.claude/`, where `presentNames`
  // has no folder name to slice out and hands the citation pattern undefined.
  const invalid = names.filter((name) => !FOLDER_NAME.test(name))
  if (invalid.length > 0) {
    return `--folder takes folder names under .claude/, not paths: ${invalid.join(', ')}`
  }

  return names
}

async function runAudit(
  path: string | undefined,
  opts: AuditCommandOptions,
): Promise<number> {
  const root = resolve(path ?? process.cwd())
  const names = parseFolders(opts.folder)
  const gateOnly = opts.citationsOnly ?? false

  if (typeof names === 'string') return refuse(names, gateOnly)

  const folders = await resolveFolders(root, names)
  if (folders.length === 0) {
    return refuse(
      `No audited folder found under .claude/. Looked for: ${names.join(', ')}.`,
      gateOnly,
    )
  }

  const citations = await auditCitations(root, presentNames(folders))
  if (citations.kind === 'unavailable') {
    return refuse(
      'git could not list the tree, so no citation was checked. Run inside a git repository.',
      gateOnly,
    )
  }

  const entries = gateOnly ? [] : await measureFolders(root, folders)
  const drift = gateOnly ? [] : await auditIndexes(folders)

  if (gateOnly) {
    reportGate(citations)
  } else {
    intro('aitk context audit')
    reportScope(folders)
    reportCitations(citations)
    reportLength(entries)
    reportDepth(entries)
    reportTables(entries)
    reportDrift(drift)
    outro()
  }

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify({
        root,
        folders: folders.map((folder) => ({
          path: folder.rel,
          entries: folder.entries.length,
        })),
        citations: {
          scanned: citations.scanned,
          total: citations.total,
          unresolved: citations.unresolved,
        },
        entries,
        indexDrift: drift,
        checkpoints: {
          lines: LENGTH_CHECKPOINT,
          run: RUN_CHECKPOINT,
          runCountsBlankLines: true,
        },
      })}\n`,
    )
  }

  return citations.unresolved.length > 0 ? EXIT_UNRESOLVED : 0
}

function refuse(message: string, gateOnly: boolean): number {
  if (gateOnly) {
    frameError(message)
    return 1
  }

  intro('aitk context audit')
  logStep('Refused')
  logWarn(message)
  outro()
  return 1
}

/**
 * Prints nothing when every path resolves.
 *
 * `--citations-only` is what `verify.sh` runs on every push, and that script
 * pipes a stage's whole output into its own frame. A passing gate that printed
 * its frame would nest one inside the other on every contributor's push.
 */
function reportGate(report: ScannedCitations): void {
  const count = report.unresolved.length
  if (count === 0) return

  intro('aitk context audit')
  logError(
    count === 1
      ? '1 cited path does not resolve'
      : `${count} cited paths do not resolve`,
  )
  pipeOutput(
    report.unresolved
      .map((citation) => `${citation.file}:${citation.line}  ${citation.path}`)
      .join('\n'),
  )
  outro()
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

function reportScope(folders: readonly AuditedFolder[]): void {
  logStep('Scope')

  for (const folder of folders) {
    logInfo(`${folder.rel}: ${folder.entries.length} entries`)
  }
}

type ScannedCitations = Extract<CitationReport, { kind: 'scanned' }>

function reportCitations(report: ScannedCitations): void {
  logStep('Citations')
  logInfo(
    `${plural(report.total, 'cited path')} across ${plural(report.scanned, 'file')}, fixtures and fenced examples excluded`,
  )

  if (report.unresolved.length === 0) {
    logInfo('Every cited path resolves.')
    return
  }

  logWarn(`${report.unresolved.length} unresolved`)
  pipeOutput(
    report.unresolved
      .map((citation) => `${citation.file}:${citation.line}  ${citation.path}`)
      .join('\n'),
  )
}

function reportLength(entries: readonly EntryReport[]): void {
  logStep('Length')

  const over = entries
    .filter((entry) => entry.lines > LENGTH_CHECKPOINT)
    .sort((a, b) => b.lines - a.lines)

  if (over.length === 0) {
    logInfo(`No entry past the ${LENGTH_CHECKPOINT}-line checkpoint.`)
    return
  }

  logWarn(`${over.length} past the ${LENGTH_CHECKPOINT}-line checkpoint`)
  pipeOutput(
    over.map((entry) => `${entry.rel}  ${entry.lines} lines`).join('\n'),
  )
}

/**
 * Names the blank-line convention on every run.
 *
 * The standard settles heading level and fenced blocks and stops there, so a
 * hand reader who drops blank lines lands a line or two below this number.
 * Stating it is what keeps the two measurements reconcilable.
 */
function reportDepth(entries: readonly EntryReport[]): void {
  logStep('Depth')
  logInfo('Runs count blank lines. Fenced blocks and peer lists are excluded.')

  const over = entries
    .filter((entry) => entry.longestRun > RUN_CHECKPOINT)
    .sort((a, b) => b.longestRun - a.longestRun)

  if (over.length === 0) {
    logInfo(`No run past the ${RUN_CHECKPOINT}-line checkpoint.`)
    return
  }

  logWarn(`${over.length} past the ${RUN_CHECKPOINT}-line checkpoint`)
  pipeOutput(
    over
      .map(
        (entry) =>
          `${entry.rel}:${entry.longestRunLine}  ${entry.longestRun} lines unbroken`,
      )
      .join('\n'),
  )
}

function reportTables(entries: readonly EntryReport[]): void {
  logStep('Tables')

  const candidates = entries.flatMap((entry) =>
    entry.catalogTables.map(
      (table) => `${entry.rel}:${table.line}  ${table.rows} rows`,
    ),
  )

  if (candidates.length === 0) {
    logInfo('No table reads as a catalog that grows a row per shipped thing.')
    return
  }

  logWarn(`${plural(candidates.length, 'candidate')} for a bullet list`)
  pipeOutput(candidates.join('\n'))
}

function reportDrift(drift: readonly FolderDrift[]): void {
  logStep('Index drift')

  const lines = drift.flatMap((folder) => [
    ...folder.unlisted.map((name) => `${folder.rel}  unlisted: ${name}`),
    ...folder.missing.map((name) => `${folder.rel}  missing: ${name}`),
  ])

  if (lines.length === 0) {
    logInfo('Every index agrees with its siblings.')
    return
  }

  logWarn(plural(lines.length, 'disagreement'))
  pipeOutput(lines.join('\n'))
}
