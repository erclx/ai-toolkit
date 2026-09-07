import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The root of the package this CLI is running out of, which is the repository
 * root in a checkout and the installed package directory in a target.
 *
 * Derived from `import.meta.url` rather than Bun's `import.meta.dir`, since the
 * test runner resolves the first and leaves the second undefined, which puts
 * every module reading this root out of reach of a test.
 *
 * It sits in a module of its own rather than beside `execScript`, because a
 * path constant and a process spawn share no reason to change and an importer
 * of the first would otherwise load `execa` to read one string.
 */
export const PROJECT_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
)

const readPackageName = (root: string): string | undefined => {
  try {
    const raw = readFileSync(resolve(root, 'package.json'), 'utf8')
    return (JSON.parse(raw) as { name?: string }).name
  } catch {
    return undefined
  }
}

/**
 * Walks upward from `startDir` for the nearest ancestor `package.json`
 * sharing this package's own `name`, and reports its path when that ancestor
 * is not `PROJECT_ROOT`. A bare `canon` on PATH resolves `PROJECT_ROOT` to the
 * installed package rather than to a checkout the caller may be standing in,
 * which is the case this reports: a caller's cwd sitting inside a second
 * checkout the running binary never resolved against.
 */
export function findCheckoutMismatch(startDir: string): string | undefined {
  const ownName = readPackageName(PROJECT_ROOT)
  if (ownName === undefined) return undefined

  let dir = resolve(startDir)
  while (true) {
    if (readPackageName(dir) === ownName) {
      return dir === PROJECT_ROOT ? undefined : dir
    }

    const parent = dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
}

/**
 * The warning line every verb that answers from `PROJECT_ROOT` emits when the
 * caller's cwd sits inside a second checkout, or `undefined` when it does not.
 *
 * It returns the string rather than logging it so this module keeps no `@/ui`
 * dependency and the wording is unit-testable on its own. The wording names
 * both roots and no subcommand: the four chokepoints that carry it stand under
 * eight-plus verbs each, so a per-verb suffix would cost a parameter at every
 * call site to buy back one verb's exact string.
 */
export function checkoutMismatchWarning(cwd: string): string | undefined {
  const mismatch = findCheckoutMismatch(cwd)
  if (mismatch === undefined) return undefined

  return `Resolved via ${PROJECT_ROOT}, not the checkout at ${mismatch}. Run \`bun ${mismatch}/src/cli.ts ...\` to answer from that checkout instead.`
}
