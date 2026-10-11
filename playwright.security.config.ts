import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/security', testMatch: '*.spec.ts', workers: 1, retries: 0,
  reporter: [['list'],['json',{outputFile:'test-results/security-results.json'}]],
  use: {baseURL:'https://localhost:3443',ignoreHTTPSErrors:true,trace:'retain-on-failure'},
  projects: [{name:'chromium',use:{...devices['Desktop Chrome']}}],
  webServer: {command:'node tests/security/servers.mjs',url:'https://localhost:3443/login',ignoreHTTPSErrors:true,timeout:120000,reuseExistingServer:false},
});
