import { resolve } from 'node:path'
import type { Command } from 'commander'
import {
  BULLET_CHECKPOINT,
  type EntryReport,
  governsContent,
  LENGTH_CHECKPOINT,
  measureFolders,
  missingSections,
  PEER_BULLET_CHECKPOINT,
  PROVENANCE_FOLDER,
  RENDER_WIDTH,
  REQUIRED_SECTIONS,
  RUN_CHECKPOINT,
  type SectionFinding,
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
    .description(
      'Report required sections, entry length, depth, bullet weight, citations, provenance, and index drift',
    )
    .argument('[path]', 'Project root, defaulting to the current directory')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .option(
      '--folder <list>',
      'Comma-separated folder names, resolved under .claude/ then the project root',
    )
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
        'Only unresolved citations set a failing exit code. Section, length,',
        'depth, bullet, table, provenance, and index findings are advisory.',
        '',
        'Examples:',
        '  aitk context audit',
        '  aitk context audit --json',
        '  aitk context audit --citations-only',
        '  aitk context audit --folder context,diagrams',
        '  aitk context audit --folder docs',
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

  // `..` would resolve the audited folder above the project root, taking the
  // scan and the citation pattern outside the tree the audit describes.
  const invalid = names.filter((name) => !FOLDER_NAME.test(name))
  if (invalid.length > 0) {
    return `--folder takes folder names, not paths: ${invalid.join(', ')}`
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

  const { folders, missing } = await resolveFolders(root, names)
  if (folders.length === 0) {
    return refuse(
      `No audited folder found under .claude/ or the project root. Looked for: ${names.join(', ')}.`,
      gateOnly,
    )
  }

  // A default folder a project does not carry is the ordinary case and stays
  // silent. A name passed by hand that resolves nowhere is a typo, and the run
  // measuring the names that did resolve reads as a pass against a folder it
  // never opened.
  const unresolved = opts.folder ? missing : []

  // The gate runs one check. Letting it exit 0 against a scope it could not
  // build reports a pass on nothing measured, which is the outcome a gate is
  // there to prevent.
  const cited = presentNames(folders)
  if (gateOnly && cited.length === 0) {
    return refuse(
      `The citation check spells the .claude/ prefix and no audited folder resolved there. Looked for: ${names.join(', ')}.`,
      gateOnly,
    )
  }

  const citations = await auditCitations(root, cited)
  if (citations.kind === 'unavailable') {
    return refuse(
      'git could not list the tree, so no citation was checked. Run inside a git repository.',
      gateOnly,
    )
  }

  const entries = gateOnly ? [] : await measureFolders(root, folders)
  const drift = gateOnly ? [] : await auditIndexes(folders)
  const sections = gateOnly ? [] : missingSections(root, folders, entries)

  if (gateOnly) {
    reportGate(citations)
  } else {
    intro('aitk context audit')
    reportScope(folders, unresolved)
    reportCitations(citations, cited)
    reportSections(sections, folders)
    reportLength(entries)
    reportDepth(entries)
    reportBullets(entries, folders)
    reportTables(entries)
    reportProvenance(entries, folders)
    reportDrift(drift)
    outro()
  }

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify({
        root,
        folders: folders.map((folder) => ({
          path: folder.rel,
          base: folder.base,
          entries: folder.entries.length,
          governsContent: governsContent(folder),
        })),
        unresolvedFolders: unresolved,
        citations: {
          scanned: citations.scanned,
          total: citations.total,
          unresolved: citations.unresolved,
        },
        entries,
        missingSections: sections,
        indexDrift: drift,
        checkpoints: {
          lines: LENGTH_CHECKPOINT,
          run: RUN_CHECKPOINT,
          runCountsBlankLines: true,
          renderWidth: RENDER_WIDTH,
          peerBullet: PEER_BULLET_CHECKPOINT,
          bullet: BULLET_CHECKPOINT,
          provenanceFolder: PROVENANCE_FOLDER,
          requiredSections: REQUIRED_SECTIONS,
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

/**
 * Names the resolved path of every audited folder, plus the requested names
 * that resolved nowhere.
 *
 * The path is what says which base a name was taken from, which matters once a
 * name can resolve under `.claude/` or at the project root and a project may
 * carry both.
 */
function reportScope(
  folders: readonly AuditedFolder[],
  unresolved: readonly string[],
): void {
  logStep('Scope')

  for (const folder of folders) {
    logInfo(`${folder.rel}: ${folder.entries.length} entries`)
  }

  if (unresolved.length === 0) return

  logWarn(
    `Under neither .claude/ nor the project root: ${unresolved.join(', ')}`,
  )
}

type ScannedCitations = Extract<CitationReport, { kind: 'scanned' }>

/**
 * States the reach before the count, for the reason the provenance report
 * states its own.
 *
 * A run auditing a folder at the project root builds no pattern, and a count of
 * zero followed by a line saying every path resolves is indistinguishable from
 * a corpus that cites nothing.
 */
function reportCitations(
  report: ScannedCitations,
  cited: readonly string[],
): void {
  logStep('Citations')

  if (cited.length === 0) {
    logInfo(
      'Out of scope. The pattern spells the .claude/ prefix, and no audited folder resolved there.',
    )
    return
  }

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

/**
 * Names the path each finding belongs to, which is an entry in the folder named
 * under `.claude/` and the folder itself in a domain split across one. States
 * the reach on every run for the reason the provenance report does.
 *
 * This prints ahead of the four readability measures because a missing section
 * asks whether the entry is the right shape at all, which precedes asking
 * whether it has grown too long.
 */
function reportSections(
  missing: readonly SectionFinding[],
  folders: readonly AuditedFolder[],
): void {
  logStep('Sections')

  const governed = folders.filter(governsContent)
  if (governed.length === 0) {
    logInfo(
      `Out of scope. The list is stated in the standard governing .claude/${PROVENANCE_FOLDER}/, and no audited folder is that one.`,
    )
    return
  }

  logInfo(
    `Covers .claude/${PROVENANCE_FOLDER}/ alone, whose standard requires ${REQUIRED_SECTIONS.join(' and ')}.`,
  )
  logInfo(
    'A heading at any level counts. Each entry answers for itself, except in a domain split across a folder, where a sibling answers for the rest.',
  )

  if (missing.length === 0) {
    logInfo('Every entry declares each required section.')
    return
  }

  logWarn(`${plural(missing.length, 'path')} short a required section`)
  pipeOutput(
    missing
      .map((found) => `${found.rel}  missing: ${found.missing.join(', ')}`)
      .join('\n'),
  )
}

function reportLength(entries: readonly EntryReport[]): void {
  logStep('Length')
  logInfo(
    `Entries measure rendered lines at ${RENDER_WIDTH} columns, counting frontmatter and fenced blocks.`,
  )
  logInfo(
    'A reference-heavy entry therefore ranks by its examples, which the depth check excludes.',
  )

  const over = entries
    .filter((entry) => entry.lines > LENGTH_CHECKPOINT)
    .sort((a, b) => b.lines - a.lines)

  if (over.length === 0) {
    logInfo(`No entry past the ${LENGTH_CHECKPOINT}-line checkpoint.`)
    return
  }

  logWarn(`${over.length} past the ${LENGTH_CHECKPOINT}-line checkpoint`)
  pipeOutput(
    over
      .map((entry) => `${entry.rel}  ${entry.lines} rendered lines`)
      .join('\n'),
  )
}

/**
 * Names the render width and the blank-line convention on every run.
 *
 * The standard settles heading level and fenced blocks and stops there, so a
 * hand reader who drops blank lines lands a line or two below this number.
 * Stating both is what keeps the two measurements reconcilable, and the width
 * matters more than the blank lines because a number counted in rendered lines
 * cannot be reproduced without it.
 */
function reportDepth(entries: readonly EntryReport[]): void {
  logStep('Depth')
  logInfo(
    `Runs measure rendered lines at ${RENDER_WIDTH} columns and count blank lines.`,
  )
  logInfo(
    `Fenced blocks are excluded, and so are peer lists averaging under ${PEER_BULLET_CHECKPOINT} characters a bullet.`,
  )

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
          `${entry.rel}:${entry.longestRunLine}  ${entry.longestRun} rendered lines unbroken`,
      )
      .join('\n'),
  )
}

/**
 * Groups by entry, and states its reach on every run, for the reasons the
 * provenance report does both.
 *
 * Bullets past the checkpoint cluster in a handful of entries and the heaviest
 * entries carry them a dozen at a time, so a flat list of bullets buries the
 * entry holding one. What a reader acts on is which file to open.
 */
function reportBullets(
  entries: readonly EntryReport[],
  folders: readonly AuditedFolder[],
): void {
  logStep('Bullets')

  const governed = folders.filter(governsContent)
  if (governed.length === 0) {
    logInfo(
      `Out of scope. The rule is stated in the standard governing .claude/${PROVENANCE_FOLDER}/, and no audited folder is that one.`,
    )
    return
  }

  logInfo(
    `Covers .claude/${PROVENANCE_FOLDER}/ alone, since moving an incident out of a bullet needs a decision to keep.`,
  )
  logInfo(
    'Top-level bullets measure characters, folding in continuation lines.',
  )
  logInfo(
    'Nested items and fenced blocks are excluded. Weight is a judgment, never a defect.',
  )

  const carrying = entries
    .filter((entry) => entry.heavyBullets.length > 0)
    .sort((a, b) => b.heavyBullets.length - a.heavyBullets.length)

  if (carrying.length === 0) {
    logInfo(`No bullet past the ${BULLET_CHECKPOINT}-character checkpoint.`)
    return
  }

  const total = carrying.reduce(
    (sum, entry) => sum + entry.heavyBullets.length,
    0,
  )
  logWarn(
    `${plural(total, 'bullet')} past the ${BULLET_CHECKPOINT}-character checkpoint across ${carrying.length} ${carrying.length === 1 ? 'entry' : 'entries'}`,
  )
  pipeOutput(
    carrying
      .map(
        (entry) =>
          `${entry.rel}  ${plural(entry.heavyBullets.length, 'bullet')}\n${entry.heavyBullets
            .map((found) => `  :${found.line}  ${found.characters} characters`)
            .join('\n')}`,
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

/**
 * Groups by entry rather than listing every marker.
 *
 * The two entries carrying most of a corpus's markers carry them a dozen at a
 * time, and a flat list of those buries the entries holding one. What a reader
 * acts on is which file to open, so the count sits beside the name and the
 * lines follow it.
 *
 * The reach is stated on every run, including the run where nothing is in
 * scope. A check that covered three folders and now covers one reads as quietly
 * missing things unless the report says which folder it measured.
 */
function reportProvenance(
  entries: readonly EntryReport[],
  folders: readonly AuditedFolder[],
): void {
  logStep('Provenance')

  const governed = folders.filter(governsContent)
  if (governed.length === 0) {
    logInfo(
      `Out of scope. The rule is stated in the standard governing .claude/${PROVENANCE_FOLDER}/, and no audited folder is that one.`,
    )
    return
  }

  logInfo(
    `Covers .claude/${PROVENANCE_FOLDER}/ alone, whose standard carries the rule. The sibling standards do not restate it.`,
  )
  logInfo('Fenced blocks are excluded. A marker is a judgment, never a defect.')

  const carrying = entries
    .filter((entry) => entry.provenance.length > 0)
    .sort((a, b) => b.provenance.length - a.provenance.length)

  if (carrying.length === 0) {
    logInfo('No entry narrates a change.')
    return
  }

  const total = carrying.reduce(
    (sum, entry) => sum + entry.provenance.length,
    0,
  )
  logWarn(
    `${plural(total, 'marker')} across ${carrying.length} ${carrying.length === 1 ? 'entry' : 'entries'}`,
  )
  pipeOutput(
    carrying
      .map(
        (entry) =>
          `${entry.rel}  ${plural(entry.provenance.length, 'marker')}\n${entry.provenance
            .map((found) => `  :${found.line}  ${found.kind}  ${found.text}`)
            .join('\n')}`,
      )
      .join('\n'),
  )
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
