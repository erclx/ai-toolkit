export type ManagerId = 'bun' | 'pnpm' | 'yarn' | 'npm'

export interface Manager {
  readonly id: ManagerId
  /** The path segment the detection matched, so a wrong read is correctable. */
  readonly evidence: string
}

/**
 * Segments that only appear in one manager's global install tree, checked
 * before the `node_modules` fallback because every one of these trees contains
 * a `node_modules` too.
 */
const SIGNATURES: readonly (readonly [ManagerId, string])[] = [
  ['bun', '.bun'],
  ['pnpm', 'pnpm'],
  ['pnpm', '.pnpm'],
  ['yarn', 'yarn'],
  ['yarn', '.yarn'],
]

/**
 * Which package manager installed the package rooted at `root`, read off the
 * install path rather than guessed from what is on `PATH`.
 *
 * Removing the guess is the whole case for the upgrade verb, so a detection
 * that cannot be read back is worth no more than the guess it replaced. The
 * evidence travels with the answer and the verb prints it before running
 * anything, which lets an operator correct a wrong read without the detection
 * having to be right every time.
 *
 * Returns `undefined` for a path outside any install tree, which is a source
 * checkout. That is not a case to guess at either: reinstalling over a clone
 * would replace what the operator is working in.
 */
export function detectManager(root: string): Manager | undefined {
  const segments = root.split(/[/\\]/).filter((segment) => segment !== '')

  for (const [id, signature] of SIGNATURES) {
    if (segments.includes(signature)) return { id, evidence: signature }
  }

  if (segments.includes('node_modules')) {
    return { id: 'npm', evidence: 'node_modules' }
  }

  return undefined
}

/** The global reinstall each manager spells, pinned to the newest published. */
export function installCommand(
  manager: ManagerId,
  name: string,
): readonly string[] {
  const spec = `${name}@latest`

  switch (manager) {
    case 'bun':
      return ['bun', 'add', '--global', spec]
    case 'pnpm':
      return ['pnpm', 'add', '--global', spec]
    case 'yarn':
      return ['yarn', 'global', 'add', spec]
    case 'npm':
      return ['npm', 'install', '--global', spec]
  }
}
