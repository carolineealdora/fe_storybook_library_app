import { expect, test } from '@playwright/test'
import { login, setPin, watchErrors } from './helpers'

// Visual check (CLAUDE.md §6): key screens at phone, tablet and desktop widths.
const widths = [375, 768, 1280] as const

// A plain browser window resized per width; Pixel 7 emulation at 1280px isn't a real device.
test.use({ isMobile: false, hasTouch: false })
const shot = (name: string, width: number) => `test-results/screens/${width}-${name}.png`

for (const width of widths) {
  test(`screens at ${width}px`, async ({ page }) => {
    const errors = watchErrors(page)
    await page.setViewportSize({ width, height: width === 1280 ? 800 : width === 768 ? 1024 : 812 })

    await page.goto('/login')
    await page.screenshot({ path: shot('login', width) })
    await login(page)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: shot('home-parent', width), fullPage: true })

    await page
      .getByRole('button', { name: /, ages / })
      .first()
      .click()
    await page.waitForLoadState('networkidle')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await page.screenshot({ path: shot('book-detail', width) })

    await page.goto('/subscription')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: shot('subscription', width) })

    await page.goto('/settings')
    await page.screenshot({ path: shot('settings', width) })

    await setPin(page)
    await page.goto('/')
    await page.getByRole('button', { name: 'Child', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Pick a story!' })).toBeVisible()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: shot('home-child', width), fullPage: true })

    // First book the child can open; a broken EPUB shows the viewer's error state instead.
    await page
      .getByRole('button', { name: /, ages [^,]+(, free)?$/ })
      .first()
      .click()
    await expect(
      page.getByText(/Page 1 of/).or(page.getByText("We couldn't open this book")),
    ).toBeVisible({ timeout: 15_000 })
    await page.screenshot({ path: shot('reader-day', width) })
    await page.getByRole('button', { name: 'night' }).click()
    await page.screenshot({ path: shot('reader-night', width) })

    await page.goto('/')
    await page.getByRole('button', { name: 'Parent', exact: true }).click()
    await page.screenshot({ path: shot('pin-prompt', width) })
    for (const d of '1234') await page.getByRole('button', { name: d, exact: true }).click()
    await expect(page.getByRole('heading', { name: 'All books' })).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(overflow, 'no horizontal scroll').toBe(false)
    expect(errors).toEqual([])
  })
}
