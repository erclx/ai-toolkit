import { expect, test } from '@playwright/test'

import { readCatalogCounts } from '../src/lib/counts'

test('renders the seven sections', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('section')).toHaveCount(7)
})

test('every section image resolves', async ({ page }) => {
  await page.goto('/')
  const images = page.locator('img')
  const count = await images.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    const src = await images.nth(i).getAttribute('src')
    expect(src).toBeTruthy()
    const response = await page.request.get(src as string)
    expect(response.ok()).toBe(true)
  }
})

test('the rule arrives once its stage scrolls into view', async ({ page }) => {
  await page.goto('/')
  const stage = page.locator('.rule-arrival-stage')
  const card = stage.locator('.rule-card')

  await expect(card).toHaveCSS('opacity', '0')
  await stage.scrollIntoViewIfNeeded()
  await expect(stage).toHaveClass(/is-visible/)
  await expect(card).toHaveCSS('opacity', '1')
})

test('the hero cta points at the install section', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'See how it installs' }).click()
  await expect(page).toHaveURL(/#install$/)
  await expect(page.locator('#install')).toBeInViewport()
})

test('catalog counts match a live canon gov counts read', async ({ page }) => {
  const live = readCatalogCounts()
  await page.goto('/')

  for (const [name, value] of Object.entries(live)) {
    const card = page.locator('dl > div').filter({ hasText: name })
    await expect(card.locator('dd')).toHaveText(String(value))
  }
})
