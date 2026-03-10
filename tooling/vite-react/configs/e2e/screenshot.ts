import { chromium, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

type ColorScheme = 'light' | 'dark'

type Route = {
  name: string
  path: string
  width: number
  height: number
}

type AppState = {
  name: string
  setup?: (page: Page) => Promise<void>
}

const BASE_URL = 'http://localhost:4173'

const ROUTES: Route[] = [{ name: 'home', path: '/', width: 1280, height: 800 }]

const COLOR_SCHEMES: ColorScheme[] = ['light', 'dark']

const STATES: AppState[] = [{ name: 'default' }]

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screenshotsDir = path.join(__dirname, '..', 'screenshots')

fs.mkdirSync(screenshotsDir, { recursive: true })

async function takeShot(page: Page, filename: string): Promise<void> {
  await page.screenshot({ path: path.join(screenshotsDir, filename) })
  console.log(`✓ ${filename}`)
}

const browser = await chromium.launch()

for (const scheme of COLOR_SCHEMES) {
  for (const route of ROUTES) {
    const context = await browser.newContext({
      colorScheme: scheme,
      viewport: { width: route.width, height: route.height },
    })

    for (const state of STATES) {
      const page = await context.newPage()
      await page.goto(`${BASE_URL}${route.path}`)
      await page.waitForLoadState('networkidle')
      if (state.setup) await state.setup(page)
      await takeShot(page, `${route.name}-${scheme}-${state.name}.png`)
      await page.close()
    }

    await context.close()
  }
}

await browser.close()

console.log(`\nScreenshots saved to: screenshots/`)
