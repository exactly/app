import { QueryClient } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createStorage, fallback, http, type Transport } from 'wagmi';
import { optimism } from 'viem/chains';
import * as viemChains from 'viem/chains';
import type { Address, Chain, Hex } from 'viem';

import { e2eConnector } from './connectors';

declare global {
  interface Window {
    e2e?: { rpc: string; chainId: number; privateKey: Hex };
  }
}

export const walletConnectId = '11ddaa8aaede72cb5d6b0dae2fed7baa';

const e2e = typeof window !== 'undefined' ? window.e2e : undefined;
export const isE2E = Boolean(JSON.parse(process.env.NEXT_PUBLIC_IS_E2E ?? 'false') && e2e);

const networkId = Number(process.env.NEXT_PUBLIC_NETWORK ?? optimism.id);
export const defaultChain: Chain = Object.values(viemChains).find((chain) => chain.id === networkId) ?? optimism;

const sortedChains = (
  isE2E ? [defaultChain] : [defaultChain, ...Object.values(viemChains).filter((chain) => chain.id !== defaultChain.id)]
) as [Chain, ...Chain[]];

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const alchemyRpcUrls = {
  1: (key: string) => `https://eth-mainnet.g.alchemy.com/v2/${key}`,
  10: (key: string) => `https://opt-mainnet.g.alchemy.com/v2/${key}`,
  8453: (key: string) => `https://base-mainnet.g.alchemy.com/v2/${key}`,
  84532: (key: string) => `https://base-sepolia.g.alchemy.com/v2/${key}`,
  11155420: (key: string) => `https://opt-sepolia.g.alchemy.com/v2/${key}`,
} satisfies Partial<Record<number, (key: string) => string>>;

function transportForChain(chain: Chain): Transport {
  if (isE2E && e2e) return http(e2e.rpc);

  const alchemyRpcUrl = alchemyKey
    ? Object.entries(alchemyRpcUrls).find(([chainId]) => Number(chainId) === chain.id)?.[1](alchemyKey)
    : undefined;
  const transports = alchemyRpcUrl ? [http(alchemyRpcUrl), http()] : [http()];
  return transports.length === 1 ? transports[0] : fallback(transports);
}

const transports = Object.fromEntries(sortedChains.map((chain) => [chain.id, transportForChain(chain)])) as Record<
  (typeof sortedChains)[number]['id'],
  Transport
>;

const storage = createStorage({
  storage: isE2E
    ? {
        getItem: () => null,
        setItem: () => undefined,
        removeItem: () => undefined,
      }
    : typeof window !== 'undefined'
      ? window.localStorage
      : undefined,
});

export const queryClient = new QueryClient();

export const chains = sortedChains;

export const wagmiAdapter = new WagmiAdapter({
  networks: chains,
  projectId: walletConnectId,
  ...(isE2E && e2e ? { connectors: [e2eConnector({ ...e2e, chains: sortedChains })] } : {}),
  transports,
  storage,
  ssr: true,
});

export const wagmi = wagmiAdapter.wagmiConfig;

createAppKit({
  adapters: [wagmiAdapter],
  networks: chains,
  projectId: walletConnectId,
  defaultNetwork: defaultChain,
  metadata: {
    name: 'Exactly Protocol',
    description: 'Exactly Protocol web app',
    url: 'https://app.exact.ly',
    icons: ['https://app.exact.ly/img/logo-black.svg'],
  },
  themeVariables: {
    '--w3m-font-family': 'Inter',
    '--w3m-z-index': 1201,
  },
});

export type ConfiguredChain = (typeof chains)[number];
export type ConfiguredChainId = ConfiguredChain['id'];
export type E2EAccount = Address;
