import type { Page } from '@playwright/test'

const ROUTES = [{ name: 'home', path: '/', width: 1280, height: 800 }]

type State = { name: string; setup?: (page: Page) => Promise<void> }
const STATES: State[] = [
  { name: 'default' },
  { name: 'dark', setup: async (p) => p.emulateMedia({ colorScheme: 'dark' }) },
]

import { chromium } from '@playwright/test'
import { mkdir } from 'fs/promises'
import path from 'path'

const BASE_URL = 'http://localhost:4173'
const OUT_DIR = 'screenshots'

const browser = await chromium.launch()
await mkdir(OUT_DIR, { recursive: true })

for (const route of ROUTES) {
  for (const state of STATES) {
    const ctx = await browser.newContext({
      viewport: { width: route.width, height: route.height },
    })
    const page = await ctx.newPage()

    if (state.setup) await state.setup(page)

    await page.goto(`${BASE_URL}${route.path}`)
    await page.waitForLoadState('networkidle')

    const file = path.join(OUT_DIR, `${route.name}-${state.name}.png`)
    await page.screenshot({ path: file, fullPage: true })
    console.log(`captured ${file}`)

    await ctx.close()
  }
}

await browser.close()
