import { expect, test } from '@playwright/test'
import { login, watchErrors } from './helpers'

// Flow 9.1: free user → buy a book (after one failed payment) → read it.
test('buy a locked book, then read it in day and night mode', async ({ page }) => {
  const errors = watchErrors(page)
  await login(page)

  const locked = page.getByRole('button', { name: /, locked, Rp/ }).first()
  test.skip((await locked.count()) === 0, 'No locked books left; re-create the E2E database.')
  const title = (await locked.getAttribute('aria-label'))!.split(',')[0]!
  await locked.click()

  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await page.getByRole('button', { name: 'Buy Now' }).click()
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()

  await page.getByRole('button', { name: 'Simulate failed payment' }).click()
  await expect(page.getByRole('heading', { name: "Payment didn't go through" })).toBeVisible()
  await page.getByRole('button', { name: 'Back to Checkout' }).click()

  await page.getByRole('button', { name: /^Pay Rp/ }).click()
  await expect(page.getByRole('heading', { name: `${title} is yours!` })).toBeVisible()
  await page.getByRole('link', { name: 'Read Now' }).click()

  await expect(page.getByText('Page 1 of 5')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: '‹ Back' })).toBeDisabled()
  await page.getByRole('button', { name: 'Next ›' }).click()
  await expect(page.getByText('Page 2 of 5')).toBeVisible()
  await page.getByRole('button', { name: 'night' }).click()
  await expect(page.getByRole('button', { name: 'night' })).toHaveAttribute('aria-pressed', 'true')

  await page.goto('/my-books')
  await expect(page.getByRole('link', { name: `Read ${title}` })).toBeVisible()
  await page.goto('/settings/orders')
  await expect(page.getByText('Paid').first()).toBeVisible()
  await expect(page.getByText('Failed').first()).toBeVisible()
  expect(errors).toEqual([])
})
