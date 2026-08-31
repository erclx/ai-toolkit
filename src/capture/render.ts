import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'
import type { CaptureSource } from '@/capture/sources'
import { primaryFontFamily, resolveCaptureSources } from '@/capture/sources'
import { formatStamp, hashSource, stampPath } from '@/capture/stamp'

/**
 * Every browser reference the capture command makes lives in this module, and
 * `files` in `package.json` excludes it, because capture regenerates images
 * committed to this repository and a target has nothing to regenerate.
 * `src/commands/capture.ts` reaches it through a dynamic import so `src/cli.ts`
 * never resolves the engine at startup.
 *
 * `@/demo/drive` is the other browser module and ships, since its whole purpose
 * is running in someone else's project.
 */

const DEVICE_SCALE_FACTOR = 2
const FONT_PROBE_SIZE = 72
const FONT_PROBE_TEXT = 'canon capture 0123456789'
const ABSENT_FAMILY = '__canon_absent_family__'

export interface CaptureOptions {
  selector: string
  outDir?: string
}

export type CaptureResult =
  | {
      status: 'rendered'
      htmlPath: string
      pngPath: string
      width: number
      height: number
    }
  | { status: 'failed'; htmlPath: string; reason: string }

export async function captureSources(
  sourcePath: string,
  options: CaptureOptions,
): Promise<CaptureResult[]> {
  const sources = resolveCaptureSources(sourcePath, options.outDir)
  if (!sources.length) return []

  const browser = await chromium.launch()
  try {
    return await Promise.all(
      sources.map((source) => captureOne(browser, source, options.selector)),
    )
  } finally {
    await browser.close()
  }
}

/**
 * Resolves to a failed result rather than throwing, so one source that cannot
 * render does not drop the rest of the batch.
 */
async function captureOne(
  browser: Browser,
  source: CaptureSource,
  selector: string,
): Promise<CaptureResult> {
  const page = await browser.newPage({
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
  })
  try {
    await page.goto(pathToFileURL(source.htmlPath).href)
    const element = page.locator(selector).first()
    if ((await element.count()) === 0) {
      return failed(source, `no element matched ${selector}`)
    }

    await page.evaluate(() => document.fonts.ready.then(() => undefined))
    const family = primaryFontFamily(
      await element.evaluate((node) => getComputedStyle(node).fontFamily),
    )
    if (family && !(await resolvesFont(page, family))) {
      return failed(
        source,
        `${family} is not installed, so the capture would rewrap against a fallback`,
      )
    }

    mkdirSync(dirname(source.pngPath), { recursive: true })
    const png = await element.screenshot({ omitBackground: true })
    writeFileSync(source.pngPath, png)
    writeStamp(source, png)
    return {
      status: 'rendered',
      htmlPath: source.htmlPath,
      pngPath: source.pngPath,
      width: png.readUInt32BE(16),
      height: png.readUInt32BE(20),
    }
  } catch (error) {
    return failed(
      source,
      error instanceof Error ? error.message : String(error),
    )
  } finally {
    await page.close()
  }
}

/**
 * Runs inside the render rather than in a wrapper around it, so a capture
 * cannot succeed and leave the provenance unrecorded. A throw here reaches the
 * caller's catch and reports the source as failed, which is correct: a PNG
 * whose stamp never landed is the state the verify stage exists to reject.
 *
 * The source is stored as a bare filename. An absolute path would record the
 * machine that ran the capture into a tracked file and differ per checkout.
 *
 * The image digest is taken over the buffer the screenshot returned rather than
 * by reading the file back, so the stamp describes the bytes this run wrote.
 */
function writeStamp(source: CaptureSource, png: Uint8Array): void {
  writeFileSync(
    stampPath(source.pngPath),
    formatStamp({
      source: basename(source.htmlPath),
      sourceSha256: hashSource(readFileSync(source.htmlPath)),
      imageSha256: hashSource(png),
    }),
  )
}

function failed(source: CaptureSource, reason: string): CaptureResult {
  return { status: 'failed', htmlPath: source.htmlPath, reason }
}

/**
 * Compares the family's text metrics against a family that cannot exist. Equal
 * widths mean the browser fell through to its default for both, which is the
 * only signal available: `document.fonts.check` reports every system family as
 * present, including invented ones.
 */
async function resolvesFont(page: Page, family: string): Promise<boolean> {
  return page.evaluate(
    ({ family, absent, size, text }) => {
      const context = document.createElement('canvas').getContext('2d')
      if (!context) return false
      const widthOf = (name: string): number => {
        context.font = `${size}px "${name}"`
        return context.measureText(text).width
      }
      return widthOf(family) !== widthOf(absent)
    },
    {
      family,
      absent: ABSENT_FAMILY,
      size: FONT_PROBE_SIZE,
      text: FONT_PROBE_TEXT,
    },
  )
}
