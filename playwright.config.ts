import { devices, type PlaywrightTestConfig } from '@playwright/test';
import 'dotenv/config';

const config: PlaywrightTestConfig = {
  testDir: './e2e/specs',
  testMatch: [/.*spec\.ts/],
  timeout: 666_666,
  expect: {
    timeout: 66_666,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.E2E_WORKERS ? { workers: Number(process.env.E2E_WORKERS) } : {}),
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'test-results/report' }],
    ['json', { outputFile: 'test-results/report/e2e-results.json' }],
    ['./e2e/report/trace.ts', { traceFile: 'test-results/report/e2e-trace.json' }],
  ],
  use: {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ['--disable-web-security'],
        },
      },
    },
  ],
  outputDir: 'test-results/artifacts',
  webServer: [
    {
      command: `PORT=${process.env.E2E_APP_PORT || 0} pnpm start:e2e`,
      timeout: 240_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe',
      wait: { stdout: /Local:\s+(?<PLAYWRIGHT_TEST_BASE_URL>https?:\/\/localhost:\d+)/ },
    },
    {
      command:
        'TS_NODE_TRANSPILE_ONLY=true NODE_NO_WARNINGS=1 node --experimental-specifier-resolution=node --loader ts-node/esm e2e/utils/anvil.ts',
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
      name: 'anvil',
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 240_000,
      wait: { stdout: new RegExp('Anvil server listening on (?<E2E_ANVIL_PORT>\\d+)') },
    },
  ],
};

export default config;
