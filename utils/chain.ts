import { mainnet, goerli, optimism } from 'wagmi/chains';

export const walletConnectId = '11ddaa8aaede72cb5d6b0dae2fed7baa';

declare global {
  interface Window {
    rpcURL?: string;
  }
}

export const isE2E = JSON.parse(process.env.NEXT_PUBLIC_IS_E2E ?? 'false');
export const e2eRPCURL = typeof window !== 'undefined' ? window?.rpcURL : undefined;

export const supportedChains = [
  mainnet,
  optimism,
  ...(JSON.parse(process.env.NEXT_PUBLIC_ENABLE_TESTNETS ?? 'false') ? [goerli] : []),
];

export function isSupported(id?: number): boolean {
  return Boolean(id && supportedChains.find((c) => c.id === id));
}

export const defaultChain = { mainnet, optimism, goerli }[process.env.NEXT_PUBLIC_NETWORK ?? 'mainnet'] ?? mainnet;
