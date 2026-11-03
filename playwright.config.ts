import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3002',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx next start -p 3002',
    port: 3002,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST || '',
      DATABASE_URL_TEST: process.env.DATABASE_URL_TEST || '',
      NODE_ENV: 'production',
      PLAYWRIGHT: 'true',
    },
  },
});
