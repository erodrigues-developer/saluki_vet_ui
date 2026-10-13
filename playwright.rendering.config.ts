import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/rendering',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3101',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      // SSR requests /auth/me before rendering login. CI has no real API.
      name: 'Rendering API fixture',
      command: 'node tests/rendering/api-fixture.mjs',
      url: 'http://127.0.0.1:3100/api/v1/auth/me',
      reuseExistingServer: false,
      stdout: 'pipe',
      timeout: 30_000,
    },
    {
      name: 'Nuxt rendering',
      command: 'node .output/server/index.mjs',
      env: {
        NODE_ENV: 'production', HOST: '127.0.0.1', PORT: '3101',
        NUXT_API_UPSTREAM: 'http://127.0.0.1:3100',
      },
      url: 'http://127.0.0.1:3101/login',
      reuseExistingServer: false,
      stdout: 'pipe',
      timeout: 30_000,
    },
  ],
})
