import { relative } from 'node:path'
import type { Command } from 'commander'
import { type AnswersOutcome, planAnswers } from '@/tasks/answers'
import {
  type ArchiveOutcome,
  archiveTask,
  type CitationOutcome,
  type PlanCitations,
  planCitations,
} from '@/tasks/archive'
import {
  type CloseOutcome,
  closeOutcomes,
  type PullRequestOutcome,
  type RecordRefused,
  type RecordSelector,
  recordPullRequest,
} from '@/tasks/record'
import {
  type Finding,
  type FolderClaim,
  type Untested,
  type ValidateOutcome,
  validateBoard,
} from '@/tasks/validate'
import {
  intro,
  logAdd,
  logError,
  logInfo,
  logRemove,
  logStep,
  logWarn,
  outro,
  pipeOutput,
} from '@/ui'
import { mainWorktreeRoot } from '@/worktree'

/** Returned when the board carries a finding, which is the gating result. */
const EXIT_FINDINGS = 2

interface ArchiveCommandOptions {
  readonly json?: boolean
  readonly pullRequest?: string
  readonly root?: string
}

interface ValidateCommandOptions {
  readonly json?: boolean
  readonly root?: string
}

interface CitationsCommandOptions {
  readonly json?: boolean
  readonly root?: string
}

interface AnswersCommandOptions {
  readonly json?: boolean
  readonly root?: string
}

interface PullRequestCommandOptions {
  readonly json?: boolean
  readonly plan?: string
  readonly root?: string
}

interface OutcomeCommandOptions {
  readonly close?: readonly string[]
  readonly json?: boolean
  readonly plan?: string
  readonly root?: string
}

export function register(program: Command): void {
  const tasks = program
    .command('tasks')
    .description('Manage the task board in .claude/tasks/')
    .helpOption('-h, --help', 'Show this help message')

  tasks
    .command('archive')
    .description('Move a shipped task out of the board and clear its ordering')
    .argument('[task]', 'Task filename stem, as in v28.1-trigger-escalation')
    .helpOption('-h, --help', 'Show this help message')
    .option(
      '--pull-request <number>',
      'Select the task naming this pull request',
    )
    .option('--json', 'Emit a machine-readable record on stdout')
    .option('--root <path>', 'Board root, defaulting to the main worktree')
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  the task was archived',
        '  1  refused, with the reason on stderr or in the JSON record',
        '',
        'Examples:',
        '  canon tasks archive v28.1-trigger-escalation',
        '  canon tasks archive --pull-request 673 --json',
        '',
      ].join('\n'),
    )
    .action(async (task: string | undefined, opts: ArchiveCommandOptions) => {
      process.exitCode = await runArchive(task, opts)
    })

  tasks
    .command('validate')
    .description(
      'Report what each board row claims against what the tree holds',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Add a machine-readable record on stdout')
    .option('--root <path>', 'Board root, defaulting to the main worktree')
    .addHelpText(
      'after',
      [
        '',
        'Checks:',
        '  every Run now row points at a plan file that resolves',
        '  every task file carries a board row or a backlog line, never both',
        '  no task carries more than one row',
        '  no two Run now rows touch the same file',
        '',
        'Exit codes:',
        '  0  every check passed',
        '  1  refused, with the reason on stderr or in the JSON record',
        '  2  the board carries at least one finding',
        '',
        'It reports and never writes. A row is a claim about readiness, so a',
        'session fixes the row the report names.',
        '',
        'Examples:',
        '  canon tasks validate',
        '  canon tasks validate --json',
        '',
      ].join('\n'),
    )
    .action(async (opts: ValidateCommandOptions) => {
      process.exitCode = await runValidate(opts)
    })

  tasks
    .command('plan-citations')
    .description('Report where a task plan sits and which live tasks hold it')
    .argument('<task>', 'Task filename stem, as in v28.1-trigger-escalation')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Emit a machine-readable record on stdout')
    .option('--root <path>', 'Board root, defaulting to the main worktree')
    .addHelpText(
      'after',
      [
        '',
        'Locations:',
        '  unstated  the task carries no Plan: line',
        '  live      the target resolves inside .claude/plans/',
        '  archived  the target resolves inside .claude/plans/archive/',
        '  outside   the target resolves somewhere else',
        '',
        'Exit codes:',
        '  0  the citations were read',
        '  1  refused, with the reason on stderr or in the JSON record',
        '',
        'It reports and never writes. A live plan whose citedBy list is empty',
        'is the sweep to run, and one a sibling still holds is left alone.',
        'The archive gate reads the same answer, so neither can drift.',
        '',
        'Examples:',
        '  canon tasks plan-citations v28.1-trigger-escalation',
        '  canon tasks plan-citations v28.1-trigger-escalation --json',
        '',
      ].join('\n'),
    )
    .action(async (task: string, opts: CitationsCommandOptions) => {
      process.exitCode = await runCitations(task, opts)
    })

  tasks
    .command('plan-answers')
    .description('Report whether a plan still waits on the operator to answer')
    .argument('<plan>', 'Plan path or its slug, as in dispatch-answer-gate')
    .helpOption('-h, --help', 'Show this help message')
    .option('--json', 'Emit a machine-readable record on stdout')
    .option('--root <path>', 'Board root, defaulting to the main worktree')
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  the plan is launchable',
        '  1  refused, with the reason on stderr or in the JSON record',
        '  2  the plan waits on the operator, and open names every slot',
        '',
        'A blank Answer accepts the Suggested line above it, so only',
        '`- Suggested: needs your call, <why>` over an empty slot is a stop.',
        'It reports and never writes. Branch on launchable rather than on the',
        'exit code, which a shell function wrapping canon can flatten to zero.',
        '',
        'A relative path resolves against the project root first and against',
        '.claude/tasks/ second, so the ../plans/ link a board row writes works.',
        '',
        'Examples:',
        '  canon tasks plan-answers dispatch-answer-gate',
        '  canon tasks plan-answers .claude/plans/feature-dispatch-answer-gate.md',
        '  canon tasks plan-answers ../plans/feature-dispatch-answer-gate.md',
        '  canon tasks plan-answers dispatch-answer-gate --json',
        '',
      ].join('\n'),
    )
    .action(async (plan: string, opts: AnswersCommandOptions) => {
      process.exitCode = await runAnswers(plan, opts)
    })

  tasks
    .command('pull-request')
    .description('Record a pull request number on the task a branch closes')
    .argument('<number>', 'Pull request number, without the #')
    .argument('[task]', 'Task filename stem, as in v28.1-trigger-escalation')
    .helpOption('-h, --help', 'Show this help message')
    .option('--plan <slug>', 'Select the task whose Plan line names this plan')
    .option('--json', 'Emit a machine-readable record on stdout')
    .option('--root <path>', 'Board root, defaulting to the main worktree')
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  the line was added, corrected, or already correct',
        '  1  refused, with the reason on stderr or in the JSON record',
        '',
        'It adds Pull request: #NNN under the origin lines the task carries,',
        'and corrects the number in place when the line exists. The board is',
        'shared scratch, so a linked worktree records against the same board.',
        '',
        'Examples:',
        '  canon tasks pull-request 673 v28.1-trigger-escalation',
        '  canon tasks pull-request 673 --plan worktree-scratch-routing --json',
        '',
      ].join('\n'),
    )
    .action(
      async (
        number: string,
        task: string | undefined,
        opts: PullRequestCommandOptions,
      ) => {
        process.exitCode = await runPullRequest(number, task, opts)
      },
    )

  tasks
    .command('outcome')
    .description('Mark outcomes closed on a task by their position')
    .argument('[task]', 'Task filename stem, as in v28.1-trigger-escalation')
    .helpOption('-h, --help', 'Show this help message')
    .option(
      '--close <position>',
      'Outcome to mark [x], 1-based, repeatable',
      collectPosition,
      [] as string[],
    )
    .option('--plan <slug>', 'Select the task whose Plan line names this plan')
    .option('--json', 'Emit a machine-readable record on stdout')
    .option('--root <path>', 'Board root, defaulting to the main worktree')
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  every named outcome is closed',
        '  1  refused, with the reason on stderr or in the JSON record',
        '',
        'Positions count every outcome checkbox in file order, starting at 1.',
        'An outcome already closed is reported rather than refused, so a rerun',
        'against the same positions is safe.',
        '',
        'Examples:',
        '  canon tasks outcome v28.1-trigger-escalation --close 1 --close 3',
        '  canon tasks outcome --plan worktree-scratch-routing --close 2 --json',
        '',
      ].join('\n'),
    )
    .action(async (task: string | undefined, opts: OutcomeCommandOptions) => {
      process.exitCode = await runOutcome(task, opts)
    })
}

function collectPosition(value: string, previous: string[]): string[] {
  return [...previous, value]
}

/**
 * Both record verbs name a task the same two ways, and naming it neither way or
 * both ways is the same refusal in each. Both are `bad-input` rather than
 * `ambiguous` or `no-match`, since those two describe the board and these
 * describe the command line that reached it.
 */
function selectorFor(
  task: string | undefined,
  plan: string | undefined,
): RecordSelector | RecordRefused {
  if (task && plan) {
    return {
      ok: false,
      reason: 'bad-input',
      message: 'Name a task or a plan, not both.',
      detail: [],
    }
  }

  if (task) return { kind: 'stem', stem: task }
  if (plan) return { kind: 'plan', plan }

  return {
    ok: false,
    reason: 'bad-input',
    message: 'No task named. Pass a filename stem or --plan <slug>.',
    detail: [],
  }
}

async function runPullRequest(
  number: string,
  task: string | undefined,
  opts: PullRequestCommandOptions,
): Promise<number> {
  const emitJson = opts.json ?? false
  const selector = selectorFor(task, opts.plan)

  if ('ok' in selector) {
    return reportRecord(
      'canon tasks pull-request',
      selector,
      emitJson,
      process.cwd(),
    )
  }

  if (!/^\d+$/.test(number)) {
    return reportRecord(
      'canon tasks pull-request',
      {
        ok: false,
        reason: 'bad-input',
        message: `Not a pull request number: ${number}`,
        detail: [],
      },
      emitJson,
      process.cwd(),
    )
  }

  const root = opts.root ?? (await mainWorktreeRoot())
  const outcome = await recordPullRequest(root, selector, Number(number))

  return reportPullRequest(outcome, emitJson, root)
}

async function runOutcome(
  task: string | undefined,
  opts: OutcomeCommandOptions,
): Promise<number> {
  const emitJson = opts.json ?? false
  const selector = selectorFor(task, opts.plan)

  if ('ok' in selector) {
    return reportRecord(
      'canon tasks outcome',
      selector,
      emitJson,
      process.cwd(),
    )
  }

  const raw = opts.close ?? []

  if (raw.length === 0) {
    return reportRecord(
      'canon tasks outcome',
      {
        ok: false,
        reason: 'bad-input',
        message: 'No outcome named. Pass --close <position>.',
        detail: [],
      },
      emitJson,
      process.cwd(),
    )
  }

  const invalid = raw.filter((value) => !/^\d+$/.test(value))

  if (invalid.length > 0) {
    return reportRecord(
      'canon tasks outcome',
      {
        ok: false,
        reason: 'bad-input',
        message: `Not an outcome position: ${invalid.join(', ')}`,
        detail: invalid,
      },
      emitJson,
      process.cwd(),
    )
  }

  const root = opts.root ?? (await mainWorktreeRoot())
  const outcome = await closeOutcomes(root, selector, raw.map(Number))

  return reportOutcome(outcome, emitJson, root)
}

function reportRecord(
  title: string,
  refused: RecordRefused,
  emitJson: boolean,
  root: string,
): number {
  // The framed branch below already reaches stderr through logError, so the
  // bare write is what keeps the JSON mode from reporting the reason on stdout
  // alone.
  if (emitJson) {
    process.stderr.write(`${refused.message}\n`)
    process.stdout.write(
      `${JSON.stringify({
        ok: false,
        root,
        reason: refused.reason,
        message: refused.message,
        detail: refused.detail,
      })}\n`,
    )
    return 1
  }

  intro(title)
  logStep('Refused')
  logError(refused.message)
  if (refused.detail.length > 0) pipeOutput(refused.detail.join('\n'))
  outro()

  return 1
}

function reportPullRequest(
  outcome: PullRequestOutcome,
  emitJson: boolean,
  root: string,
): number {
  if (!outcome.ok) {
    return reportRecord('canon tasks pull-request', outcome, emitJson, root)
  }

  if (emitJson) {
    process.stdout.write(
      `${JSON.stringify({
        ok: true,
        root,
        task: outcome.stem,
        path: relative(root, outcome.path),
        pullRequest: outcome.number,
        action: outcome.action,
      })}\n`,
    )
    return 0
  }

  intro('canon tasks pull-request')
  logStep(outcome.action === 'unchanged' ? 'Already recorded' : 'Recorded')
  logInfo(`${outcome.stem} names pull request #${outcome.number}`)
  if (outcome.action !== 'unchanged') logAdd(relative(root, outcome.path))
  outro()

  return 0
}

function reportOutcome(
  outcome: CloseOutcome,
  emitJson: boolean,
  root: string,
): number {
  if (!outcome.ok) {
    return reportRecord('canon tasks outcome', outcome, emitJson, root)
  }

  if (emitJson) {
    process.stdout.write(
      `${JSON.stringify({
        ok: true,
        root,
        task: outcome.stem,
        path: relative(root, outcome.path),
        closed: outcome.closed,
        alreadyClosed: outcome.alreadyClosed,
      })}\n`,
    )
    return 0
  }

  intro('canon tasks outcome')
  logStep(outcome.closed.length > 0 ? 'Closed' : 'Nothing to close')

  for (const closed of outcome.closed) logAdd(closed)
  for (const already of outcome.alreadyClosed) logInfo(`${already} (already)`)

  if (outcome.closed.length > 0) logInfo(relative(root, outcome.path))
  outro()

  return 0
}

async function runValidate(opts: ValidateCommandOptions): Promise<number> {
  const root = opts.root ?? (await mainWorktreeRoot())
  const outcome = await validateBoard(root)

  return reportValidation(outcome, opts.json ?? false, root)
}

async function runCitations(
  task: string,
  opts: CitationsCommandOptions,
): Promise<number> {
  const root = opts.root ?? (await mainWorktreeRoot())
  const outcome = await planCitations(root, task)

  return reportCitations(outcome, opts.json ?? false, root)
}

function reportCitations(
  outcome: CitationOutcome,
  emitJson: boolean,
  root: string,
): number {
  if (!outcome.ok) {
    if (emitJson) {
      process.stdout.write(
        `${JSON.stringify({ ok: false, reason: outcome.reason, message: outcome.message })}\n`,
      )
      return 1
    }

    intro('canon tasks plan-citations')
    logStep('Refused')
    logError(outcome.message)
    outro()
    return 1
  }

  if (emitJson) {
    process.stdout.write(`${JSON.stringify({ ...outcome, root })}\n`)
    return 0
  }

  intro('canon tasks plan-citations')
  logStep(outcome.stem)
  logInfo(describeCitations(outcome))
  outro()

  return 0
}

function describeCitations(outcome: PlanCitations): string {
  if (outcome.location === 'unstated') return 'carries no Plan: line.'

  if (outcome.location === 'archived') {
    return `points at ${outcome.target}, which an earlier sweep already archived.`
  }

  if (outcome.location === 'outside') {
    return `points at ${outcome.target}, which resolves outside both plans folders.`
  }

  if (outcome.citedBy.length === 0) {
    return `is the last live task citing ${outcome.target}, so the sweep may archive it.`
  }

  return `shares ${outcome.target} with ${outcome.citedBy.join(', ')}, so the sweep leaves it.`
}

async function runAnswers(
  plan: string,
  opts: AnswersCommandOptions,
): Promise<number> {
  const root = opts.root ?? (await mainWorktreeRoot())
  const outcome = await planAnswers(root, plan)

  return reportAnswers(outcome, opts.json ?? false, root)
}

function reportAnswers(
  outcome: AnswersOutcome,
  emitJson: boolean,
  root: string,
): number {
  if (!outcome.ok) {
    if (emitJson) {
      process.stdout.write(
        `${JSON.stringify({ ok: false, reason: outcome.reason, message: outcome.message })}\n`,
      )
      return 1
    }

    intro('canon tasks plan-answers')
    logStep('Refused')
    logError(outcome.message)
    outro()
    return 1
  }

  if (emitJson) {
    process.stdout.write(`${JSON.stringify({ ...outcome, root })}\n`)
    return outcome.launchable ? 0 : EXIT_FINDINGS
  }

  intro('canon tasks plan-answers')
  logStep(outcome.plan)

  if (outcome.launchable) {
    logInfo('waits on nobody, so the dispatch may launch it.')
    outro()
    return 0
  }

  for (const question of outcome.open) {
    logWarn(`${question.label} ${question.why}`)
  }

  const one = outcome.open.length === 1

  logError(
    `${outcome.open.length} question${one ? '' : 's'} ${one ? 'waits' : 'wait'} on you, so the dispatch holds this row.`,
  )
  outro()

  return EXIT_FINDINGS
}

function reportValidation(
  outcome: ValidateOutcome,
  emitJson: boolean,
  root: string,
): number {
  if (!outcome.ok) {
    if (emitJson) {
      process.stdout.write(
        `${JSON.stringify({ ok: false, reason: outcome.reason, message: outcome.message })}\n`,
      )
      return 1
    }

    intro('canon tasks validate')
    logStep('Refused')
    logError(outcome.message)
    outro()
    return 1
  }

  if (!emitJson) {
    intro('canon tasks validate')
    logStep('Board')
    logInfo(
      `${outcome.rows} row(s) across the readiness groups, ${outcome.backlog} backlog line(s), ${outcome.tasks} task file(s)`,
    )

    logStep(outcome.findings.length === 0 ? 'Clean' : 'Findings')
    if (outcome.findings.length === 0) {
      logInfo(
        'every row resolves, every task sits on one surface, and each touches its own files',
      )
    } else {
      for (const finding of outcome.findings) logWarn(describe(finding))
    }

    // The untested rows carry the warn glyph rather than the pass glyph. They
    // move no exit code, and a green tick on a row nothing re-took is the
    // misread this section exists to prevent.
    logStep('Parked rows')
    if (outcome.untested.length === 0) {
      logInfo('every parked row carried a citation or a file set to re-test')
    } else {
      logWarn(
        `${outcome.untested.length} row(s) carry a blocker no check can settle`,
      )
      for (const row of outcome.untested) logWarn(describeUntested(row))
    }

    // A folder claim is often the correct way to say a row rewrites a whole
    // directory, so it reports beside the findings and moves no exit code. A
    // measure that fails on a legitimate cell trains a reader to skip it.
    logStep('Folder claims')
    if (outcome.claims.length === 0) {
      logInfo('every run now row names files rather than folders')
    } else {
      for (const claim of outcome.claims) logWarn(describeClaim(claim))
    }
    outro()
  }

  if (emitJson) {
    process.stdout.write(
      `${JSON.stringify({
        ok: true,
        root,
        rows: outcome.rows,
        backlog: outcome.backlog,
        tasks: outcome.tasks,
        findings: outcome.findings,
        untested: outcome.untested,
        claims: outcome.claims,
      })}\n`,
    )
  }

  return outcome.findings.length > 0 ? EXIT_FINDINGS : 0
}

function describe(finding: Finding): string {
  const scope = finding.group ? `${finding.group}: ` : ''
  return `${scope}${finding.subject} ${finding.message}`
}

function describeUntested(row: Untested): string {
  return `${row.group}: ${row.subject} ${row.message}`
}

function describeClaim(claim: FolderClaim): string {
  return `${claim.group}: ${claim.subject} ${claim.message}`
}

async function runArchive(
  task: string | undefined,
  opts: ArchiveCommandOptions,
): Promise<number> {
  const emitJson = opts.json ?? false

  if (task && opts.pullRequest) {
    return report(
      {
        ok: false,
        reason: 'bad-input',
        message: 'Name a task or a pull request, not both.',
        detail: [],
      },
      emitJson,
      process.cwd(),
    )
  }

  if (!task && !opts.pullRequest) {
    return report(
      {
        ok: false,
        reason: 'bad-input',
        message:
          'No task named. Pass a filename stem or --pull-request <number>.',
        detail: [],
      },
      emitJson,
      process.cwd(),
    )
  }

  const root = opts.root ?? (await mainWorktreeRoot())

  if (opts.pullRequest && !/^\d+$/.test(opts.pullRequest)) {
    return report(
      {
        ok: false,
        reason: 'bad-input',
        message: `Not a pull request number: ${opts.pullRequest}`,
        detail: [],
      },
      emitJson,
      root,
    )
  }

  const outcome = await archiveTask(
    root,
    task
      ? { kind: 'stem', stem: task }
      : { kind: 'pull-request', number: Number(opts.pullRequest) },
  )

  return report(outcome, emitJson, root)
}

function report(
  outcome: ArchiveOutcome,
  emitJson: boolean,
  root: string,
): number {
  if (emitJson) {
    process.stdout.write(`${JSON.stringify(recordFor(outcome, root))}\n`)
    return outcome.ok ? 0 : 1
  }

  intro('canon tasks archive')

  if (!outcome.ok) {
    logStep('Refused')
    logError(outcome.message)
    if (outcome.detail.length > 0) pipeOutput(outcome.detail.join('\n'))
    outro()
    return 1
  }

  logStep('Archived')
  logRemove(relative(root, outcome.from))
  logAdd(relative(root, outcome.to))
  if (outcome.priorityRowRemoved) logInfo('cleared the ordering row')
  if (outcome.indexRegenerated) logInfo('regenerated index.md')
  outro()

  return 0
}

function recordFor(
  outcome: ArchiveOutcome,
  root: string,
): Record<string, unknown> {
  if (!outcome.ok) {
    return {
      ok: false,
      reason: outcome.reason,
      message: outcome.message,
      detail: outcome.detail,
    }
  }

  return {
    ok: true,
    task: outcome.stem,
    from: relative(root, outcome.from),
    to: relative(root, outcome.to),
    priorityRowRemoved: outcome.priorityRowRemoved,
    indexRegenerated: outcome.indexRegenerated,
  }
}
