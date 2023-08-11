import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { createConfig, configureChains, ChainProviderFn, Chain } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import * as wagmiChains from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { SafeConnector } from 'wagmi/connectors/safe';
import { optimism } from 'wagmi/chains';

declare global {
  interface Window {
    rpcURL?: string;
  }
}
const rpcURL = typeof window !== 'undefined' ? window?.rpcURL : undefined;

export const walletConnectId = '11ddaa8aaede72cb5d6b0dae2fed7baa';

const networkId = Number(process.env.NEXT_PUBLIC_NETWORK ?? optimism.id);
export const defaultChain = Object.values(wagmiChains).find((c) => c.id === networkId) ?? optimism;

const sortedChains = [defaultChain, ...Object.values(wagmiChains).filter((c) => c.id !== defaultChain.id)];

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

export const isE2E: boolean = JSON.parse(process.env.NEXT_PUBLIC_IS_E2E ?? 'false');

const providers: ChainProviderFn<Chain>[] =
  isE2E && rpcURL
    ? [jsonRpcProvider({ rpc: () => ({ http: rpcURL }) })]
    : [
        ...(alchemyKey ? [alchemyProvider({ apiKey: alchemyKey })] : []),
        publicProvider(),
        w3mProvider({ projectId: walletConnectId }),
      ];

const { chains, publicClient } = configureChains<Chain>(sortedChains, providers);

export const wagmi = createConfig({
  connectors: [
    ...(isE2E
      ? [new InjectedConnector({ chains: sortedChains, options: { name: 'E2E', shimDisconnect: false } })]
      : [...w3mConnectors({ projectId: walletConnectId, chains }), new SafeConnector({ chains })]),
  ],
  publicClient,
});

export const web3modal = new EthereumClient(wagmi, chains);
