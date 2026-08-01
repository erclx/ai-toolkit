import { type InitFlags, resolveStack } from '@/init/plan'
import type { DomainStep } from '@/init/run'

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
    steps.push({
      kind: 'skip',
      label: 'Governance',
      notice: `Skipped: --skip governance. Run 'aitk gov install ${stack} ${target}' to install rules.`,
    })
  } else {
    const args = ['gov', 'install', stack]
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
