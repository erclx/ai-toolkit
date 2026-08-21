import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { chromium } from '@playwright/test'
import type { Browser, BrowserContext, Page } from '@playwright/test'
import type { DemoPlan, DemoStep } from '@/demo/compile'
import type { CursorSet } from '@/demo/pointer'
import { pointerSource } from '@/demo/pointer'

/**
 * Drives a running application and records what it did. Every browser reference
 * the demo feature adds lives here, and `src/commands/demo.ts` reaches it
 * through a dynamic import so no other command resolves the engine at startup.
 *
 * Unlike `@/capture/render`, this module ships. The capture command is excluded
 * from the published package because it regenerates images committed to this
 * repository, and that reason does not transfer to a command whose whole
 * purpose is running in someone else's project.
 */

const POINTER_SIZE = 32
/** Off-canvas, so the pointer installs and paints before the first target. */
const START = { x: 8, y: 8 }
const SETTLE_MS = 250

/**
 * The two output paths arrive resolved rather than as a root this re-resolves
 * against, because the plan already carries a directory and resolving it twice
 * nests the whole path inside itself.
 *
 * An absent path means the caller asked for that artifact not to be produced.
 */
export interface DriveOptions {
  readonly plan: DemoPlan
  readonly cursors: CursorSet
  readonly videoPath?: string
  readonly stillPath?: string
}

export type DriveResult =
  | {
      status: 'recorded'
      videoPath?: string
      stillPath?: string
      steps: number
      durationMs: number
    }
  | { status: 'failed'; reason: DriveRefusal; message: string }

export type DriveRefusal = 'browser-missing' | 'drive-failed'

interface DriveFailure {
  readonly status: 'failed'
  readonly reason: DriveRefusal
  readonly message: string
}

type Launch = { status: 'launched'; value: Browser } | DriveFailure

export async function drive(options: DriveOptions): Promise<DriveResult> {
  const { plan } = options

  const browser = await launch()
  if (browser.status === 'failed') return browser

  // Created after the launch, so a target with no browser binary does not leave
  // an empty directory behind for a run that never started.
  const videoDir = options.videoPath
    ? mkdtempSync(join(tmpdir(), 'aitk-demo-'))
    : undefined

  let context: BrowserContext
  const started = Date.now()
  try {
    context = await browser.value.newContext({
      viewport: plan.viewport,
      // Pointed the opposite way from a test. A recording wants the motion the
      // interface was designed with, where a test wants it suppressed.
      reducedMotion: 'no-preference',
      ...(videoDir
        ? {
            recordVideo: {
              dir: videoDir,
              size: plan.viewport,
              showActions: {
                duration: plan.annotations.durationMs,
                position: plan.annotations.position,
                fontSize: plan.annotations.fontSize,
              },
            },
          }
        : {}),
    })
  } catch (error) {
    await browser.value.close()
    if (videoDir) rmSync(videoDir, { recursive: true, force: true })
    return failed('drive-failed', error)
  }

  let stillPath: string | undefined
  let videoPath: string | undefined

  try {
    await context.addInitScript({
      content: pointerSource(options.cursors, POINTER_SIZE),
    })
    const page = await context.newPage()
    const video = page.video()

    await page.goto(plan.url)
    await page.mouse.move(START.x, START.y, { steps: 2 })

    for (const step of plan.steps) {
      await runStep(page, plan, step)
      if (step.still && options.stillPath) {
        stillPath = options.stillPath
        mkdirSync(dirname(stillPath), { recursive: true })
        await page.screenshot({ path: stillPath })
      }
    }

    await context.close()

    if (video && options.videoPath) {
      videoPath = options.videoPath
      mkdirSync(dirname(videoPath), { recursive: true })
      await video.saveAs(videoPath)
      // The engine keeps the auto-named recording beside the saved copy, so a
      // run that skipped this would leave two files for every demo.
      await video.delete()
    }
  } catch (error) {
    return failed('drive-failed', error)
  } finally {
    await browser.value.close()
    if (videoDir) rmSync(videoDir, { recursive: true, force: true })
  }

  return {
    status: 'recorded',
    ...(videoPath ? { videoPath } : {}),
    ...(stillPath ? { stillPath } : {}),
    steps: plan.steps.length,
    durationMs: Date.now() - started,
  }
}

/**
 * Separates a browser binary that was never installed from every other launch
 * failure, because the first is a setup step the operator has to run and the
 * second is a defect. A target inherits that setup step, which is the stated
 * cost of shipping this command outside the toolkit.
 */
async function launch(): Promise<Launch> {
  try {
    return { status: 'launched', value: await chromium.launch() }
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error)
    return failed(
      /executable doesn't exist|playwright install/i.test(text)
        ? 'browser-missing'
        : 'drive-failed',
      error,
    )
  }
}

async function runStep(
  page: Page,
  plan: DemoPlan,
  step: DemoStep,
): Promise<void> {
  switch (step.kind) {
    case 'navigate':
      await page.goto(step.target || plan.url)
      await page.mouse.move(START.x, START.y, { steps: 2 })
      break
    case 'click':
      await moveTo(page, plan, step)
      await page.mouse.down()
      await page.mouse.up()
      break
    case 'fill':
      await moveTo(page, plan, step)
      await page.mouse.down()
      await page.mouse.up()
      await page.keyboard.type(step.text, { delay: plan.pointer.typeDelayMs })
      break
    case 'hover':
      await moveTo(page, plan, step)
      break
    case 'scroll':
      await page.locator(step.target).first().scrollIntoViewIfNeeded()
      await page.waitForTimeout(SETTLE_MS)
      await moveTo(page, plan, step)
      break
    case 'wait':
    case 'hold':
      break
  }

  if (step.waitFor) await page.locator(step.waitFor).first().waitFor()
  await page.waitForTimeout(step.holdMs)
}

/**
 * Travel is the whole point of driving the engine's pointer rather than calling
 * the element-clicking helper, which resolves a target and jumps to it. The
 * step count is what separates a cursor that glides from one that teleports.
 *
 * Resolving through a bounding box assumes the target is in the viewport, so a
 * target below the fold needs a `scroll` step ahead of it.
 */
async function moveTo(
  page: Page,
  plan: DemoPlan,
  step: DemoStep,
): Promise<void> {
  const locator = page.locator(step.target).first()
  await locator.waitFor()
  const box = await locator.boundingBox()
  if (!box) throw new Error(`${step.target} has no box to point at`)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: plan.pointer.steps,
  })
}

function failed(reason: DriveRefusal, error: unknown): DriveFailure {
  return {
    status: 'failed',
    reason,
    message: error instanceof Error ? error.message : String(error),
  }
}
