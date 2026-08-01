import { relative } from 'node:path'
import { $ } from 'bun'
import type { Command } from 'commander'
import { type ArchiveOutcome, archiveTask } from '@/tasks/archive'
import {
  intro,
  logAdd,
  logError,
  logInfo,
  logRemove,
  logStep,
  outro,
  pipeOutput,
} from '@/ui'

interface ArchiveCommandOptions {
  readonly json?: boolean
  readonly pullRequest?: string
  readonly root?: string
}

/**
 * The board is shared scratch at the main worktree root, and `git worktree
 * list` puts that root first. A pull inside a linked worktree fires the same
 * hook, so trusting the working directory would write a second board nothing
 * else reads.
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
        '  aitk tasks archive v28.1-trigger-escalation',
        '  aitk tasks archive --pull-request 673 --json',
        '',
      ].join('\n'),
    )
    .action(async (task: string | undefined, opts: ArchiveCommandOptions) => {
      process.exitCode = await runArchive(task, opts)
    })
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
        reason: 'ambiguous',
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
        reason: 'no-match',
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
        reason: 'no-match',
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

  intro('aitk tasks archive')

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
