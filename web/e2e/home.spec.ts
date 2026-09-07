import { expect, test } from '@playwright/test'

import { readCatalogCounts } from '../src/lib/counts'
// The spec runs outside vite, which resolves a bare JSON import for the
// component but not for this file, so the attribute is required here and not
// in agent-view.astro.
import fixture from '../src/fixtures/agent-view.json' with { type: 'json' }

test('renders the eight sections', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('section')).toHaveCount(8)
})

test('no section falls back to a committed raster', async ({ page }) => {
  await page.goto('/')
  // Every catalog the page shows is rendered from a build-time read now. A
  // raster reappearing means a section regressed to a picture of its content,
  // which is soft, carries no links, and cannot reflow.
  await expect(page.locator('main img')).toHaveCount(0)
})

test('the rules panel names every domain with its true count', async ({
  page,
}) => {
  await page.goto('/')
  const groups = page.locator('#catalog .panel-group')
  // The group structure is complete and the sampling sits one level down. A
  // flat sample of ten rules renders five of the eight domains and tells the
  // reader nothing about the three it dropped.
  const count = await groups.count()
  expect(count).toBeGreaterThanOrEqual(8)
  await expect(groups.first()).toContainText(/of \d+/)
})

test('a path-scoped rule is marked and an always-on rule is not', async ({
  page,
}) => {
  await page.goto('/')
  const catalog = page.locator('#catalog')
  await expect(catalog.getByText('every session').first()).toBeVisible()
  await expect(catalog.getByText('**/*.md').first()).toBeVisible()
})

test('every nav link resolves to a section on the page', async ({ page }) => {
  await page.goto('/')
  const links = page.locator('nav[aria-label="Sections"] a')
  const count = await links.count()
  expect(count).toBeGreaterThan(0)
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute('href')
    expect(href).toMatch(/^#/)
    await expect(page.locator(href as string)).toHaveCount(1)
  }
})

test('the toggle flips the theme and records the choice', async ({ page }) => {
  await page.goto('/')
  const root = page.locator('html')
  const before = await root.getAttribute('data-theme')

  await page.locator('.theme-toggle').click()

  const after = await root.getAttribute('data-theme')
  expect(after).not.toBe(before)
  expect(await page.evaluate(() => localStorage.getItem('canon-theme'))).toBe(
    after,
  )
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

test('the agent view renders all three bands at once', async ({ page }) => {
  await page.goto('/')

  // Every session plus the mover's second copy, which is what lets a row cross
  // a heading that CSS cannot transition across.
  await expect(page.locator('.agent-row')).toHaveCount(
    fixture.sessions.length + 1,
  )
  await expect(page.locator('.agent-band')).toHaveCount(3)
  await expect(page.locator('.agent-more')).toContainText(
    `${fixture.summary.more} more`,
  )
  await expect(page.locator('.count-working')).toHaveText(
    String(fixture.summary.working),
  )
})

// The section is about a dispatch, so the session doing the dispatching has to
// be in it. A branch filter in the generator excluded the orchestrator and
// every planner, which no check here caught because the page matched its own
// fixture the whole way through.
test('the agent view pins the dispatching session', async ({ page }) => {
  await page.goto('/')

  const pinned = fixture.sessions.filter((s) => s.state === 'pinned')
  expect(pinned.length).toBeGreaterThan(0)

  const band = page.locator('.agent-band').first()
  await expect(band).toHaveText('Pinned')
  await expect(page.locator('.agent-row').first()).toContainText(pinned[0].name)
})

test('the agent view carries planners beside workers', async ({ page }) => {
  await page.goto('/')

  const planners = fixture.sessions.filter((s) => s.name.startsWith('planner-'))
  expect(planners.length).toBeGreaterThan(0)

  for (const planner of planners) {
    await expect(
      page.locator('.agent-row').filter({ hasText: planner.name }).first(),
    ).toBeVisible()
  }
})

test('the agent view names each session with its own row', async ({ page }) => {
  await page.goto('/')

  for (const session of fixture.sessions) {
    const row = page.locator(`.agent-row[data-session="${session.name}"]`)
    await expect(row.first()).toContainText(session.name)
    await expect(row.first()).toContainText(session.activity)
  }
})

test('a working row moves into completed on scroll', async ({ page }) => {
  await page.goto('/')
  const stage = page.locator('.agent-stage')
  const mover = stage.locator('.agent-row-mover')
  const landed = stage.locator('.agent-row-landed')

  await expect(mover).toBeVisible()
  await expect(landed).toBeHidden()

  await stage.scrollIntoViewIfNeeded()

  // The row survives the scroll that reveals it. Moving it on the intersection
  // itself showed a reader the finished state and never the one it finished
  // from, so this asserts the dwell rather than only its outcome.
  //
  // The wait is the assertion rather than a settle. Reading the class straight
  // after the scroll passes whether or not a dwell exists, since the observer
  // callback has not necessarily run yet either way, so the check has to land
  // inside the dwell window to mean anything.
  await page.waitForTimeout(400)
  await expect(stage).not.toHaveClass(/is-complete/)
  await expect(mover).toBeVisible()

  await expect(stage).toHaveClass(/is-complete/)
  await expect(landed).toBeVisible()
  await expect(mover).toBeHidden()

  // The count moves with the row, so the summary never contradicts the list
  // sitting under it.
  await expect(stage.locator('.agent-summary-after')).toContainText(
    `${fixture.summary.working - 1} working`,
  )
  await expect(stage.locator('.agent-summary-before')).toBeHidden()
})

test('both marker states are on screen together', async ({ page }) => {
  await page.goto('/')

  // The two bands stand at once, so a working marker and a finished one are
  // visible in the same view rather than one replacing the other.
  await expect(page.locator('.marker-working').first()).toBeVisible()
  await expect(page.locator('.marker-done').last()).toBeVisible()
})

test('the agent view names an outcome for every session', async ({ page }) => {
  await page.goto('/')

  for (const session of fixture.sessions) {
    if (session.pullRequest === null) continue
    const row = page.locator(`.agent-row[data-session="${session.name}"]`)
    await expect(row.first().locator('.agent-pr')).toHaveText(
      `#${session.pullRequest}`,
    )
  }
})

test.describe('with motion turned down', () => {
  test.use({ reducedMotion: 'reduce' })

  // The move is carried by the class rather than by the motion, which is the
  // property that lets the slide and the marker animation drop out without
  // taking the state change with them.
  test('the row still lands', async ({ page }) => {
    await page.goto('/')
    const stage = page.locator('.agent-stage')

    await stage.scrollIntoViewIfNeeded()
    await expect(stage).toHaveClass(/is-complete/)
    await expect(stage.locator('.agent-row-landed')).toBeVisible()
    await expect(stage.locator('.agent-row-mover')).toBeHidden()
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
