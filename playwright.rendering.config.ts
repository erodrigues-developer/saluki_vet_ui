import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/rendering',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3101',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'node .output/server/index.mjs',
    env: { NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '3101' },
    url: 'http://127.0.0.1:3101/login',
    reuseExistingServer: false,
    timeout: 30_000,
  },
})
