import { defineConfig } from 'cypress';

export default defineConfig({
  userAgent: 'cypress',
  video: false,
  screenshotsFolder: 'tests/e2e/screenshots',
  videosFolder: 'tests/e2e/videos',
  chromeWebSecurity: true,
  viewportWidth: 1920,
  viewportHeight: 1080,
  env: {
    coverage: false,
  },
  defaultCommandTimeout: 30000,
  pageLoadTimeout: 30000,
  requestTimeout: 30000,
  e2e: {
    testIsolation: false,
    baseUrl: 'http://localhost:3000',
    specPattern: 'tests/e2e/specs/**/*.ts',
    supportFile: 'tests/e2e/support.ts',
  },
});
