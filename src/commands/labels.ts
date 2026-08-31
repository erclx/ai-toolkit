import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Command } from 'commander'
import { type LabelAuditRefusal, auditLabels } from '@/labels/audit'
import { MAP_REL } from '@/labels/map'
import { scanPhaseLabels } from '@/labels/phase'
import { intro, logInfo, logStep, logWarn, outro, plural } from '@/ui'

interface AuditOptions {
  readonly base?: string
  readonly root?: string
  readonly json?: boolean
}

interface ScanOptions {
  readonly event?: string
  readonly title?: string
  readonly body?: string
  readonly head?: string
  readonly json?: boolean
}

/** What a reader does about each way the audit produced no reading. */
const REFUSALS: Record<LabelAuditRefusal, string> = {
  // An answer rather than a fault. A project declaring no map is labelled
  // silently by design, so a refusal reading as a break would make the map
  // mandatory for every target.
  'no-map': `No ${MAP_REL} here, so this project labels nothing and declares no surfaces to cover.`,
  'unreadable-map': `${MAP_REL} is not valid TOML, so no row could be read.`,
  'no-domains': `${MAP_REL} carries no usable row under [domains], so every path would read as uncovered.`,
  'no-base': 'No base resolves against the trunk. Fetch origin or pass --base.',
  'bad-base':
    'The ref passed to --base resolves to no commit here. Pass one this tree carries.',
  'unreadable-changes':
    'git could not list what this branch changed, so the set is unknown.',
}

export function register(program: Command): void {
  const labels = program
    .command('labels')
    .description('Resolve a changed set against the pull request label map')
    .helpOption('-h, --help', 'Show this help message')

  labels
    .command('audit')
    .description(
      'Report the labels a changed set earns and the paths no row reaches',
    )
    .argument(
      '[paths...]',
      'Changed set to read, defaulting to the branch range',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option('--base <ref>', 'Far side of the range, defaulting to the trunk')
    .option('--root <path>', 'Repository to read, defaulting to the cwd')
    .option('--json', 'Add a machine-readable record on stdout')
    .addHelpText(
      'after',
      [
        '',
        `Reads ${MAP_REL} and matches it prefix-anchored, which is the rule the`,
        "map's own census was measured against. It reports and never gates,",
        'because whether an uncovered surface deserves a label is a judgment.',
        '',
        'What it separates:',
        '  uncovered  a surface no row reaches, which is a gap wanting a row',
        '  declined   a path a [declined] row names, which is a decision already taken',
        '',
        'What it does not measure:',
        '  a prefix reaching no path, which is the map going stale from the other',
        '  side and a second measure rather than this one',
        '',
        'Exit codes:',
        '  0  every changed path is labelled or declined',
        '  1  refused, with the reason on stderr or in the JSON record',
        '  2  at least one changed path is reached by no row',
        '',
        'Examples:',
        '  aitk labels audit',
        '  aitk labels audit --json',
        '  aitk labels audit --base origin/main',
        '  aitk labels audit src/cli.ts docs/index.md --json',
        '',
      ].join('\n'),
    )
    .action(async (paths: string[], opts: AuditOptions) => {
      process.exitCode = await runAudit(paths, opts)
    })

  labels
    .command('scan')
    .description(
      'Fail a pull request whose title or body carries a phase label',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option(
      '--event <path>',
      'GitHub pull_request event payload to read, such as $GITHUB_EVENT_PATH',
    )
    .option('--title <text>', 'Title to scan, overriding the event payload')
    .option('--body <text>', 'Body to scan, overriding the event payload')
    .option('--head <ref>', 'Head branch, overriding the event payload')
    .option('--json', 'Add a machine-readable record on stdout')
    .addHelpText(
      'after',
      [
        '',
        'Reads aitk standards versioning for the two namespaces and sorts every',
        'version-shaped token this pull request carries into the one the pull',
        'request is allowed to hold. A release-please pull request, read off its',
        'own fixed head branch and title, may carry semver references. Every',
        'other pull request may carry neither, so any token found there is a',
        'leaked phase label.',
        '',
        'Exit codes:',
        '  0  no phase label found',
        '  1  refused, with the reason on stderr or in the JSON record',
        '  2  the title or body carries a phase label',
        '',
        'Examples:',
        '  aitk labels scan --event "$GITHUB_EVENT_PATH"',
        '  aitk labels scan --title "feat: x" --body "planned under v68.5" --head feat/x',
        '',
      ].join('\n'),
    )
    .action(async (opts: ScanOptions) => {
      process.exitCode = await runScan(opts)
    })
}

async function runAudit(paths: string[], opts: AuditOptions): Promise<number> {
  const root = resolve(opts.root ?? process.cwd())
  const emitJson = opts.json ?? false

  const report = await auditLabels(root, {
    base: opts.base,
    ...(paths.length > 0 && { paths }),
  })

  intro('aitk labels audit')

  // The frame renders on stderr in both modes and the record goes to stdout
  // alone, so an operator reading the terminal sees the refusal rather than a
  // command that appeared to do nothing.
  if (report.kind === 'refused') {
    logStep('Refused')
    logWarn(REFUSALS[report.reason])
    outro()

    if (emitJson) {
      process.stdout.write(
        `${JSON.stringify({
          root,
          reason: report.reason,
          message: REFUSALS[report.reason],
        })}\n`,
      )
    }
    return 1
  }

  const { coverage } = report

  logStep('Scope')
  logInfo(
    report.base === undefined
      ? `${plural(report.changed.length, 'path')} supplied by the caller`
      : `${plural(report.changed.length, 'path')} changed since ${report.base.slice(0, 8)}`,
  )

  logStep('Labels')
  logInfo(
    coverage.labels.length === 0
      ? 'this set earns no label'
      : coverage.labels.join(', '),
  )

  // Named rather than counted into the uncovered line. A path somebody decided
  // against wants nothing done, and folding it in would ask for a row that was
  // already refused.
  logStep('Declined')
  if (coverage.declined.length === 0) {
    logInfo('no changed path is deliberately unlabelled')
  } else {
    for (const entry of coverage.declined) {
      logInfo(`${entry.path}: ${entry.reason}`)
    }
  }

  logStep(coverage.uncovered.length === 0 ? 'Covered' : 'Uncovered')
  if (coverage.uncovered.length === 0) {
    logInfo('every changed path is reached by a row')
  } else {
    logWarn(
      `${plural(coverage.uncovered.length, 'path')} reached by no row. Give each a prefix on the row that owns its subject, or a [declined] row with the reason it earns none.`,
    )
    for (const path of coverage.uncovered) logWarn(path)
  }

  outro()

  if (emitJson) {
    process.stdout.write(
      `${JSON.stringify({
        root,
        ...(report.base !== undefined && { base: report.base }),
        changed: report.changed,
        labels: coverage.labels,
        declined: coverage.declined,
        uncovered: coverage.uncovered,
      })}\n`,
    )
  }

  return coverage.uncovered.length === 0 ? 0 : 2
}

/** Why `runScan` had no title and body to hand `scanPhaseLabels`. */
type ScanInputRefusal = 'no-input' | 'unreadable-event' | 'not-a-pull-request'

type ResolvedScanInput =
  | {
      readonly kind: 'resolved'
      readonly title: string
      readonly body: string
      readonly headRefName: string
    }
  | {
      readonly kind: 'refused'
      readonly reason: ScanInputRefusal
      readonly message: string
    }

/**
 * Reads a title, a body, and a head branch from explicit flags first and the
 * named event payload second, so a caller testing the wiring by hand never
 * needs a real GitHub event file on disk.
 */
function resolveScanInput(opts: ScanOptions): ResolvedScanInput {
  let title = opts.title
  let body = opts.body
  let headRefName = opts.head

  if (opts.event !== undefined) {
    let raw: string
    try {
      raw = readFileSync(opts.event, 'utf8')
    } catch {
      return {
        kind: 'refused',
        reason: 'unreadable-event',
        message: `${opts.event} could not be read, so no payload was there to scan.`,
      }
    }

    let payload: unknown
    try {
      payload = JSON.parse(raw)
    } catch {
      return {
        kind: 'refused',
        reason: 'unreadable-event',
        message: `${opts.event} is not valid JSON, so no payload was there to scan.`,
      }
    }

    const pullRequest =
      typeof payload === 'object' && payload !== null
        ? (payload as Record<string, unknown>).pull_request
        : undefined

    if (typeof pullRequest !== 'object' || pullRequest === null) {
      return {
        kind: 'refused',
        reason: 'not-a-pull-request',
        message: `${opts.event} carries no pull_request, so no title or body exists to scan.`,
      }
    }

    const record = pullRequest as Record<string, unknown>
    const head = record.head
    title ??= typeof record.title === 'string' ? record.title : undefined
    body ??= typeof record.body === 'string' ? record.body : undefined
    headRefName ??=
      typeof head === 'object' &&
      head !== null &&
      typeof (head as Record<string, unknown>).ref === 'string'
        ? ((head as Record<string, unknown>).ref as string)
        : undefined
  }

  if (title === undefined) {
    return {
      kind: 'refused',
      reason: 'no-input',
      message:
        'No --event, --title, or --body given, so there is nothing to scan.',
    }
  }

  return {
    kind: 'resolved',
    title,
    body: body ?? '',
    headRefName: headRefName ?? '',
  }
}

async function runScan(opts: ScanOptions): Promise<number> {
  const emitJson = opts.json ?? false

  intro('aitk labels scan')

  const resolved = resolveScanInput(opts)

  if (resolved.kind === 'refused') {
    logStep('Refused')
    logWarn(resolved.message)
    outro()

    if (emitJson) {
      process.stdout.write(
        `${JSON.stringify({ reason: resolved.reason, message: resolved.message })}\n`,
      )
    }
    return 1
  }

  const result = scanPhaseLabels(resolved)

  logStep('Pull request')
  logInfo(
    result.cutsRelease
      ? 'reads as a release-please pull request'
      : 'reads as an ordinary pull request',
  )

  logStep(result.phaseLabels.length === 0 ? 'Clean' : 'Phase label found')
  if (result.phaseLabels.length === 0) {
    logInfo('no phase label in the title or body')
  } else {
    logWarn(
      `${plural(result.phaseLabels.length, 'phase label')} in the title or body. Describe the change itself and drop the internal label before publishing.`,
    )
    for (const label of result.phaseLabels) logWarn(label)
  }

  outro()

  if (emitJson) {
    process.stdout.write(
      `${JSON.stringify({
        cutsRelease: result.cutsRelease,
        phaseLabels: result.phaseLabels,
        semverTags: result.semverTags,
      })}\n`,
    )
  }

  return result.phaseLabels.length === 0 ? 0 : 2
}
