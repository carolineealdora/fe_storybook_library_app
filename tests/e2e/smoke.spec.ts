import { expect, test } from '@playwright/test'
import { login, watchErrors } from './helpers'

// Read-only: visits every screen without buying, subscribing, cancelling or changing the PIN,
// so it is safe to run against the backend's shared database (pnpm e2e smoke).
test('every screen loads against the real backend', async ({ page }) => {
  const errors = watchErrors(page)
  await login(page)

  const cards = page.getByRole('button', { name: /, ages / })
  expect(await cards.count()).toBeGreaterThan(0)

  // Book detail, then the reader for the first book the account can open.
  await cards.first().click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.goto('/')
  const readable = page
    .getByRole('button', { name: /, ages [^,]+, (Free|Owned|Subscribed)$/ })
    .first()
  if ((await readable.count()) > 0) {
    await readable.click()
    await page.getByRole('link', { name: 'Read' }).click()
    // Either the book opens, or the viewer shows its friendly error for a broken EPUB.
    await expect(
      page.getByText(/Page \d+ of \d+/).or(page.getByText("We couldn't open this book")),
    ).toBeVisible({ timeout: 15_000 })
  }

  for (const [path, heading] of [
    ['/my-books', 'My Book'],
    ['/settings', 'Settings'],
    ['/settings/orders', 'Order history'],
    ['/settings/subscriptions', 'Subscription history'],
  ] as const) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
    await expect(page.getByRole('status')).toHaveCount(0) // loading finished
    await expect(page.getByRole('alert')).toHaveCount(0) // no error state
  }

  await page.goto('/subscription')
  await expect(
    page
      .getByRole('heading', { name: 'Read every book in the library' })
      .or(page.getByRole('heading', { name: 'Monthly plan' })),
  ).toBeVisible()

  // Child view needs no PIN to enter; view mode is stored in the browser only.
  await page.goto('/')
  await page.getByRole('button', { name: 'Child', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Pick a story!' })).toBeVisible()
  await expect(page.getByText(/Rp \d/)).toHaveCount(0)
  await page.getByRole('link', { name: 'My Book' }).click()
  await expect(page.getByRole('heading', { name: 'My books' })).toBeVisible()

  expect(errors).toEqual([])
})
