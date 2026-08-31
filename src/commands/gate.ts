import type { Command } from 'commander'
import {
  cliRunner,
  collectChangedFiles,
  commandRunner,
  exitCodeFor,
  type GateContext,
  repairBareFlag,
  type StageResult,
  runStages,
  summarize,
} from '@/gate/sequencer'
import { STAGES } from '@/gate/stages'
import { PROJECT_ROOT } from '@/project-root'
import {
  intro,
  logError,
  logInfo,
  logStep,
  logWarn,
  outro,
  palette,
  pipeOutput,
} from '@/ui'

interface RunCommandOptions {
  readonly all?: boolean
  readonly write?: boolean
  readonly nested?: boolean
  readonly json?: boolean
}

export function register(program: Command): void {
  const gate = program
    .command('gate')
    .description('Run the merge gate this repository verifies a branch with')
    .helpOption('-h, --help', 'Show this help message')

  gate
    .command('run')
    .description(
      'Run every gating stage in order, scoping shell, types, and tests to the changed set',
    )
    .helpOption('-h, --help', 'Show this help message')
    .option(
      '--all',
      'Run every stage instead of scoping shell, types, and tests to changed files',
    )
    .option(
      '--no-write',
      'Check formatting instead of applying it, which is what a merge gate wants',
    )
    .option(
      '--nested',
      'Suppress the outer frame when another script opened one',
    )
    .option('--json', 'Add a machine-readable record on stdout')
    .addHelpText(
      'after',
      [
        '',
        'Exit codes:',
        '  0  no stage found a fact',
        '  1  a stage found a fact',
        '',
        'A stage halts the run, so clearing a regenerate-then-assert stage',
        'reveals the next one behind it rather than the whole set at once.',
        '',
        'Examples:',
        '  aitk gate run',
        '  aitk gate run --all --no-write',
        '  aitk gate run --json',
        '',
      ].join('\n'),
    )
    .action(async (opts: RunCommandOptions) => {
      process.exitCode = await runGate(opts)
    })
}

async function runGate(opts: RunCommandOptions): Promise<number> {
  const root = PROJECT_ROOT
  const emitJson = opts.json ?? false
  const nested = opts.nested ?? false
  const write = opts.write ?? true
  const run = commandRunner(root)

  if (!emitJson && !nested) intro('aitk gate run')

  await repairBareFlag(root)

  const changed = opts.all
    ? { scoped: false, files: [] }
    : await collectChangedFiles(run)
  if (!emitJson && changed.notice !== undefined) logWarn(changed.notice)

  const ctx: GateContext = {
    root,
    ci: process.env.CI === 'true',
    run,
    cli: cliRunner(root),
    write,
    changed: changed.scoped ? changed.files : undefined,
  }

  const results = await runStages(
    STAGES,
    ctx,
    emitJson ? undefined : (result) => report(result),
  )
  const summary = summarize(results)
  const code = exitCodeFor(results)

  if (emitJson) {
    const failed = results.find((result) => result.status === 'failed')
    // Diagnostics reach stderr in every mode, so a caller reading the record
    // alone is not the only one told what went wrong.
    if (failed?.failure !== undefined) {
      process.stderr.write(`${failed.label}: ${failed.failure}\n`)
    }
    process.stdout.write(
      `${JSON.stringify({
        ok: code === 0,
        root,
        scoped: changed.scoped,
        changed: changed.files.length,
        summary,
        stages: results.map(({ id, label, status, failure }) => ({
          id,
          label,
          status,
          failure,
        })),
      })}\n`,
    )
    return code
  }

  if (!nested) close(code)
  return code
}

function report(result: StageResult): void {
  logStep(result.label)
  for (const emission of result.emissions) {
    if (emission.kind === 'info') logInfo(emission.text)
    else if (emission.kind === 'warn') logWarn(emission.text)
    else pipeOutput(emission.text)
  }
  if (result.failure !== undefined) logError(result.failure)
}

/**
 * The closing verdict.
 *
 * The failure line is what the script this replaces never printed: it exited
 * from inside the frame, so a failing run left the frame unclosed and named no
 * verdict at all.
 */
function close(code: number): void {
  const { GREEN, NC, RED } = palette(process.stderr)
  outro()

  if (code !== 0) {
    process.stderr.write(`${RED}✗ Verification failed${NC}\n\n`)
    return
  }

  process.stderr.write(`${GREEN}✓ Verification passed${NC}\n\n`)
}
