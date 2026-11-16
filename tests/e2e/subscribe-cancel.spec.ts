import { expect, test, type Page } from '@playwright/test'
import { login, watchErrors } from './helpers'

async function subscribe(page: Page) {
  await page.goto('/')
  await page.getByRole('link', { name: 'Subscribe' }).click()
  await expect(page.getByRole('heading', { name: 'Read every book in the library' })).toBeVisible()
  await page.getByRole('button', { name: 'Checkout' }).click()
  await page.getByRole('button', { name: /^Pay Rp/ }).click()
  await expect(page.getByRole('heading', { name: "You're subscribed!" })).toBeVisible()
  await page.getByRole('link', { name: 'Start reading' }).click()
  await expect(page.getByRole('banner').getByText('Subscribed', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /, ages / }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /, locked/ })).toHaveCount(0)
}

async function cancel(page: Page) {
  await page.goto('/settings')
  await page.getByRole('link', { name: /Subscription\s+Subscribed/ }).click()
  await page.getByRole('button', { name: 'Cancel subscription' }).click()
  await page.getByRole('button', { name: 'Yes, cancel now' }).click()
  await expect(page.getByRole('heading', { name: 'Read every book in the library' })).toBeVisible()
  await page.goto('/')
  await expect(page.getByRole('banner').getByText('Free', { exact: true })).toBeVisible()
  await page.goto('/settings/subscriptions')
  await expect(page.getByText('Cancelled').first()).toBeVisible()
}

// Flows 9.2 + 9.3. Ends on the plan the account started with: a Free account subscribes then
// cancels; a subscribed one cancels then subscribes again (at the current plan price).
test('subscribe and cancel, leaving the account on its starting plan', async ({ page }) => {
  const errors = watchErrors(page)
  await login(page)
  const badge = page.getByRole('banner').getByText(/^(Free|Subscribed)$/)
  await expect(badge).toBeVisible()

  if ((await badge.textContent()) === 'Subscribed') {
    await cancel(page)
    await subscribe(page)
  } else {
    await subscribe(page)
    await cancel(page)
  }
  expect(errors).toEqual([])
})
