import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  project: ['**/*.{ts,tsx,js,jsx,json}'],
  ignoreDependencies: [
    '@base-org/account',
    '@coinbase/wallet-sdk',
    '@metamask/connect-evm',
    '@safe-global/safe-apps-provider',
    '@sentry/cli',
    '@walletconnect/ethereum-provider',
    'porto',
    'sharp',
    'solmate',
    'ts-node',
  ],
  entry: ['wagmi.config.ts'],
};

export default config;
