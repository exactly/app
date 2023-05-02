import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { createClient, configureChains, ChainProviderFn, Chain } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { mainnet, goerli, optimism } from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { SafeConnector } from 'wagmi/connectors/safe';
import { BaseProvider, WebSocketProvider } from '@ethersproject/providers';

declare global {
  interface Window {
    rpcURL?: string;
  }
}
const rpcURL = typeof window !== 'undefined' ? window?.rpcURL : undefined;

export const walletConnectId = '11ddaa8aaede72cb5d6b0dae2fed7baa';

export const supportedChains = [
  mainnet,
  optimism,
  ...(JSON.parse(process.env.NEXT_PUBLIC_ENABLE_TESTNETS ?? 'false') ? [goerli] : []),
];

export const defaultChain = { mainnet, optimism, goerli }[process.env.NEXT_PUBLIC_NETWORK ?? 'mainnet'];

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const providers: ChainProviderFn<Chain, BaseProvider, WebSocketProvider>[] =
  JSON.parse(process.env.NEXT_PUBLIC_IS_E2E ?? 'false') && rpcURL
    ? [jsonRpcProvider({ rpc: () => ({ http: rpcURL }) })]
    : [
        ...(alchemyKey ? [alchemyProvider({ priority: 0, apiKey: alchemyKey })] : []),
        publicProvider({ priority: 1 }),
        w3mProvider({ projectId: walletConnectId }),
      ];

const { chains, provider } = configureChains<Chain, BaseProvider, WebSocketProvider>(supportedChains, providers);

export const wagmi = createClient({
  connectors: [
    ...(JSON.parse(process.env.NEXT_PUBLIC_IS_E2E ?? 'false')
      ? [new InjectedConnector({ chains: supportedChains, options: { name: 'E2E' } })]
      : []),
    ...w3mConnectors({ projectId: walletConnectId, version: 1, chains }),
    new SafeConnector({ chains }),
  ],
  provider,
});

export const web3modal = new EthereumClient(wagmi, chains);
