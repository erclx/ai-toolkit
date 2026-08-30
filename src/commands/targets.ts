import type { Command } from 'commander'
import { readPullsAcross, type TargetPulls } from '@/targets/pulls'
import {
  type KnownTarget,
  type ResolvedTargets,
  resolveTargets,
} from '@/targets/resolve'
import { DEFAULT_DEPTH, type SweepBound } from '@/targets/sweep'
import {
  intro,
  logInfo,
  logStep,
  logWarn,
  outro,
  pipeOutput,
  plural,
} from '@/ui'

interface ListOptions {
  readonly json?: boolean
  readonly sweep?: string[]
  readonly depth?: string
}

interface PullsOptions extends ListOptions {}

/**
 * Reads the depth a sweep is bounded by, or null when the value is not one.
 *
 * `Number('abc')` is `NaN` and every `level >= NaN` test is false, so an
 * unchecked value walks to the bottom of whatever root it was given while
 * the bound reports a depth of `NaN`. Both halves of the guarantee go at once,
 * which is why this refuses rather than falling back to the default.
 */
function readDepth(value: string | undefined): number | null {
  const depth = Number(value ?? DEFAULT_DEPTH)

  return Number.isInteger(depth) && depth >= 0 ? depth : null
}

const REFUSALS: Record<string, string> = {
  'not-a-directory': 'the path is not a directory, so nothing was read there',
  'gh-unavailable': 'gh is not on the path, so no pull request could be read',
  'list-failed':
    'the open pull request list could not be read, so this is not a target with no work',
}

export function register(program: Command): void {
  const targets = program
    .command('targets')
    .description('Report the projects this toolkit has installed into')
    .helpOption('-h, --help', 'Show this help message')

  targets
    .command('list')
    .description('Report every known target with where the answer came from')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .option(
      '--sweep <path...>',
      'Also walk these roots for targets the record never held',
    )
    .option(
      '--depth <n>',
      'How deep below each swept root to walk',
      String(DEFAULT_DEPTH),
    )
    .addHelpText('after', LIST_HELP)
    .action(async (opts: ListOptions) => {
      process.exitCode = await runList(opts)
    })

  targets
    .command('pulls')
    .description(
      'Report the open pull request, checks, and review heading per target',
    )
    .argument('[path...]', 'Targets to read, defaulting to every known one')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .option('--sweep <path...>', 'Also walk these roots when no path is given')
    .option(
      '--depth <n>',
      'How deep below each swept root to walk',
      String(DEFAULT_DEPTH),
    )
    .addHelpText('after', PULLS_HELP)
    .action(async (paths: string[], opts: PullsOptions) => {
      process.exitCode = await runPulls(paths, opts)
    })
}

const LIST_HELP = [
  '',
  'Sources:',
  '  Every sync that stamps a target records it in a machine-level index, so',
  '  a project installed since that shipped is known without being named.',
  '  --sweep walks the roots given for anything installed before it, and a',
  '  target found in two clones is reported once with both paths.',
  '',
  'Exit codes:',
  '  0  the population was read',
  '  1  refused, with the reason on stderr',
  '',
  'An absent index is reported as unknown rather than as no targets. Nothing',
  'was read in that case, so a count of zero would be a confident wrong answer.',
  '',
  'The JSON carries a "bound" object whenever a sweep ran, naming the roots',
  'walked, the depth, the folders the walk stopped at, the roots it could not',
  'read, and the directory symlinks the walk did not follow. A sweep cannot',
  'see another machine or a clone under a path nobody named, so read the bound',
  'before treating the count as the population.',
  '',
  'An exit code says nothing about a call made from a session, since a shell',
  'profile may wrap the binary in a function taking its status from a later',
  'command. Read the record rather than the exit when a skill consumes this.',
  '',
  'Examples:',
  '  aitk targets list',
  '  aitk targets list --json',
  '  aitk targets list --sweep ~/repos --json',
  '',
].join('\n')

const PULLS_HELP = [
  '',
  'Reads, per target, every open pull request with its checks and the heading',
  'its newest review pass carries. Naming paths reads those and looks up',
  'nothing; naming none reads every target `aitk targets list` reports.',
  '',
  'Exit codes:',
  '  0  at least one target was read',
  '  1  refused, or every target refused',
  '',
  'A target that could not be read carries a "reason" rather than an empty',
  'pull list, since reading a failed query as no open work is what reports a',
  'target as done having read nothing.',
  '',
  '"checks" is null when GitHub reported no check at all, which is not the',
  'same answer as passing. "review" is "open" while the newest pass carries',
  '## Review, "closed" once one carries ## Review closed, and null when no',
  'pass has landed. "reviewReadable" is false when that query failed, which',
  'leaves "review" covering nothing.',
  '',
  'Examples:',
  '  aitk targets pulls',
  '  aitk targets pulls ../caret ../stackr --json',
  '',
].join('\n')

async function runList(opts: ListOptions): Promise<number> {
  intro('aitk targets list')

  const depth = readDepth(opts.depth)

  if (depth === null) return refuseDepth(opts)

  const resolved = await resolveTargets({ sweep: opts.sweep, depth })

  const unknown = reportTargets(resolved)
  if (resolved.bound) reportBound(resolved.bound)
  outro()

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify({
        registry: resolved.registry?.path ?? null,
        known: resolved.registry?.kind !== 'absent',
        targets: resolved.targets,
        bound: resolved.bound,
      })}\n`,
    )
  }

  return unknown ? 1 : 0
}

async function runPulls(paths: string[], opts: PullsOptions): Promise<number> {
  intro('aitk targets pulls')

  const depth = readDepth(opts.depth)

  if (depth === null) return refuseDepth(opts)

  const resolved = await resolveTargets({ paths, sweep: opts.sweep, depth })

  if (resolved.targets.length === 0) {
    logStep('Refused')
    logWarn(
      resolved.registry?.kind === 'absent'
        ? `No target index at ${resolved.registry.path}, and no path was given. Name the targets, or sweep for them with --sweep.`
        : 'No target resolved, so nothing was read.',
    )
    outro()

    if (opts.json) {
      process.stdout.write(
        `${JSON.stringify({ reason: 'no-targets', targets: [] })}\n`,
      )
    }

    return 1
  }

  // One clone per project. Two checkouts sharing an origin answer the same
  // query, so reading both spends the rate limit to print one answer twice.
  const reports = await readPullsAcross(
    resolved.targets.map((target) => target.paths[0] ?? ''),
  )

  reportPulls(reports)
  outro()

  if (opts.json) {
    process.stdout.write(`${JSON.stringify({ targets: reports })}\n`)
  }

  return reports.every((report) => report.kind === 'refused') ? 1 : 0
}

function refuseDepth(opts: ListOptions): number {
  logStep('Refused')
  logWarn(
    `--depth takes a whole number of levels and was given ${opts.depth}. A value that is not one leaves the walk with no cap at all.`,
  )
  outro()

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify({ reason: 'bad-depth', depth: opts.depth, targets: [] })}\n`,
    )
  }

  return 1
}

/** Returns whether the population is unknown, which is the one refusal this read has. */
function reportTargets(resolved: ResolvedTargets): boolean {
  logStep('Targets')

  if (resolved.registry?.kind === 'absent' && resolved.bound === null) {
    logWarn(
      `No target index at ${resolved.registry.path}. Nothing was read, so this is not a machine with no targets. Sweep for them with --sweep, or run a sync in a target to record it.`,
    )
    return true
  }

  if (resolved.targets.length === 0) {
    logInfo('No target found.')
    return false
  }

  logInfo(plural(resolved.targets.length, 'target'))
  pipeOutput(resolved.targets.map(describe).join('\n'))
  return false
}

function describe(target: KnownTarget): string {
  const flags = [target.source, ...(target.legacy ? ['legacy stamp'] : [])]
  const clones =
    target.paths.length > 1 ? `\n  ${target.paths.slice(1).join('\n  ')}` : ''

  return `${target.paths[0]}  ${flags.join(', ')}${clones}`
}

function reportBound(bound: SweepBound): void {
  logStep('Bound')
  logInfo(
    `Walked ${plural(bound.roots.length, 'root')} to depth ${bound.depth} on this machine alone.`,
  )

  if (bound.truncated.length > 0) {
    logWarn(
      `${plural(bound.truncated.length, 'folder')} hit the depth cap, so a target below one is unseen.`,
    )
  }

  if (bound.unreadable.length > 0) {
    logWarn(
      `${plural(bound.unreadable.length, 'root')} could not be read: ${bound.unreadable.join(', ')}`,
    )
  }

  if (bound.symlinks.length > 0) {
    const verb = bound.symlinks.length === 1 ? 'was' : 'were'
    logWarn(
      `${plural(bound.symlinks.length, 'symlink')} to a directory ${verb} not followed: ${bound.symlinks.join(', ')}`,
    )
  }
}

function reportPulls(reports: readonly TargetPulls[]): void {
  logStep('Pull requests')

  for (const report of reports) {
    if (report.kind === 'refused') {
      logWarn(`${report.path}: ${REFUSALS[report.reason] ?? report.reason}`)
      continue
    }

    if (report.pulls.length === 0) {
      logInfo(`${report.path}: nothing open.`)
      continue
    }

    logInfo(`${report.path}`)
    pipeOutput(
      report.pulls
        .map((pull) => {
          const checks = pull.checks ?? 'no checks'
          const review = pull.reviewReadable
            ? (pull.review ?? 'no pass')
            : 'review unreadable'
          return `  #${pull.number}  ${checks}  ${review}  ${pull.url}`
        })
        .join('\n'),
    )
  }
}
