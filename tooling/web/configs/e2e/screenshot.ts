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
  evidence?: boolean
  setup?: (page: Page) => Promise<void>
}

const CASES: CaptureCase[] = [
  {
    section: 'home',
    theme: 'default',
    route: '/',
    width: 1280,
    height: 800,
    evidence: true,
  },
  {
    section: 'home',
    theme: 'dark',
    route: '/',
    width: 1280,
    height: 800,
    setup: (page) => page.emulateMedia({ colorScheme: 'dark' }),
  },
]

const args = process.argv.slice(2)
const checkConsoleClean = args.includes('--check-console-clean')
const requireBaseUrl = args.includes('--require-base-url')

if (requireBaseUrl && !process.env.SCREENSHOT_BASE_URL) {
  console.error('SCREENSHOT_BASE_URL is required with --require-base-url')
  process.exit(1)
}

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:4173'

let hostname: string
try {
  hostname = new URL(BASE_URL).hostname
} catch {
  console.error(`SCREENSHOT_BASE_URL is not a valid URL: ${BASE_URL}`)
  process.exit(1)
}

const OUT_DIR = path.join('screenshots', hostname)

const browser = await chromium.launch()
const consoleErrors: string[] = []
let ranCases = 0

for (const captureCase of CASES) {
  if (captureCase.evidence && requireBaseUrl) continue

  ranCases++
  const context = await browser.newContext({
    viewport: { width: captureCase.width, height: captureCase.height },
  })
  const page = await context.newPage()

  if (checkConsoleClean) {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(
          `${captureCase.section}/${captureCase.theme}: ${msg.text()}`,
        )
      }
    })
  }

  if (captureCase.setup) await captureCase.setup(page)

  await page.goto(`${BASE_URL}${captureCase.route}`)
  await page.waitForLoadState('networkidle')

  const sectionDir = path.join(OUT_DIR, captureCase.section)
  await mkdir(sectionDir, { recursive: true })

  const file = path.join(sectionDir, `${captureCase.theme}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`captured ${file}`)

  if (captureCase.evidence) {
    const evidenceDir = path.join('evidence', captureCase.section)
    await mkdir(evidenceDir, { recursive: true })
    const evidenceFile = path.join(evidenceDir, `${captureCase.theme}.png`)
    await page.screenshot({ path: evidenceFile, fullPage: true })
    console.log(`captured ${evidenceFile}`)
  }

  await context.close()
}

await browser.close()

if (requireBaseUrl && ranCases === 0) {
  console.error(
    'every CASES entry is flagged evidence: true, so --require-base-url skipped all of them and checked nothing',
  )
  process.exit(1)
}

if (checkConsoleClean && consoleErrors.length > 0) {
  console.error('console errors detected:')
  for (const error of consoleErrors) console.error(`  ${error}`)
  process.exit(1)
}
