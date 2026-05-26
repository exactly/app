import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  project: ['**/*.{ts,tsx,js,jsx,json}'],
  ignoreDependencies: [
    '@base-org/account',
    '@coinbase/wallet-sdk',
    '@safe-global/safe-apps-provider',
    '@sentry/cli',
    '@walletconnect/ethereum-provider',
    'sharp',
    'solmate',
    'ts-node',
  ],
  entry: ['wagmi.config.ts'],
};

export default config;
