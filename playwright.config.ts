import { defineConfig, devices } from '@playwright/test'

// E2E runs against the real backend, seeded with scripts/seed-books.py.
// Point it elsewhere with E2E_API_BASE_URL (default http://localhost:9999/api/v1).
const apiBaseUrl = process.env.E2E_API_BASE_URL ?? 'http://localhost:9999/api/v1'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:5173', trace: 'retain-on-failure' },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: 'pnpm dev --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    env: { VITE_API_BASE_URL: apiBaseUrl },
  },
})
