import { createConfig, configureChains, ChainProviderFn, Chain, createStorage, Address } from 'wagmi';
import { optimism } from 'wagmi/chains';
import * as wagmiChains from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { SafeConnector } from 'wagmi/connectors/safe';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';

import { createWeb3Modal } from '@web3modal/wagmi/react';

import E2EConnector from './connectors';

declare global {
  interface Window {
    e2e: { rpc: string; chainId: number; privateKey: Address };
  }
}

export const walletConnectId = '11ddaa8aaede72cb5d6b0dae2fed7baa';
const e2e = typeof window !== 'undefined' ? window.e2e : null;
export const isE2E: boolean = JSON.parse(process.env.NEXT_PUBLIC_IS_E2E ?? 'false') && e2e;

const networkId = Number(process.env.NEXT_PUBLIC_NETWORK ?? optimism.id);
export const defaultChain = Object.values(wagmiChains).find((c) => c.id === networkId) ?? optimism;

const sortedChains = isE2E
  ? [defaultChain]
  : [defaultChain, ...Object.values(wagmiChains).filter((c) => c.id !== defaultChain.id)];

const providers: ChainProviderFn<Chain>[] = [
  jsonRpcProvider({
    rpc: () => ({ http: 'https://rpc.tenderly.co/fork/3b2ce27f-3cbe-482f-9e87-c21e4f185c18' }),
  }),
];

const { chains, publicClient } = configureChains<Chain>(sortedChains, providers);

const noopStorage = {
  getItem: () => '',
  setItem: () => null,
  removeItem: () => null,
};

export const wagmi = createConfig({
  connectors: [
    ...(isE2E && e2e
      ? [
          new E2EConnector({ chains, ...e2e }),
          new WalletConnectConnector({ chains, options: { projectId: walletConnectId, showQrModal: false } }),
        ]
      : [
          new InjectedConnector({ chains, options: { shimDisconnect: true } }),
          new CoinbaseWalletConnector({
            chains,
            options: {
              appName: 'Exactly Protocol',
              appLogoUrl: 'https://app.exact.ly/img/logo-black.svg',
              chainId: defaultChain.id,
            },
          }),
          new WalletConnectConnector({ chains, options: { projectId: walletConnectId, showQrModal: false } }),
          new SafeConnector({ chains }),
        ]),
  ],
  publicClient,
  ...(isE2E ? { storage: createStorage({ storage: noopStorage }) } : {}),
});

createWeb3Modal({
  wagmiConfig: wagmi,
  projectId: walletConnectId,
  chains,
  themeVariables: {
    '--w3m-font-family': 'Inter',
    '--w3m-z-index': 1201,
  },
});
