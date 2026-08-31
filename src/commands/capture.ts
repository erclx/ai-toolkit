import { existsSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import type { Command } from 'commander'
import { frameError, intro, logError, logInfo, outro, pipeOutput } from '@/ui'

const DEFAULT_SOURCE = 'assets'
const DEFAULT_SELECTOR = '.window'

/**
 * Both aliases are type queries rather than imports, so `@/capture/render`
 * never appears in this module's runtime import list.
 */
type Renderer = typeof import('@/capture/render')
type CaptureResult = Awaited<ReturnType<Renderer['captureSources']>>[number]

/**
 * Holds wiring only. Every browser reference sits behind `loadRenderer`,
 * because `src/cli.ts` imports this module at startup and the render module is
 * excluded from the published package.
 */
export function register(program: Command): void {
  program
    .command('capture')
    .description('Render HTML capture sources to PNG')
    .argument('[source]', 'HTML file or a directory of them', DEFAULT_SOURCE)
    .option('-o, --out <dir>', 'Output directory, defaults beside the source')
    .option('-s, --selector <selector>', 'Element to capture', DEFAULT_SELECTOR)
    .action(
      async (
        source: string,
        opts: { out?: string; selector: string },
      ): Promise<void> => {
        const renderer = await loadRenderer()
        if (!renderer) {
          frameError(
            'capture is toolkit-only and is absent from an installed canon',
          )
          process.exitCode = 1
          return
        }

        const sourcePath = resolve(process.cwd(), source)
        if (!existsSync(sourcePath)) {
          frameError(`${source} not found`)
          process.exitCode = 1
          return
        }

        intro('Capture')
        let results: CaptureResult[]
        try {
          results = await renderer.captureSources(sourcePath, {
            selector: opts.selector,
            outDir: opts.out ? resolve(process.cwd(), opts.out) : undefined,
          })
        } catch (error) {
          reportInFrame(error)
          process.exitCode = 1
          return
        }

        if (!results.length) {
          logError(`no .html source under ${source}`)
          outro()
          process.exitCode = 1
          return
        }

        for (const result of results) {
          if (result.status === 'rendered') {
            logInfo(
              `${displayPath(result.pngPath)} ${result.width}x${result.height}`,
            )
          } else {
            logError(`${displayPath(result.htmlPath)}: ${result.reason}`)
          }
        }
        outro()

        if (results.some((result) => result.status === 'failed')) {
          process.exitCode = 1
        }
      },
    )
}

/**
 * Closes an open frame around a failure the render module raised for the whole
 * run rather than for one source, such as a browser binary that is not
 * installed. The engine's own message is readable, so it is passed through
 * intact instead of being summarized.
 */
function reportInFrame(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  const [first, ...rest] = message.split('\n')
  logError(first ?? 'capture failed')
  if (rest.length) pipeOutput(rest.join('\n'))
  outro()
}

/**
 * Keeps a path clickable in the operator's terminal. A source outside the
 * project reports absolute, since a relative path to it is a run of `..`
 * segments no editor resolves.
 */
function displayPath(path: string): string {
  const fromCwd = relative(process.cwd(), path)
  return fromCwd.startsWith('..') ? path : fromCwd
}

/**
 * Reports absence only when the module or its engine cannot be resolved, which
 * is the published-package case. Any other import failure is a defect inside
 * the render module and propagates, rather than being reported as a feature
 * the package left out.
 */
async function loadRenderer(): Promise<Renderer | undefined> {
  try {
    return await import('@/capture/render')
  } catch (error) {
    if (isModuleNotFound(error)) return undefined
    throw error
  }
}

function isModuleNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ERR_MODULE_NOT_FOUND'
  )
}
