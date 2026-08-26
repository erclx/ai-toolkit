import { type InitFlags, resolveStack, snippetsSkipReason } from '@/init/plan'
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
      run: child(['tooling', 'sync', 'base', resolved, '--write']),
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

  // `snippets === undefined` here can never fire on its own: `snippetsSkipReason`
  // already returns a reason whenever `flags.snippets` is undefined. It is what
  // narrows `snippets` to `string` for the child() call below, since TypeScript
  // cannot narrow a property through a function call.
  const snippets = flags.snippets
  const skipReason = snippetsSkipReason(flags)
  if (skipReason !== undefined || snippets === undefined) {
    steps.push({
      kind: 'skip',
      label: 'Snippets',
      notice: `Skipped: ${skipReason ?? 'no --snippets given'}. Run 'aitk snippets install essentials ${target}' to install snippets.`,
    })
  } else {
    steps.push({
      kind: 'run',
      label: 'Snippets',
      run: child(['snippets', 'install', snippets, resolved]),
    })
  }

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
