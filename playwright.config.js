const { defineConfig, devices } = require('@playwright/test');

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const EVIDENCE_DIR = 'evidencias';

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  outputDir: `${EVIDENCE_DIR}/test-results`,
  reporter: [
    ['list'],
    ['html', { outputFolder: `${EVIDENCE_DIR}/relatorio/html-report`, open: 'never' }],
    ['json', { outputFile: `${EVIDENCE_DIR}/relatorio/results.json` }],
    ['junit', { outputFile: `${EVIDENCE_DIR}/relatorio/junit.xml` }]
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on',
    screenshot: { mode: 'on', fullPage: true },
    video: 'on',
    actionTimeout: 10_000,
    navigationTimeout: 15_000
  },
  webServer: {
    command: 'npm start --prefix backend',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.js/
    },
    {
      name: 'api',
      testMatch: /api\.spec\.js/
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/admin.json' },
      testIgnore: [/auth\.setup\.js/, /api\.spec\.js/],
      dependencies: ['setup']
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: 'tests/.auth/admin.json' },
      testIgnore: [/auth\.setup\.js/, /api\.spec\.js/],
      dependencies: ['setup']
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: 'tests/.auth/admin.json' },
      testIgnore: [/auth\.setup\.js/, /api\.spec\.js/],
      dependencies: ['setup']
    }
  ]
});
