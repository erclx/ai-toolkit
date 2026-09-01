import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { $ } from 'bun'
import type { Command } from 'commander'
import { execa } from 'execa'
import { gitEnv } from '@/git-env'
import {
  listChangedFiles,
  listRepositoryFiles,
  resolveBaseRef,
} from '@/git-files'
import {
  type Bijection,
  type BijectionRefusal,
  compareKeyChanges,
  treeRoots,
} from '@/pr/bijection'
import { KEY_CHANGES } from '@/pr/paths'
import { intro, logInfo, logStep, logWarn, outro, plural } from '@/ui'

const GH_TIMEOUT_MS = 30_000

/** How many unnamed files the frame prints before it names a count instead. */
const UNNAMED_PRINT_LIMIT = 10

/**
 * Where `gh pr view --json files` stops.
 *
 * It pages the underlying query once and returns at most this many rows with
 * nothing on the record saying so, which was measured against `#1250`: the
 * pull request carries 101 files and the view reports 100. A set silently one
 * short is the worst input this comparison can take, since the missing file is
 * exactly what a claim would then be accused of inventing.
 */
const GH_VIEW_FILE_CAP = 100

interface KeyChangesOptions {
  readonly body?: string
  readonly base?: string
  readonly root?: string
  readonly json?: boolean
}

/** Why the read produced no comparison, ahead of the ones the compare owns. */
type SourceRefusal =
  | 'gh-missing'
  | 'gh-failed'
  | 'gh-truncated'
  | 'unreadable-body'
  | 'unreadable-tree'
  | 'no-base'
  | 'bad-base'
  | 'unreadable-changes'

type Refusal = SourceRefusal | BijectionRefusal

/** What a reader does about each way this produced no reading. */
const REFUSALS: Record<Refusal, string> = {
  'gh-missing':
    'gh is not on the path, so no pull request body could be read. Pass --body <path> to read one off disk instead.',
  'gh-failed':
    'gh could not answer for this branch. Name the pull request number, or pass --body <path>.',
  'gh-truncated': `gh returned the first ${GH_VIEW_FILE_CAP} changed files and the paginated read that would complete the set failed, so a claim could be accused of naming a file this read never saw.`,
  'unreadable-body': 'The file named by --body could not be read.',
  'unreadable-tree':
    'git could not list this repository, so no path could be judged whole rather than partial.',
  'no-base': 'No base resolves against the trunk. Fetch origin or pass --base.',
  'bad-base':
    'The ref passed to --base resolves to no commit here. Pass one this tree carries.',
  'unreadable-changes':
    'git could not list what this branch changed, so the set is unknown.',
  'no-section': `This body carries no ## ${KEY_CHANGES} section, so it claims nothing to compare.`,
  'no-claims': `The ## ${KEY_CHANGES} section carried no path this reader could resolve. That is the extractor failing over prose rather than the body being wrong, so nothing is raised.`,
  'no-changes':
    'The pull request changed no files, so there is nothing for a claim to answer.',
}

export function register(program: Command): void {
  const pr = program
    .command('pr')
    .description('Read a pull request body against the change it describes')
    .helpOption('-h, --help', 'Show this help message')

  pr.command('key-changes')
    .description(
      `Compare the files a body's ## ${KEY_CHANGES} names against its own diff`,
    )
    .argument('[number]', 'Pull request to read, defaulting to this branch')
    .helpOption('-h, --help', 'Show this help message')
    .option(
      '--body <path>',
      'Read the body from a file rather than the API, ignoring any number',
    )
    .option(
      '--base <ref>',
      'Far side of the range when --body supplies the body',
    )
    .option('--root <path>', 'Repository to read, defaulting to the cwd')
    .option('--json', 'Add a machine-readable record on stdout')
    .addHelpText(
      'after',
      [
        '',
        'This repository squash-merges, so a pull request body becomes the commit',
        'message and the record on the trunk once the branch is gone. A bullet',
        'claiming a change nobody made corrupts that record, and a changed file no',
        'bullet names leaves it incomplete.',
        '',
        'The two directions carry different weight:',
        '  unmet      a whole path the body claims and the diff does not carry,',
        '             which is the graded direction',
        '  unnamed    a changed file no bullet reached, reported without a grade,',
        '             since a lockfile or a generated asset earns no bullet',
        '  unresolved a path written partially, which can credit a changed file',
        '             and never accuse one',
        '',
        `Only ## ${KEY_CHANGES} is read. ## Technical Context legitimately names`,
        'files a branch never touched, so widening the read manufactures findings.',
        '',
        'One class survives the reader: a bullet citing where something is defined',
        'while claiming an edit elsewhere puts a real path in the claim region and',
        'points the change at a locative the path does not name. Read the bullet on',
        "the record's preview before filing an unmet path as a stale claim.",
        '',
        'Exit codes:',
        '  0  every claimed path is in the diff',
        '  1  refused, with the reason on stderr or in the JSON record',
        '  2  at least one claimed path is absent from the diff',
        '',
        'Examples:',
        '  canon pr key-changes',
        '  canon pr key-changes 1265 --json',
        '  canon pr key-changes --body .canon/tmp/body.md --base origin/main',
        '',
      ].join('\n'),
    )
    .action(async (number: string | undefined, opts: KeyChangesOptions) => {
      process.exitCode = await runKeyChanges(number, opts)
    })
}

interface PullRequestRead {
  readonly body: string
  readonly changed: readonly string[]
  readonly head: string | undefined
  readonly number: number | undefined
}

type SourceRead =
  | { readonly kind: 'read'; readonly source: PullRequestRead }
  | { readonly kind: 'refused'; readonly reason: SourceRefusal }

/**
 * Reads the body and the changed set from the pull request the caller named,
 * or from the one open on this branch.
 *
 * One call wherever the file list fits inside it. The body and the file list
 * have to describe the same head, and reading them separately leaves a window
 * where a push between them compares a body against another commit's files. A
 * pull request at the view's cap takes the second read anyway, because a set
 * short by an unknown number is worse than a set read a moment later.
 */
async function readFromApi(
  cwd: string,
  number: string | undefined,
): Promise<SourceRead> {
  if (Bun.which('gh') === null) {
    return { kind: 'refused', reason: 'gh-missing' }
  }

  const args = ['pr', 'view']
  if (number !== undefined) args.push(number)
  args.push('--json', 'body,files,headRefOid,number')

  try {
    // See src/worktrees/reclaim.ts for why gh needs the stripped environment:
    // it resolves its repository through the same variables git does and they
    // beat `cwd`, so a run from inside a hook would answer for another
    // repository and compare this branch's claims against its files.
    const result = await execa('gh', args, {
      cwd,
      timeout: GH_TIMEOUT_MS,
      env: gitEnv(),
      extendEnv: false,
    })

    const row = JSON.parse(result.stdout) as {
      body?: string
      files?: readonly { path: string }[]
      headRefOid?: string
      number?: number
    }

    const viewed = (row.files ?? []).map((file) => file.path)
    const changed =
      viewed.length < GH_VIEW_FILE_CAP || row.number === undefined
        ? viewed
        : await listFilesByPage(cwd, row.number)

    if (changed === undefined) {
      return { kind: 'refused', reason: 'gh-truncated' }
    }

    return {
      kind: 'read',
      source: {
        body: row.body ?? '',
        changed: [...changed].sort(),
        head: row.headRefOid,
        number: row.number,
      },
    }
  } catch {
    return { kind: 'refused', reason: 'gh-failed' }
  }
}

/**
 * Every file a pull request changed, read through the paginated endpoint.
 *
 * Only reached when the view came back at the cap, since it costs a request per
 * page and nearly every pull request here fits in one view. Returns undefined
 * when the follow-up fails, which refuses rather than falling back to the
 * capped set: a comparison run against a set known to be short would accuse a
 * correct bullet of naming a file nobody changed.
 */
async function listFilesByPage(
  cwd: string,
  number: number,
): Promise<string[] | undefined> {
  try {
    // See src/worktrees/reclaim.ts for why gh needs the stripped environment.
    const result = await execa(
      'gh',
      [
        'api',
        '--paginate',
        `repos/{owner}/{repo}/pulls/${number}/files`,
        '--jq',
        '.[].filename',
      ],
      { cwd, timeout: GH_TIMEOUT_MS, env: gitEnv(), extendEnv: false },
    )
    return result.stdout.split('\n').filter(Boolean)
  } catch {
    return undefined
  }
}

/**
 * Reads the body off disk and the changed set from git, which is the shape a
 * fixture and a body still being drafted both need.
 */
async function readFromFile(
  root: string,
  path: string,
  base: string | undefined,
): Promise<SourceRead> {
  let body: string
  try {
    body = await readFile(resolve(root, path), 'utf8')
  } catch {
    return { kind: 'refused', reason: 'unreadable-body' }
  }

  const resolved = await resolveBaseRef(root, base)
  if (resolved === undefined) {
    return {
      kind: 'refused',
      reason: base === undefined ? 'no-base' : 'bad-base',
    }
  }

  const changed = await listChangedFiles(root, resolved)
  if (changed === undefined) {
    return { kind: 'refused', reason: 'unreadable-changes' }
  }

  const head = await $`git -C ${root} rev-parse HEAD`
    .env(gitEnv())
    .quiet()
    .nothrow()

  return {
    kind: 'read',
    source: {
      body,
      changed,
      head: head.exitCode === 0 ? head.text().trim() : undefined,
      number: undefined,
    },
  }
}

async function runKeyChanges(
  number: string | undefined,
  opts: KeyChangesOptions,
): Promise<number> {
  const root = resolve(opts.root ?? process.cwd())
  const emitJson = opts.json ?? false

  intro('canon pr key-changes')

  const source =
    opts.body === undefined
      ? await readFromApi(root, number)
      : await readFromFile(root, opts.body, opts.base)

  if (source.kind === 'refused') return refuse(source.reason, emitJson, root)

  const tracked = await listRepositoryFiles(root)
  if (tracked === undefined) return refuse('unreadable-tree', emitJson, root)

  const report: Bijection = compareKeyChanges({
    body: source.source.body,
    changed: source.source.changed,
    roots: treeRoots(tracked, source.source.changed),
    ...(source.source.head !== undefined && { head: source.source.head }),
  })

  if (report.kind === 'refused') return refuse(report.reason, emitJson, root)

  logStep('Scope')
  logInfo(
    `${plural(report.claims.length, 'claim')} against ${plural(report.changed.length, 'changed file')}${
      report.head === undefined ? '' : ` at ${report.head.slice(0, 8)}`
    }`,
  )

  logStep(report.unmet.length === 0 ? 'Claimed' : 'Unmet')
  if (report.unmet.length === 0) {
    logInfo('every claimed path is in the diff')
  } else {
    logWarn(
      `${plural(report.unmet.length, 'claimed path')} the diff does not carry. Correct the bullet, or make the change it describes.`,
    )
    for (const claim of report.unmet) {
      logWarn(`${claim.path} — ${claim.preview}`)
    }
  }

  // Named rather than counted into the verdict. A generated asset, a lockfile,
  // and a regenerated index all change without earning a bullet, so grading
  // this direction would fire on nearly every branch.
  logStep('Unnamed')
  if (report.unnamed.length === 0) {
    logInfo('every changed file is reached by a bullet')
  } else {
    logInfo(
      `${plural(report.unnamed.length, 'changed file')} no bullet reached. Add one where the change is worth a reader knowing about.`,
    )
    // Capped in the frame and whole in the record. A rename branch measured
    // here left 71 of its 100 files unnamed, correctly, and printing all of
    // them buries the graded direction above under a list nobody reads.
    for (const path of report.unnamed.slice(0, UNNAMED_PRINT_LIMIT)) {
      logInfo(path)
    }
    if (report.unnamed.length > UNNAMED_PRINT_LIMIT) {
      logInfo(
        `…and ${report.unnamed.length - UNNAMED_PRINT_LIMIT} more, whole in the --json record.`,
      )
    }
  }

  if (report.unresolved.length > 0) {
    logStep('Unresolved')
    logInfo(
      `${plural(report.unresolved.length, 'path')} written partially, so neither direction judged it.`,
    )
    for (const claim of report.unresolved) logInfo(claim.path)
  }

  outro()

  if (emitJson) {
    process.stdout.write(
      `${JSON.stringify({
        root,
        ...(source.source.number !== undefined && {
          number: source.source.number,
        }),
        ...(report.head !== undefined && { head: report.head }),
        changed: report.changed,
        claims: report.claims,
        unmet: report.unmet,
        unnamed: report.unnamed,
        unresolved: report.unresolved,
      })}\n`,
    )
  }

  return report.unmet.length === 0 ? 0 : 2
}

/**
 * Frames a refusal on stderr in both modes and puts the record on stdout alone,
 * so an operator reading the terminal sees the reason rather than a command
 * that appeared to do nothing.
 */
function refuse(reason: Refusal, emitJson: boolean, root: string): number {
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
