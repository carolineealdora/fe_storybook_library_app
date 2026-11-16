import { expect, test } from '@playwright/test'
import { login, watchErrors } from './helpers'

// Flows 9.2 + 9.3: subscribe → everything unlocks → cancel → locks again (leaves the account Free).
test('subscribe from the banner, then cancel in Settings', async ({ page }) => {
  const errors = watchErrors(page)
  await login(page)
  const header = page.getByRole('banner')
  await expect(header.getByText('Free', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Subscribe' }).click()
  await expect(page.getByRole('heading', { name: 'Read every book in the library' })).toBeVisible()
  await page.getByRole('button', { name: 'Checkout' }).click()
  await page.getByRole('button', { name: /^Pay Rp/ }).click()
  await expect(page.getByRole('heading', { name: "You're subscribed!" })).toBeVisible()
  await page.getByRole('link', { name: 'Start reading' }).click()

  await expect(header.getByText('Subscribed', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /, locked/ })).toHaveCount(0)

  await page.getByRole('link', { name: 'Settings' }).click()
  await page.getByRole('link', { name: /Subscription\s+Subscribed/ }).click()
  await page.getByRole('button', { name: 'Cancel subscription' }).click()
  await page.getByRole('button', { name: 'Yes, cancel now' }).click()
  await expect(page.getByRole('heading', { name: 'Read every book in the library' })).toBeVisible()

  await page.goto('/')
  await expect(header.getByText('Free', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /, locked/ }).first()).toBeVisible()

  await page.goto('/settings/subscriptions')
  await expect(page.getByText('Cancelled').first()).toBeVisible()
  expect(errors).toEqual([])
})
