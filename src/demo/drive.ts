import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright-core'
import type { Browser, BrowserContext, Page } from 'playwright-core'
import { isBrowserMissing } from '@/browser/engine'
import { deriveSteps } from '@/demo/compile'
import type { DemoPlan, DemoStep } from '@/demo/compile'
import type { CursorSet } from '@/demo/pointer'
import { pointerSource } from '@/demo/pointer'

declare global {
  interface Window {
    __aitk_demo_caption__?: (text: string) => void
  }
}

/**
 * Drives a running application and records what it did. Every browser reference
 * the demo feature adds lives here, and `src/commands/demo.ts` reaches it
 * through a dynamic import so no other command resolves the engine at startup.
 *
 * Unlike `@/capture/render`, this module ships. The capture command is excluded
 * from the published package because it regenerates images committed to this
 * repository, and that reason does not transfer to a command whose whole
 * purpose is running in someone else's project.
 *
 * It imports `playwright-core` rather than `@playwright/test`, which stays a
 * development dependency for the capture module. Shipping puts the import in
 * every target's dependency tree, and a target needs the driver rather than a
 * test runner and an assertion library. Both are pinned to one version rather
 * than a range, because `bunx playwright install chromium` fetches the browser
 * revision the installed engine expects and a float would leave a target
 * resolving a binary its engine cannot launch.
 */

const POINTER_SIZE = 32
/**
 * Where the pointer starts. Any position inside the viewport works, since the
 * point is giving it one move to install and paint before it travels to the
 * first target. A corner keeps that first move out of the way of the content.
 */
const START = { x: 8, y: 8 }
const SETTLE_MS = 250
/** Round trips sampled to price one, on the page a step is actually about to move across. */
const CALIBRATION_STEPS = 8
/** DOM id the caption bar installs under, read back by `drive.e2e.test.ts`. */
export const CAPTION_ID = '__aitk_demo_caption_bar__'

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

  let videoDir: string | undefined
  let context: BrowserContext
  const started = Date.now()
  try {
    // Created after the launch, so a target with no browser binary does not
    // leave an empty directory behind for a run that never started, and inside
    // the try so a failure here closes the browser rather than leaking it.
    videoDir = options.videoPath
      ? mkdtempSync(join(tmpdir(), 'aitk-demo-'))
      : undefined

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
    await context.addInitScript({ content: captionInitScript() })
    const page = await context.newPage()
    const video = page.video()
    const pace: PointerPace = {}

    // The opening navigate is skipped when the plan already starts with one,
    // because a draft written around an opening verb compiles to a `navigate`
    // step for the same URL and the second load is a visible reload.
    if (plan.steps[0]?.kind !== 'navigate') {
      await page.goto(plan.url)
      await page.mouse.move(START.x, START.y, { steps: 2 })
    }

    for (const step of plan.steps) {
      await runStep(page, plan, step, pace)
      // The first marked step wins. One file holds one frame, so a plan a
      // person edited to mark several would otherwise write each over the last
      // and keep whichever ran last, with nothing saying so.
      if (step.still && options.stillPath && !stillPath) {
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
 * Reads the launch through `@/browser/engine`, which is where the separation
 * between a binary that was never installed and every other launch failure now
 * lives. It moved out of this file when `aitk inventory` became the second
 * command needing it, rather than being copied.
 */
async function launch(): Promise<Launch> {
  try {
    return { status: 'launched', value: await chromium.launch() }
  } catch (error) {
    return failed(
      isBrowserMissing(error) ? 'browser-missing' : 'drive-failed',
      error,
    )
  }
}

/**
 * Holds the round trip once a step has measured it, so every `moveTo` after
 * the first reuses the same reading rather than re-timing on every move.
 */
export interface PointerPace {
  roundTripMs?: number
}

/**
 * Exported so `drive.e2e.test.ts` can drive one real step against a real
 * caption and read it back, which is the integration a full `drive()` call
 * cannot assert without decoding the video it writes.
 */
export async function runStep(
  page: Page,
  plan: DemoPlan,
  step: DemoStep,
  pace: PointerPace,
): Promise<void> {
  switch (step.kind) {
    case 'navigate':
      await page.goto(step.target || plan.url)
      await page.mouse.move(START.x, START.y, { steps: 2 })
      break
    case 'click':
      await moveTo(page, plan, step, pace)
      await page.mouse.down()
      await page.mouse.up()
      break
    case 'fill':
      await moveTo(page, plan, step, pace)
      await page.mouse.down()
      await page.mouse.up()
      await page.keyboard.type(step.text, { delay: plan.pointer.typeDelayMs })
      break
    case 'hover':
      await moveTo(page, plan, step, pace)
      break
    case 'scroll':
      await page.locator(step.target).first().scrollIntoViewIfNeeded()
      await page.waitForTimeout(SETTLE_MS)
      await moveTo(page, plan, step, pace)
      break
    case 'wait':
    case 'hold':
      break
  }

  // Set after the action rather than before it, so the caption shows for the
  // hold that follows rather than for the page the action is about to leave.
  await setCaption(page, step.caption)
  if (step.waitFor) await page.locator(step.waitFor).first().waitFor()
  await page.waitForTimeout(step.holdMs)
}

/**
 * Timed on the page a `moveTo` is actually about to move across, never on the
 * blank page before it, since layout, paint, and page script are what a step
 * pays the round trip against and a blank page has none of the three.
 */
async function calibrateRoundTrip(page: Page): Promise<number> {
  const startedAt = Date.now()
  await page.mouse.move(START.x, START.y, { steps: CALIBRATION_STEPS })
  return (Date.now() - startedAt) / CALIBRATION_STEPS
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
  pace: PointerPace,
): Promise<void> {
  pace.roundTripMs ??= await calibrateRoundTrip(page)
  const locator = page.locator(step.target).first()
  await locator.waitFor()
  const box = await locator.boundingBox()
  if (!box) throw new Error(`${step.target} has no box to point at`)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: deriveSteps(plan.pointer.travelMs, pace.roundTripMs),
  })
}

/**
 * Playwright's own `showActions` overlay names the API call it made, not the
 * beat's narration, so a caption needs an element of its own rather than
 * reusing that annotation. Runs alongside `pointerSource`, guarded the same
 * way against a page that already carries one.
 */
export function captionInitScript(): string {
  return `(() => {
  if (window.__aitk_demo_caption__) return;

  let label;

  const install = () => {
    if (label || !document.body) return;
    const bar = document.createElement('div');
    bar.id = '${CAPTION_ID}';
    bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText = [
      'position:fixed',
      'left:0',
      'right:0',
      'bottom:32px',
      'display:flex',
      'justify-content:center',
      'pointer-events:none',
      'z-index:2147483647',
    ].join(';');
    label = document.createElement('span');
    label.style.cssText = [
      'background:rgba(16,16,20,0.85)',
      'color:#f4f4f5',
      'font:600 20px/1.4 system-ui,sans-serif',
      'padding:10px 22px',
      'border-radius:8px',
      'max-width:80vw',
      'text-align:center',
      'display:none',
    ].join(';');
    bar.appendChild(label);
    document.body.appendChild(bar);
    window.__aitk_demo_caption__ = (text) => {
      label.textContent = text || '';
      label.style.display = text ? 'inline-block' : 'none';
    };
  };

  if (document.readyState === 'loading') {
    addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();`
}

async function setCaption(page: Page, caption: string): Promise<void> {
  await page.evaluate((text) => {
    window.__aitk_demo_caption__?.(text)
  }, caption)
}

function failed(reason: DriveRefusal, error: unknown): DriveFailure {
  return {
    status: 'failed',
    reason,
    message: error instanceof Error ? error.message : String(error),
  }
}
