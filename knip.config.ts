import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  project: ['**/*.{ts,tsx,js,jsx,json}'],
  ignoreDependencies: ['@sentry/cli', 'sharp', 'ts-node'],
  entry: ['wagmi.config.ts'],
};

export default config;
