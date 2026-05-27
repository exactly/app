import { join } from 'node:path';

import { devices, type PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

delete process.env.NO_COLOR;
process.env.E2E_ANVIL_STATE ??= join(process.cwd(), 'test-results', `anvil-${process.pid}.json`);

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
    process.env.CI ? ['blob'] : ['list'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['./e2e/report/trace.ts'],
  ],
  use: {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
    headless: true,
    actionTimeout: 10_000,
    baseURL: 'http://localhost:3000',
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
  outputDir: 'test-results/',
  webServer: [
    {
      command: 'pnpm start:e2e',
      timeout: 240_000,
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command:
        'TS_NODE_TRANSPILE_ONLY=true NODE_NO_WARNINGS=1 node --experimental-specifier-resolution=node --loader ts-node/esm e2e/utils/anvil.ts',
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
      name: 'anvil',
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 240_000,
      wait: { stdout: /Anvil server listening on (?<E2E_ANVIL_PORT>\d+)/ },
    },
  ],
};

export default config;
