import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { execa } from 'execa'

/**
 * Why no unknown-word list was produced, which is never the same as a clean
 * one.
 *
 * The one reason today is the binary being absent. `cspell` is a
 * devDependency of this repository alone, per `075-dependencies.md`'s ban on
 * importing a transitive-only package, so a target project that never
 * adopted it gets no coverage from this check rather than a network fetch or
 * a forced new dependency.
 */
export type SpellingRefusal = 'no-binary'

export type SpellingScan =
  | { readonly kind: 'checked'; readonly unknownWords: readonly string[] }
  | { readonly kind: 'unavailable'; readonly reason: SpellingRefusal }

/**
 * Reads `cspell stdin --words-only --unique`'s stdout into a clean list.
 *
 * `--unique` already dedupes on cspell's side, so this exists for the same
 * reason `parseAdvisories` exists beside `auditDependencies`: a pure function
 * over a fixture string is a unit test that needs no binary on the machine
 * running it, where the trailing blank line an empty scan's stdout carries
 * is what actually needs the trim-and-filter below.
 */
export function parseUnknownWords(stdout: string): string[] {
  return stdout
    .split(/\r?\n/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0)
}

/**
 * Shells this repository's own resolved `cspell` binary against a title over
 * stdin, rather than a bare `execa('cspell', …)`.
 *
 * `bun src/cli.ts labels scan` is the exact invocation `phase-label-gate.yml`
 * uses, and it runs outside `bun run`, so `node_modules/.bin` is not on
 * `PATH` and a bare spawn throws `ENOENT`. Resolving the binary path directly
 * under `root` is what a caller running from this checkout needs, and it is
 * also what keeps the check from reaching a `bunx` fallback that could fetch
 * `cspell` from the network on a machine that never asked for it.
 */
export async function scanTitleSpelling(
  title: string,
  root: string,
): Promise<SpellingScan> {
  const binary = join(root, 'node_modules', '.bin', 'cspell')

  if (!existsSync(binary)) {
    return { kind: 'unavailable', reason: 'no-binary' }
  }

  const result = await execa(
    binary,
    ['stdin', '--words-only', '--unique', '--no-progress', '--no-summary'],
    { cwd: root, input: title, reject: false },
  )

  return { kind: 'checked', unknownWords: parseUnknownWords(result.stdout) }
}
