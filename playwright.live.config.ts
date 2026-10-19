// Playwright config for the real-backend suites (local, dev, prod).
// Run through `node e2e/run.mjs <env> ...` (see package.json scripts), which sets TEST_ENV.
import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, TEST_ENV } from './e2e/config/env';

const browsers = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
];

export default defineConfig({
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,                         // one run id, shared QA data: keep everything in order
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: [
    ['list'],
    ['./e2e/reporters/progress.ts'],
    ['html', { outputFolder: `playwright-report/${TEST_ENV}`, open: 'never' }],
    ['json', { outputFile: `playwright-report/${TEST_ENV}/results.json` }],
  ],
  outputDir: `test-results/${TEST_ENV}`,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'setup',
      testDir: './e2e/fixtures',
      testMatch: /auth\.setup\.ts/,
      teardown: 'cleanup',
    },
    {
      name: 'cleanup',
      testDir: './e2e/fixtures',
      testMatch: /global-cleanup\.ts/,
    },
    ...browsers.map(b => ({
      ...b,
      testDir: './e2e/specs',
      dependencies: ['setup'],
    })),
  ],
  webServer:
    TEST_ENV === 'local' && process.env['START_SERVER'] !== '0'
      ? { command: 'npm start', url: BASE_URL, reuseExistingServer: true, timeout: 180_000 }
      : undefined,
});
