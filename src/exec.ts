import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execa } from 'execa'

/**
 * The root of the package this CLI is running out of, which is the repository
 * root in a checkout and the installed package directory in a target.
 *
 * Derived from `import.meta.url` rather than Bun's `import.meta.dir`, since the
 * test runner resolves the first and leaves the second undefined, which puts
 * every module reading this root out of reach of a test.
 */
export const PROJECT_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
)

export async function execScript(
  script: string,
  args: string[],
): Promise<void> {
  const scriptPath = join(PROJECT_ROOT, 'scripts', script)
  const result = await execa(scriptPath, args, {
    stdio: 'inherit',
    env: { ...process.env, PROJECT_ROOT },
    reject: false,
  })
  process.exit(result.exitCode ?? 1)
}
