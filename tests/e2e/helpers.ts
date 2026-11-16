import { expect, type Page } from '@playwright/test'

// The backend's seeded mock parent (SEED_PARENT_* in storybook_management_app); kept out of the repo.
export const PARENT_EMAIL = process.env.E2E_PARENT_EMAIL ?? 'parent@mainstory.test'
const PASSWORD = process.env.E2E_PARENT_PASSWORD ?? ''
if (!PASSWORD) throw new Error('Set E2E_PARENT_PASSWORD to the seeded mock parent password.')

/** Collects console errors and failed or 5xx requests. Expected 4xx (402, 403) are business outcomes. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    if (/Failed to load resource: the server responded with a status of 4\d\d/.test(msg.text()))
      return
    // epubjs renders pages in a sandboxed iframe without allow-scripts (allowScriptedContent: false),
    // so Chrome reports the blocked EPUB scripts; that is the intended protection. epubjs also
    // registers a deprecated `unload` listener inside that iframe. Both come from the library.
    if (/Blocked script execution in 'about:srcdoc'/.test(msg.text())) return
    if (/Permissions policy violation: unload is not allowed/.test(msg.text())) return
    errors.push(`console: ${msg.text()}`)
  })
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('requestfailed', (req) => {
    if (req.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`requestfailed: ${req.url()}`)
  })
  page.on('response', (res) => {
    if (res.status() >= 500) errors.push(`${res.status()}: ${res.url()}`)
  })
  return errors
}

export async function login(page: Page, email = PARENT_EMAIL) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByRole('heading', { name: 'All books' })).toBeVisible()
  await expect(page.getByRole('button', { name: /, ages / }).first()).toBeVisible()
}

/** Sets PIN 1234, whether or not one already exists (re-runnable). */
export async function setPin(page: Page) {
  await page.goto('/settings/pin')
  await page.getByLabel('New PIN').fill('1234')
  await page.getByLabel('Confirm PIN').fill('1234')
  const password = page.getByLabel('Account password')
  if (await password.isVisible()) await password.fill(PASSWORD)
  await page.getByRole('button', { name: 'Save PIN' }).click()
  await expect(page.getByRole('link', { name: /Parent PIN\s+Set/ })).toBeVisible()
}
