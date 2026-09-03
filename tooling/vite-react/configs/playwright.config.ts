import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI
const baseURL = `http://localhost:${5173 + (Number(process.env.WORKTREE_PORT_OFFSET) || 0)}`

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  // No override here: Playwright's own CPU-derived default suits every CI runner
  reporter: isCI ? 'list' : 'html',
  use: {
    trace: 'on-first-retry',
    baseURL,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'bun run dev',
    url: baseURL,
    reuseExistingServer: false,
  },
})
