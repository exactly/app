import 'dotenv/config';
import dotenvPlugin from 'cypress-dotenv';
import preprocessor from '@cypress/webpack-preprocessor';
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
    setupNodeEvents: (on, config) => {
      const options = {
        ...preprocessor.defaultOptions,
        webpackOptions: {
          resolve: { extensions: ['.ts', '.js'] },
          module: { rules: [{ test: /\.ts$/, exclude: [/node_modules/], use: [{ loader: 'ts-loader' }] }] },
        },
      };
      on('file:preprocessor', preprocessor(options));
      return dotenvPlugin(config);
    },
  },
});
