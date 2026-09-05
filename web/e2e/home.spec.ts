import { expect, test } from '@playwright/test'

import { readCatalogCounts } from '../src/lib/counts'
// The spec runs outside vite, which resolves a bare JSON import for the
// component but not for this file, so the attribute is required here and not
// in AgentView.astro.
import fixture from '../src/fixtures/agent-view.json' with { type: 'json' }

test('renders the eight sections', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('section')).toHaveCount(8)
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

test('the agent view renders one row per fixture session', async ({ page }) => {
  await page.goto('/')
  const rows = page.locator('.agent-row')
  await expect(rows).toHaveCount(fixture.sessions.length)
  await expect(rows.first()).toContainText(fixture.sessions[0].branch)
})

test('the agent view bands move to completed on scroll', async ({ page }) => {
  await page.goto('/')
  const stage = page.locator('.agent-stage')

  await expect(stage.locator('.band-working')).toBeVisible()
  await expect(stage.locator('.band-completed')).toBeHidden()

  await stage.scrollIntoViewIfNeeded()

  // The band survives the scroll that reveals it. Flipping on the intersection
  // itself showed a reader four finished rows and never the state they finished
  // from, so this asserts the dwell rather than only its outcome.
  //
  // The wait is the assertion rather than a settle. Reading the class straight
  // after the scroll passes whether or not a dwell exists, since the observer
  // callback has not necessarily run yet either way, so the check has to land
  // inside the dwell window to mean anything.
  await page.waitForTimeout(400)
  await expect(stage).not.toHaveClass(/is-complete/)
  await expect(stage.locator('.band-working')).toBeVisible()

  await expect(stage).toHaveClass(/is-complete/)
  await expect(stage.locator('.band-completed').first()).toBeVisible()
  await expect(stage.locator('.band-working')).toBeHidden()
})

test('the agent view names an outcome for every session', async ({ page }) => {
  await page.goto('/')

  for (const [index, session] of fixture.sessions.entries()) {
    const outcome = page.locator('.agent-row').nth(index).locator('.outcome')
    await expect(outcome).toHaveText(
      session.pullRequest === null
        ? 'opens its own'
        : `#${session.pullRequest}`,
    )
  }
})

test('the working marker gives way to a check on scroll', async ({ page }) => {
  await page.goto('/')
  const row = page.locator('.agent-row').first()

  await expect(row.locator('.marker-working')).toBeVisible()
  await expect(row.locator('.marker-done')).toBeHidden()

  await page.locator('.agent-stage').scrollIntoViewIfNeeded()
  await expect(row.locator('.marker-done')).toBeVisible()
  await expect(row.locator('.marker-working')).toBeHidden()
})

test.describe('with motion turned down', () => {
  test.use({ reducedMotion: 'reduce' })

  // The band is carried by the class rather than by the motion, which is the
  // property that lets the marker animation drop out without taking the state
  // change with it.
  test('the band still lands', async ({ page }) => {
    await page.goto('/')
    const stage = page.locator('.agent-stage')

    await stage.scrollIntoViewIfNeeded()
    await expect(stage).toHaveClass(/is-complete/)
    await expect(stage.locator('.band-completed').first()).toBeVisible()
  })
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
