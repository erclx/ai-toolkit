import { type InitFlags, resolveStack } from '@/init/plan'
import type { DomainStep } from '@/init/run'
import { ALL_SELECTION } from '@/standards/closure'

/** Builds the child-process invocation for one domain. */
export type RunFactory = (args: readonly string[]) => () => Promise<boolean>

/**
 * Orders the domains an init installs. Base tooling seeds the files the later
 * domains install alongside, so the sequence is part of the contract rather
 * than an arbitrary listing.
 *
 * The caller supplies the run factory so the list can be read for its labels
 * and kinds without spawning anything.
 */
export function buildSteps(
  target: string,
  resolved: string,
  flags: InitFlags,
  child: RunFactory,
): DomainStep[] {
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

  const stack = resolveStack(flags.stack)

  if (flags.skip.skipped.has('governance')) {
    const recovery = govArgs(stack, flags.add, target).join(' ')
    steps.push({
      kind: 'skip',
      label: 'Governance',
      notice: `Skipped: --skip governance. Run 'aitk ${recovery}' to install rules.`,
    })
  } else {
    steps.push({
      kind: 'run',
      label: 'Governance',
      run: child(govArgs(stack, flags.add, resolved)),
    })
  }

  if (!flags.skip.skipped.has('standards')) {
    steps.push({
      kind: 'run',
      label: 'Standards',
      run: child(standardsArgs(flags.standards, resolved)),
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

/**
 * Builds the `standards install` argv. `all` is left off rather than spelled
 * out, so the default init runs the same command it ran before the flag
 * existed.
 */
function standardsArgs(selection: string, path: string): string[] {
  const args = ['standards', 'install']
  if (selection !== '' && selection !== ALL_SELECTION) {
    args.push('--only', selection)
  }
  args.push(path)

  return args
}

/**
 * Builds the `gov install` argv. The run and the recovery command a skip prints
 * come from here both, so the command a caller is told to paste installs what
 * the run would have.
 */
function govArgs(
  stack: string,
  add: string | undefined,
  path: string,
): string[] {
  const args = ['gov', 'install', stack]
  if (add !== undefined && add !== '') args.push('--add', add)
  args.push(path)

  return args
}
