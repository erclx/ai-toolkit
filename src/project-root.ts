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
