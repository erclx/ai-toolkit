import type { Command } from 'commander'
import { cliPath, cliRun } from '@/cli-run'
import { PROJECT_ROOT } from '@/exec'
import { type InitFlags, parseSkip, planInit } from '@/init/plan'
import { type DomainStep, runDomains } from '@/init/run'
import { resolveTarget } from '@/target'
import { intro, logInfo, logStep, logWarn, outro, select } from '@/ui'

const GREEN = '\x1b[0;32m'
const YELLOW = '\x1b[0;33m'
const NC = '\x1b[0m'

const FLAG_KEYS: readonly string[] = ['stack', 'add', 'snippets', 'skip']

interface InitOptions {
  readonly stack?: string
  readonly add?: string
  readonly snippets: string
  readonly skip?: string
}

export function register(program: Command): void {
  program
    .command('init')
    .description('Bootstrap a project with base tooling and toolkit domains')
    .argument('[target]', 'Target directory', '.')
    .option('--stack <name>', 'Governance stack (e.g., base, astro, react)')
    .option('--add <rules>', 'Comma-separated governance rules to layer on')
    .option(
      '--snippets <category>',
      "Snippets preset, category, or 'all'",
      'essentials',
    )
    .option('--skip <list>', 'Skip core domains: wiki, standards')
    .helpOption('-h, --help', 'Show this help message')
    .addHelpText(
      'after',
      [
        '',
        'Passing any option skips the confirmation prompt.',
        '',
        'Examples:',
        '  aitk init',
        '  aitk init ../my-app',
        '  aitk init --stack astro --add 260-shadcn ../my-app',
        '',
      ].join('\n'),
    )
    .action(async (target: string, options: InitOptions, cmd: Command) => {
      process.exitCode = await runInit(target, options, flagsProvided(cmd))
    })
}

/**
 * Whether the operator passed any flag, which is what makes the command
 * scriptable by suppressing the confirmation prompt. `--snippets` carries a
 * default, so presence has to be read from where the value came from rather
 * than from the value itself.
 */
function flagsProvided(cmd: Command): boolean {
  return FLAG_KEYS.some((key) => cmd.getOptionValueSource(key) === 'cli')
}

async function runInit(
  target: string,
  options: InitOptions,
  skipPrompt: boolean,
): Promise<number> {
  intro('aitk init')

  const resolved = resolveTarget(target, PROJECT_ROOT)
  if (typeof resolved === 'number') return resolved

  const skip = parseSkip(options.skip)
  for (const value of skip.unknown) {
    logWarn(`Unknown --skip value: ${value} (ignoring)`)
  }

  const flags: InitFlags = {
    stack: options.stack,
    add: options.add,
    snippets: options.snippets,
    skip,
  }

  const plan = planInit(flags)

  logStep('Core domains')
  for (const line of plan.preview) {
    if (line.level === 'info') logInfo(line.text)
    else logWarn(line.text)
  }

  if (!skipPrompt) {
    const shouldInstall = await select({
      message: `Install ${plan.total} domains to ${target}?`,
      options: [
        { value: true, label: 'Yes' },
        { value: false, label: 'Cancel' },
      ],
      nonInteractiveDefault: true,
    })

    if (!shouldInstall) {
      logWarn('Cancelled')
      outro()
      return 0
    }
  }

  const failed = await runDomains(buildSteps(target, resolved, flags))

  outro()
  process.stderr.write('\n')

  if (failed.length === 0) {
    process.stderr.write(
      `${GREEN}✓ Project initialized (${plan.total} domains)${NC}\n`,
    )
    return 0
  }

  process.stderr.write(
    `${YELLOW}! Project initialized with ${failed.length} failure(s): ${failed.join(', ')}${NC}\n`,
  )
  return 1
}

function buildSteps(
  target: string,
  resolved: string,
  flags: InitFlags,
): DomainStep[] {
  const path = cliPath(PROJECT_ROOT)
  const child = (args: readonly string[]): (() => Promise<boolean>) =>
    cliRun(path, args, { nonInteractive: true, stdin: 'ignore' })

  const steps: DomainStep[] = [
    {
      kind: 'run',
      label: 'Base tooling',
      run: child(['tooling', 'sync', 'base', resolved]),
    },
    {
      kind: 'run',
      label: 'Claude workflow',
      run: child(['claude', 'init', resolved]),
    },
  ]

  if (flags.stack === undefined || flags.stack === '') {
    steps.push({
      kind: 'skip',
      label: 'Governance',
      notice: `Skipped: no --stack provided. Run 'aitk gov install <stack> ${target}' to install rules.`,
    })
  } else {
    const args = ['gov', 'install', flags.stack]
    if (flags.add !== undefined && flags.add !== '')
      args.push('--add', flags.add)
    args.push(resolved)

    steps.push({ kind: 'run', label: 'Governance', run: child(args) })
  }

  if (!flags.skip.skipped.has('standards')) {
    steps.push({
      kind: 'run',
      label: 'Standards',
      run: child(['standards', 'install', resolved]),
    })
  }

  steps.push({
    kind: 'run',
    label: 'Snippets',
    run: child(['snippets', 'install', flags.snippets, resolved]),
  })

  if (!flags.skip.skipped.has('wiki')) {
    steps.push({
      kind: 'run',
      label: 'Wiki',
      run: child(['wiki', 'init', resolved]),
    })
  }

  return steps
}
