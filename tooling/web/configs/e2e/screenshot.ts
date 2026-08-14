import type { Page } from '@playwright/test'
import { chromium } from '@playwright/test'
import { mkdir } from 'fs/promises'
import path from 'path'

interface CaptureCase {
  section: string
  theme: string
  route: string
  width: number
  height: number
  setup?: (page: Page) => Promise<void>
}

const CASES: CaptureCase[] = [
  { section: 'home', theme: 'default', route: '/', width: 1280, height: 800 },
  {
    section: 'home',
    theme: 'dark',
    route: '/',
    width: 1280,
    height: 800,
    setup: (page) => page.emulateMedia({ colorScheme: 'dark' }),
  },
]

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:4173'
const OUT_DIR = 'screenshots'

const browser = await chromium.launch()

for (const captureCase of CASES) {
  const context = await browser.newContext({
    viewport: { width: captureCase.width, height: captureCase.height },
  })
  const page = await context.newPage()

  if (captureCase.setup) await captureCase.setup(page)

  await page.goto(`${BASE_URL}${captureCase.route}`)
  await page.waitForLoadState('networkidle')

  const sectionDir = path.join(OUT_DIR, captureCase.section)
  await mkdir(sectionDir, { recursive: true })

  const file = path.join(sectionDir, `${captureCase.theme}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`captured ${file}`)

  await context.close()
}

await browser.close()
