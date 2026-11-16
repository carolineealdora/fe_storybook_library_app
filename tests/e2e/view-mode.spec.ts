import { expect, test } from '@playwright/test'
import { login, setPin, watchErrors } from './helpers'

// Flow 9.4: parent hands the device to the child, then takes it back with the PIN.
test('switch to Child view and back with the PIN', async ({ page }) => {
  const errors = watchErrors(page)
  await login(page)
  await setPin(page)

  await page.goto('/')
  await page.getByRole('button', { name: 'Child', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Pick a story!' })).toBeVisible()
  await expect(page.getByText(/Rp \d/)).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0)

  const locked = page.getByRole('button', { name: /, locked/ }).first()
  if ((await locked.count()) > 0) {
    await locked.click()
    await expect(page.getByText('Ask your parent to unlock this book.')).toBeVisible()
    await page.getByRole('button', { name: 'Okay!' }).click()
  }

  // Child view can't reach Settings by URL either.
  await page.goto('/settings')
  await expect(page).toHaveURL(/\/$/)

  await page.getByRole('button', { name: 'Parent', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Enter parent PIN' })).toBeVisible()
  for (const d of '1234') await page.getByRole('button', { name: d, exact: true }).click()
  await expect(page.getByRole('heading', { name: 'All books' })).toBeVisible()
  expect(errors).toEqual([])
})
