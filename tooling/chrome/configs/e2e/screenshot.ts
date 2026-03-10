import { chromium, type BrowserContext, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

type ColorScheme = 'light' | 'dark'

type Surface = {
  name: string
  width: number
  height: number
}

type AppState = {
  name: string
  setup?: (page: Page) => Promise<void>
}

type SeedData = {
  key: string
  value: unknown
}

type ChromeGlobal = {
  chrome: {
    storage: {
      local: {
        set: (data: Record<string, unknown>) => void
      }
    }
  }
}

const SURFACES: Surface[] = [
  { name: 'popup', width: 320, height: 500 },
  { name: 'sidepanel', width: 400, height: 800 },
]

const COLOR_SCHEMES: ColorScheme[] = ['light', 'dark']

// Set to null if your app has no seed data
const SEED: SeedData | null = {
  key: 'items',
  value: [],
}

const STATES: AppState[] = [{ name: 'default' }]

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screenshotsDir = path.join(__dirname, '..', 'screenshots')
const pathToExtension = path.join(__dirname, '..', 'dist')

fs.mkdirSync(screenshotsDir, { recursive: true })

async function launchWithExtension(
  seed: SeedData | null,
): Promise<BrowserContext> {
  const ctx = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  })
  if (seed) {
    await ctx.addInitScript(
      ({ key, value }: { key: string; value: unknown }) => {
        ;(globalThis as unknown as ChromeGlobal).chrome.storage.local.set({
          [key]: value,
        })
      },
      seed,
    )
  }
  return ctx
}

async function getExtensionId(ctx: BrowserContext): Promise<string> {
  let [sw] = ctx.serviceWorkers()
  if (!sw) sw = await ctx.waitForEvent('serviceworker')
  return sw.url().split('/')[2]
}

async function gotoSurface(
  page: Page,
  extensionId: string,
  surface: Surface,
  scheme: ColorScheme,
): Promise<void> {
  await page.setViewportSize({ width: surface.width, height: surface.height })
  await page.emulateMedia({ colorScheme: scheme })
  await page.goto(
    `chrome-extension://${extensionId}/src/${surface.name}/index.html`,
  )
  await page.waitForLoadState('networkidle')
}

async function takeShot(page: Page, filename: string): Promise<void> {
  await page.screenshot({ path: path.join(screenshotsDir, filename) })
  console.log(`✓ ${filename}`)
}

for (const scheme of COLOR_SCHEMES) {
  for (const surface of SURFACES) {
    const emptyCtx = await launchWithExtension(null)
    const emptyId = await getExtensionId(emptyCtx)
    const emptyPage = await emptyCtx.newPage()
    await gotoSurface(emptyPage, emptyId, surface, scheme)
    await takeShot(emptyPage, `${surface.name}-${scheme}-empty.png`)
    await emptyCtx.close()

    const ctx = await launchWithExtension(SEED)
    const id = await getExtensionId(ctx)

    for (const state of STATES) {
      const page = await ctx.newPage()
      await gotoSurface(page, id, surface, scheme)
      if (state.setup) await state.setup(page)
      await takeShot(page, `${surface.name}-${scheme}-${state.name}.png`)
      await page.close()
    }

    await ctx.close()
  }
}

console.log(`\nScreenshots saved to: screenshots/`)
