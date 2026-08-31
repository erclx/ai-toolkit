import { resolve } from 'node:path'
import type { Command } from 'commander'
import { execa } from 'execa'
import { gitEnv } from '@/git-env'
import {
  compareMetadata,
  type CurrentMetadata,
  type MetadataDiff,
  proposeMetadata,
} from '@/repo/metadata'
import {
  intro,
  logAdd,
  logInfo,
  logRemove,
  logStep,
  logWarn,
  outro,
} from '@/ui'

const GH_TIMEOUT_MS = 30_000

type SourceRefusal = 'gh-missing' | 'gh-failed'
type ApplyRefusal = SourceRefusal | 'no-changes' | 'empty-topics'

const REFUSALS: Record<ApplyRefusal, string> = {
  'gh-missing': 'gh is not on the path, so no remote could be read.',
  'gh-failed':
    'gh could not read this repository. Check the remote and gh auth status.',
  'no-changes':
    'Nothing to apply. Pass --description, --homepage, or --topics with the answered value.',
  'empty-topics':
    '--topics carried no usable topic, and this command never reads that as a request to remove every topic the remote carries. Pass the full desired set, or omit the flag to leave topics untouched.',
}

interface ProposeOptions {
  readonly root?: string
  readonly json?: boolean
}

interface ApplyOptions {
  readonly description?: string
  readonly homepage?: string
  readonly topics?: string
  readonly root?: string
  readonly json?: boolean
}

type CurrentRead =
  | { readonly kind: 'read'; readonly current: CurrentMetadata }
  | { readonly kind: 'refused'; readonly reason: SourceRefusal }

/** Reads what the remote already carries. The one network call this domain makes to read. */
async function readCurrent(cwd: string): Promise<CurrentRead> {
  if (Bun.which('gh') === null) return { kind: 'refused', reason: 'gh-missing' }

  try {
    const result = await execa(
      'gh',
      ['repo', 'view', '--json', 'description,homepageUrl,repositoryTopics'],
      { cwd, timeout: GH_TIMEOUT_MS, env: gitEnv(), extendEnv: false },
    )
    const row = JSON.parse(result.stdout) as {
      description?: string
      homepageUrl?: string
      repositoryTopics?: readonly { name: string }[]
    }
    return {
      kind: 'read',
      current: {
        description: row.description ?? '',
        homepage: row.homepageUrl ?? '',
        topics: (row.repositoryTopics ?? []).map((topic) => topic.name),
      },
    }
  } catch {
    return { kind: 'refused', reason: 'gh-failed' }
  }
}

export function register(program: Command): void {
  const repo = program
    .command('repo')
    .description('Read and write this repository’s own remote metadata')
    .helpOption('-h, --help', 'Show this help message')

  const metadata = repo
    .command('metadata')
    .description('The About description, homepage, and topics GitHub shows')
    .helpOption('-h, --help', 'Show this help message')

  metadata
    .command('propose')
    .description(
      'Compare a locally computed description, homepage, and topic set against the remote',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option('--root <path>', 'Repository to read, defaulting to the cwd')
    .option('--json', 'Add a machine-readable record on stdout')
    .addHelpText(
      'after',
      [
        '',
        "Computes from the tree alone: a description from the README's opening",
        'line past its title and badges, and a homepage and topics from',
        "package.json's own homepage and keywords fields. A field neither file",
        'declares is never diffed, so an undeclared topic set never reads as a',
        'proposal to clear what the remote already carries.',
        '',
        'This is the read half. It never writes. Run `canon repo metadata apply`',
        'with the answered fields once a proposal is worth taking.',
        '',
        'Exit codes:',
        '  0  the remote already carries what this run computed',
        '  1  refused, with the reason on stderr or in the JSON record',
        '  2  a difference was found',
        '',
        'Examples:',
        '  canon repo metadata propose',
        '  canon repo metadata propose --json',
        '',
      ].join('\n'),
    )
    .action(async (opts: ProposeOptions) => {
      process.exitCode = await runPropose(opts)
    })

  metadata
    .command('apply')
    .description(
      'Write an explicitly supplied description, homepage, or topic set to the remote',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option('--description <text>', 'About text to write')
    .option('--homepage <url>', 'Homepage URL to write')
    .option(
      '--topics <list>',
      'Comma-separated topic set to write, replacing what the remote carries',
    )
    .option('--root <path>', 'Repository to read, defaulting to the cwd')
    .option('--json', 'Add a machine-readable record on stdout')
    .addHelpText(
      'after',
      [
        '',
        'Takes the answered value for each field directly rather than',
        're-running propose, so a change this writes is always one a person or',
        'a second invocation already read and confirmed. --topics is the full',
        'desired set; gh only takes an add and a remove list, so this reads the',
        'current set once to compute both.',
        '',
        'Exit codes:',
        '  0  the write succeeded, or the remote already matched',
        '  1  refused, with the reason on stderr or in the JSON record',
        '',
        'Examples:',
        '  canon repo metadata apply --description "One source for conventions."',
        '  canon repo metadata apply --topics cli-tool,governance,standards',
        '',
      ].join('\n'),
    )
    .action(async (opts: ApplyOptions) => {
      process.exitCode = await runApply(opts)
    })
}

function refuse(reason: ApplyRefusal, emitJson: boolean, root: string): number {
  logStep('Refused')
  logWarn(REFUSALS[reason])
  outro()

  if (emitJson) {
    process.stdout.write(
      `${JSON.stringify({ root, reason, message: REFUSALS[reason] })}\n`,
    )
  }
  return 1
}

async function runPropose(opts: ProposeOptions): Promise<number> {
  const root = resolve(opts.root ?? process.cwd())
  const emitJson = opts.json ?? false

  intro('canon repo metadata propose')

  const [proposal, currentRead] = await Promise.all([
    proposeMetadata(root),
    readCurrent(root),
  ])

  if (currentRead.kind === 'refused') {
    return refuse(currentRead.reason, emitJson, root)
  }

  const diff: MetadataDiff = compareMetadata(currentRead.current, proposal)
  const changed = Object.keys(diff).length > 0

  logStep('Computed')
  if (
    proposal.description === undefined &&
    proposal.homepage === undefined &&
    proposal.topics === undefined
  ) {
    logInfo('nothing local resolved a description, a homepage, or topics')
  } else {
    if (proposal.description !== undefined) {
      logInfo(`description: ${proposal.description}`)
    }
    if (proposal.homepage !== undefined)
      logInfo(`homepage: ${proposal.homepage}`)
    if (proposal.topics !== undefined) {
      logInfo(`topics: ${proposal.topics.join(', ')}`)
    }
  }

  logStep(changed ? 'Difference' : 'No difference')
  if (!changed) {
    logInfo('the remote already carries what this run computed')
  } else {
    if (diff.description !== undefined) {
      logWarn(
        `description: "${diff.description.current}" → "${diff.description.proposed}"`,
      )
    }
    if (diff.homepage !== undefined) {
      logWarn(
        `homepage: "${diff.homepage.current}" → "${diff.homepage.proposed}"`,
      )
    }
    if (diff.topics !== undefined) {
      for (const topic of diff.topics.added) logAdd(`topic: ${topic}`)
      for (const topic of diff.topics.removed) logRemove(`topic: ${topic}`)
    }
    logInfo(
      'Run `canon repo metadata apply` with the answered fields. This run writes nothing.',
    )
  }

  outro()

  if (emitJson) {
    process.stdout.write(
      `${JSON.stringify({
        root,
        current: currentRead.current,
        proposal,
        diff,
      })}\n`,
    )
  }

  return changed ? 2 : 0
}

async function runApply(opts: ApplyOptions): Promise<number> {
  const root = resolve(opts.root ?? process.cwd())
  const emitJson = opts.json ?? false

  intro('canon repo metadata apply')

  if (
    opts.description === undefined &&
    opts.homepage === undefined &&
    opts.topics === undefined
  ) {
    return refuse('no-changes', emitJson, root)
  }

  const args = ['repo', 'edit']
  if (opts.description !== undefined)
    args.push('--description', opts.description)
  if (opts.homepage !== undefined) args.push('--homepage', opts.homepage)

  if (opts.topics !== undefined) {
    const desired = new Set(
      opts.topics
        .split(',')
        .map((topic) => topic.trim().toLowerCase())
        .filter((topic) => topic !== ''),
    )
    if (desired.size === 0) return refuse('empty-topics', emitJson, root)

    const currentRead = await readCurrent(root)
    if (currentRead.kind === 'refused')
      return refuse(currentRead.reason, emitJson, root)

    const currentSet = new Set(currentRead.current.topics)
    const toAdd = [...desired].filter((topic) => !currentSet.has(topic))
    const toRemove = currentRead.current.topics.filter(
      (topic) => !desired.has(topic),
    )

    if (toAdd.length > 0) args.push('--add-topic', toAdd.join(','))
    if (toRemove.length > 0) args.push('--remove-topic', toRemove.join(','))
  }

  if (args.length === 2) {
    logStep('Applied')
    logInfo('the remote already matches every field supplied. Nothing written.')
    outro()

    if (emitJson) {
      process.stdout.write(`${JSON.stringify({ root, written: false })}\n`)
    }
    return 0
  }

  if (Bun.which('gh') === null) return refuse('gh-missing', emitJson, root)

  try {
    await execa('gh', args, {
      cwd: root,
      timeout: GH_TIMEOUT_MS,
      env: gitEnv(),
      extendEnv: false,
    })
  } catch {
    return refuse('gh-failed', emitJson, root)
  }

  logStep('Applied')
  logInfo('gh repo edit wrote the supplied fields to the remote.')
  outro()

  if (emitJson) {
    process.stdout.write(`${JSON.stringify({ root, written: true })}\n`)
  }

  return 0
}
